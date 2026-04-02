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
                title=f"Новая подача! {order.price} сом! {order.driver}",
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
    print(f"\n[DEBUG] === НАЧАЛО ПОИСКА ДЛЯ ЗАКАЗА #{order.id} ===")
    customer_coords = (order.pickup_latitude, order.pickup_longitude)
    customer_city = order.customer.city

    # radii = [0.3, 0.5, 1.0, 3.0, 5.0, 10.0]
    radii = [5.0]
    two_hours_ago = timezone.now() - timedelta(hours=2)

    # 1. Фильтруем базу водителей по городу и статусу
    base_drivers = Driver.objects.filter(
        user__city__iexact=customer_city,
        status='online',
        is_active=True,
        car_class=order.car_class
    )

    print(f"[DEBUG] Город: {customer_city}. Найдено потенциальных водителей онлайн: {base_drivers.count()}")

    if base_drivers.count() == 0:
        print(f"[DEBUG] !!! Свободных водителей в городе {customer_city} нет совсем.")
        order.status = 'canceled'
        order.save()
        return []

    for radius in radii:
        print(f"[DEBUG] Проверка радиуса {radius} км...")
        candidates = []

        for d in base_drivers:
            if d.latitude and d.longitude:
                driver_coords = (d.latitude, d.longitude)
                dist = geodesic(customer_coords, driver_coords).km

                if dist <= radius:
                    order_count = OrderTaxi.objects.filter(
                        driver=d,
                        created_at__gte=two_hours_ago
                    ).count()

                    candidates.append({
                        'driver': d,
                        'orders_2h': order_count,
                        'rating': d.rating or 0
                    })

        if candidates:
            # Сортировка: меньше заказов -> выше рейтинг
            candidates.sort(key=lambda x: (x['orders_2h'], -x['rating']))
            ids = [c['driver'].id for c in candidates]
            print(f"[DEBUG] Найдено кандидатов в радиусе {radius}км: {len(ids)}. Очередь: {ids}")
            return ids

    # Если цикл прошел все радиусы и никого не нашел
    print(f"[DEBUG] --- В радиусе 10км никого не найдено. Отмена заказа #{order.id} ---")
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