from django.utils import timezone
from datetime import timedelta
from geopy.distance import geodesic
from .models import Driver, OrderTaxi
from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification


def send_order_offer_push(user, order, timeout="10"):
    """
    Отправка пуша водителю с полным JSON заказом.
    """
    devices = FCMDevice.objects.filter(user=user, active=True)
    if devices.exists():
        # Текст пуша для уведомления
        body_text = f"{order.pickup_address}"

        # Формируем payload с полными данными заказа
        order_data = {
            "order_type": "ready_to_accept",
            "order_id": str(order.id),
        }

        message = Message(
            notification=Notification(
                title=f"Новая подача! {order.price} сом!",
                body=body_text
            ),
            data=order_data  # <-- весь JSON заказа
        )

        try:
            devices.send_message(message)
            print(f"[DEBUG] Пуш успешно отправлен пользователю {user.id}")
        except Exception as e:
            print(f"[ERROR] Ошибка при отправке FCM: {e}")


def find_drivers_for_order(order):
    print(f"\n[DEBUG] === ФОРМИРОВАНИЕ ОЧЕРЕДИ ДЛЯ ЗАКАЗА #{order.id} ===")
    customer_coords = (order.pickup_latitude, order.pickup_longitude)
    customer_city = order.customer.city
    two_hours_ago = timezone.now() - timedelta(hours=2)

    base_drivers = Driver.objects.filter(
        user__city__iexact=customer_city,
        status='online',
        is_active=True,
        car_class=order.car_class
    )

    if not base_drivers.exists():
        print(f"[DEBUG] !!! Свободных водителей в {customer_city} нет.")
        order.status = 'canceled'
        order.save()
        return []

    zones = [
        (0, 100, "100m"),
        (100, 200, "200m"),
        (200, 400, "400m"),
        (400, 1000, "1000m")
    ]

    full_queue_ids = []

    # Список для красивого итогового принта
    all_candidates_details = []

    for min_r, max_r, label in zones:
        zone_candidates = []

        for d in base_drivers:
            if d.latitude and d.longitude:
                dist = geodesic(customer_coords, (d.latitude, d.longitude)).meters

                if min_r < dist <= max_r:
                    order_count = OrderTaxi.objects.filter(
                        driver=d,
                        created_at__gte=two_hours_ago
                    ).count()

                    zone_candidates.append({
                        'id': d.id,
                        'name': d.user.get_full_name() or f"ID:{d.id}",
                        'orders_2h': order_count,
                        'rating': float(d.rating or 0),
                        'dist': round(dist, 1),
                        'zone': label
                    })

        if zone_candidates:
            # Сортируем внутри зоны
            zone_candidates.sort(key=lambda x: (x['orders_2h'], -x['rating'], x['dist']))

            for cand in zone_candidates:
                if len(full_queue_ids) < 10:
                    full_queue_ids.append(cand['id'])
                    all_candidates_details.append(cand)
                else:
                    break

        if len(full_queue_ids) >= 10:
            break

    # --- ПРИНТ ВСЕХ ПРЕТЕНДЕНТОВ ---
    if all_candidates_details:
        print(f"\n[DEBUG] === СПИСОК ПРЕТЕНДЕНТОВ (ТОП-10) ===")
        for i, c in enumerate(all_candidates_details, 1):
            print(
                f"{i}. [{c['zone']}] {c['name']} | Заказов: {c['orders_2h']} | Рейтинг: {c['rating']} | Дист: {c['dist']}м")
        print("-" * 45)

        return full_queue_ids

    print(f"[DEBUG] --- В радиусе 1км никого не найдено. Отмена заказа #{order.id} ---")
    order.status = 'canceled'
    order.save()
    return []


def move_to_next_driver(order):
    # 🔥 ГЛАВНАЯ ПРОВЕРКА: Если заказ уже не в ожидании, выходим
    if order.status != 'pending':
        print(f"[DEBUG] Пропуск переключения: Заказ #{order.id} уже имеет статус {order.status}")
        return

    print(f"\n[DEBUG] >>> Переключение водителя для заказа #{order.id}")
    current_list = order.search_history or []

    if not current_list:
        print(f"[DEBUG] Список поиска пуст. Отмена.")
        order.status = 'canceled'
        order.save()
        return

    # Определяем текущего водителя, чтобы найти следующего в списке
    # Используем driver_id, чтобы не делать лишний запрос к БД для объекта
    current_driver_id = order.driver_id

    try:
        if current_driver_id in current_list:
            start_idx = current_list.index(current_driver_id) + 1
        else:
            start_idx = 0
    except ValueError:
        start_idx = 0

    next_driver_found = False

    # Идем по списку дальше
    for i in range(start_idx, len(current_list)):
        # Снова проверяем статус внутри цикла (на случай микро-задержек)
        order.refresh_from_db()
        if order.status != 'pending':
            return

        candidate_id = current_list[i]
        try:
            candidate = Driver.objects.get(id=candidate_id)

            if candidate.status == 'online' and candidate.is_active:
                order.driver = candidate
                order.offered_at = timezone.now()
                order.save()

                # Отправляем пуш следующему
                send_order_offer_push(candidate.user, order)

                print(f"[DEBUG] Заказ #{order.id} предложен следующему ID:{candidate_id}")
                next_driver_found = True
                break
            else:
                print(f"[DEBUG] Пропуск ID:{candidate_id} - занят или оффлайн")

        except Driver.DoesNotExist:
            continue

    if not next_driver_found:
        print(f"[DEBUG] !!! Кандидаты закончились для заказа #{order.id}")
        order.status = 'canceled'
        order.driver = None
        order.save()