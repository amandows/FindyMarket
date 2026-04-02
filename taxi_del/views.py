from django.shortcuts import render
from django.http import JsonResponse
from .services import find_drivers_for_order, move_to_next_driver, send_order_offer_push
from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt

# Импортируем ваши модели и утилиты
from .models import OrderTaxi, Driver
 # Ваша функция поиска в радиусе



def taxi(request):
    return render(request, 'taxi_del/taxi_del.html')


# 2. API для водителя (опрос каждые 10 сек)
def check_for_new_order(request):
    # Предполагаем, что водитель авторизован
    driver = request.user.driver_profile
    # Ищем заказ, где этот водитель назначен текущим
    order = OrderTaxi.objects.filter(driver=driver, status='pending').last()

    if order:
        return JsonResponse({
            'has_order': True,
            'order_id': order.id,
            'address': order.pickup_address,
            'price': order.price
        })
    return JsonResponse({'has_order': False})


# 3. Если водитель пропустил (таймер 10 сек истек)
@csrf_exempt
def skip_order_api(request, order_id):
    try:
        order = OrderTaxi.objects.filter(id=order_id).first()
        if not order:
            return JsonResponse({'status': 'error', 'message': 'Заказ не найден'}, status=404)

        if order.status != 'pending':
            return JsonResponse({'status': 'already_processed'})

        from .services import move_to_next_driver

        # Получаем нового водителя напрямую
        next_driver = move_to_next_driver(order)

        if next_driver:
            send_order_offer_push(next_driver.user, order)
            return JsonResponse({'status': 'ok', 'next_driver': next_driver.id})
        else:
            return JsonResponse({'status': 'no_more_drivers'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        print("DEBUG: Incoming data:", data)

        try:
            # 1. Валидация
            required_fields = ['pickup_latitude', 'pickup_longitude', 'price']
            for field in required_fields:
                if field not in data or not data.get(field):
                    return Response({"error": f"Поле {field} обязательно"}, status=400)

            # 2. Создание заказа
            order = OrderTaxi.objects.create(
                customer=request.user,
                pickup_address=data.get('pickup_address', ''),
                pickup_latitude=float(data.get('pickup_latitude')),
                pickup_longitude=float(data.get('pickup_longitude')),
                destination_address=data.get('destination_address', ''),
                destination_latitude=float(data.get('destination_latitude', 0)),
                destination_longitude=float(data.get('destination_longitude', 0)),
                car_class=data.get('car_class', 'econom'),
                price=data.get('price'),
                order_type=data.get('order_type', 'taxi'),
                distance=data.get('distance', 0),
                duration=data.get('duration', 0),
                status='pending'
            )

            # 3. Поиск
            driver_ids = find_drivers_for_order(order)
            print('ADDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD: ' + str(driver_ids))

            if driver_ids:
                first_driver_id = driver_ids[0]
                order.driver_id = first_driver_id
                order.search_history = driver_ids
                order.offered_at = timezone.now()
                order.save()

                # Используем ту же самую функцию!
                # Сначала получаем объект водителя, чтобы взять его .user
                first_driver = Driver.objects.get(id=first_driver_id)
                send_order_offer_push(first_driver.user, order)

                print(f"DEBUG: Order {order.id} offered to {first_driver_id}")

            return Response({
                "id": order.id,
                "status": order.status,
                "driver_assigned": bool(order.driver_id)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"!!! CREATE ORDER ERROR: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            # Ищем заказ клиента
            order = OrderTaxi.objects.get(id=order_id, customer=request.user)

            # Если заказ уже в финальном статусе, ничего не делаем
            if order.status in ['completed', 'canceled']:
                return Response({"error": "Заказ уже завершен или отменен"}, status=status.HTTP_400_BAD_REQUEST)

            # Сохраняем ссылку на водителя перед тем, как его удалить из заказа
            assigned_driver = order.driver

            # 1. Обновляем данные заказа
            order.status = 'canceled'
            order.canceled_at = timezone.now()
            order.cancel_reason = request.data.get('reason', 'Отменено клиентом')

            # 🔥 Удаляем водителя из заказа, чтобы он снова стал свободен в системе
            order.driver = None
            order.save()

            # 2. Если у заказа был назначен водитель (или он был в процессе предложения)
            if assigned_driver and assigned_driver.user:
                # Отправляем пуш водителю об отмене
                self.send_cancel_push(assigned_driver.user, order)
                print(f"DEBUG: Пуш об отмене отправлен водителю ID:{assigned_driver.id}")

            return Response({"message": "Заказ успешно отменен"})

        except OrderTaxi.DoesNotExist:
            return Response({"error": "Заказ не найден"}, status=status.HTTP_404_NOT_FOUND)

    def send_cancel_push(self, user, order):
        """Отправка уведомления об отмене через FCM"""

        devices = FCMDevice.objects.filter(user=user, active=True)
        if devices.exists():
            message = Message(
                notification=Notification(
                    title="Заказ отменен",
                    body=f"К сожалению, клиент отменил заказ #{order.id}"
                ),
                data={
                    "order_id": str(order.id),
                    "order_type": "canceled"  # 🔥 Тот самый тип, который мы ловим в JS
                }
            )
            try:
                devices.send_message(message)
            except Exception as e:
                print(f"Ошибка отправки пуша отмены: {e}")


class OrderStatusView(APIView):
    def get(self, request, order_id):
        try:
            # Используем select_related, чтобы подтянуть водителя и юзера одним запросом
            order = OrderTaxi.objects.select_related('driver__user').get(id=order_id)

            # Базовые данные, которые есть всегда
            response_data = {
                "status": order.status,
                "order_number": order.order_number,
                "bank_link": None,  # По умолчанию пусто
            }

            # Только если водитель уже назначен (статус accepted и далее)
            if order.driver:
                driver_profile = order.driver
                driver_user = driver_profile.user

                # Обработка фото
                if driver_user.user_logo:
                    photo_url = request.build_absolute_uri(driver_user.user_logo.url)
                else:
                    photo_url = request.build_absolute_uri('/static/icons/default-avatar.png')

                # Обновляем словарь данными водителя
                response_data.update({
                    "bank_link": driver_profile.bank_link,  # Теперь это безопасно
                    "driver_name": driver_user.get_full_name() or driver_user.username,
                    "driver_photo": photo_url,
                    "rating": str(driver_profile.rating),
                    "vehicle_model": driver_profile.vehicle_model,
                    "vehicle_number": driver_profile.vehicle_number,
                    "vehicle_color": driver_profile.vehicle_color,
                    "phone": driver_profile.phone,
                })

            return Response(response_data)
        except OrderTaxi.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)
        except Exception as e:
            # Логируем любую другую ошибку, чтобы не гадать
            print(f"Error in OrderStatusView: {e}")
            return Response({"error": "Server error"}, status=500)