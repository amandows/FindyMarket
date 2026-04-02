from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import render
from django.utils import timezone
from taxi_del.models import OrderTaxi, Driver
from taxi_del.services import move_to_next_driver  # Функция, которую мы писали ранее
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse


def taxi_driver(request):
    return render(request, 'taxi_driver/taxi_driver.html')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_for_new_order(request):
    """Водитель проверяет: назначен ли на него активный заказ"""
    try:
        driver = request.user.driver_profile
        # Ищем заказ, где этот водитель сейчас "цель" и статус еще ожидает
        order = OrderTaxi.objects.filter(driver=driver, status="pending").first()

        if order:
            return Response({
                "status": str(order.status),
                "has_order": True,
                "order_id": order.id,
                "pickup": order.pickup_address,
                "destination": order.destination_address,
                "price": str(order.price),
                "duration": order.duration,
                "distance": order.distance
            })
        return Response({"has_order": False})
    except Exception as e:
        return Response({"error": str(e)}, status=400)

# Функция для информации при сворачивании окон не отменен ли заказ
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_specific_order_status(request, order_id):
    """
    Проверка статуса конкретного заказа без should_close
    """
    try:
        order = OrderTaxi.objects.filter(id=order_id).first()

        if not order:
            return Response({
                "status": "not_found",
                "order_id": None
            })

        # Если заказ не принадлежит текущему водителю
        if order.driver != request.user.driver_profile:
            return Response({
                "status": "not_yours",
                "order_id": order.id
            })

        # Просто возвращаем текущий статус
        return Response({
            "status": str(order.status),
            "order_id": order.id,
        })

    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_order(request, order_id):
    """Принятие заказа"""
    try:
        order = OrderTaxi.objects.get(id=order_id)
        driver = request.user.driver_profile

        if order.status != 'pending':
            return Response({"success": False, "message": "Заказ уже неактивен"}, status=400)

        order.status = 'accepted'
        order.save()

        driver.status = 'busy'  # Опционально: меняем статус водителя
        driver.save()

        return Response({"success": True})
    except OrderTaxi.DoesNotExist:
        return Response({"error": "Заказ не найден"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def skip_order(request, order_id):
    """Водитель не успел/отказался — передаем следующему"""
    try:
        order = OrderTaxi.objects.get(id=order_id)
        move_to_next_driver(order)  # Наша логика переключения из services.py
        return Response({"status": "skipped"})
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_driver_init_data(request):
    try:
        driver = request.user.driver_profile
        today = timezone.now().date()

        # Считаем поездки именно за сегодня
        today_trips = OrderTaxi.objects.filter(
            driver=driver,
            status='completed',
            created_at__date=today
        ).count()

        return Response({
            "status": driver.status,  # 'online', 'offline', 'busy'
            "car": f"{driver.vehicle_color} {driver.vehicle_model} ({driver.vehicle_number})",
            "car_class": driver.get_car_class_display(),
            "role": driver.get_role_display(),
            "balance": str(driver.balance),
            "rating": str(driver.rating),
            "today_trips": today_trips,
            "city": request.user.city,
            "first_name": request.user.first_name,
        })
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_driver_status(request):
    try:
        # Используем твой related_name="driver_profile"
        driver = request.user.driver_profile
        new_status = request.data.get('status')  # 'online' или 'offline'

        if new_status in ['online', 'offline']:
            driver.status = new_status
            driver.save()
            return Response({"success": True, "current_status": driver.status})

        return Response({"success": False, "error": "Неверный статус"}, status=400)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_coordinates(request):
    try:
        driver = request.user.driver_profile
        driver.latitude = request.data.get('latitude')
        driver.longitude = request.data.get('longitude')
        driver.save()
        return Response({"success": True})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=400)


class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        new_status = request.data.get('status')

        try:
            # 1. Получаем профиль водителя (Driver instance)
            driver_profile = getattr(request.user, 'driver_profile', None)

            if not driver_profile:
                return Response({"error": "Вы не зарегистрированы как водитель"},
                                status=status.HTTP_403_FORBIDDEN)

            # 2. Ищем заказ, используя driver_profile, а не request.user
            order = OrderTaxi.objects.get(id=order_id, driver=driver_profile)

            old_status = order.status

            # 3. Логика списания комиссии 10 сом
            if new_status == 'in_progress' and old_status != 'in_progress':
                if driver_profile.balance >= 10:
                    driver_profile.balance -= 10
                    driver_profile.save()
                    print(f"Списано 10 сом с водителя {request.user.id}")
                else:
                    return Response({"error": "Недостаточно средств на балансе для начала поездки"},
                                    status=status.HTTP_400_BAD_REQUEST)

            # 4. Обновляем статус
            order.status = new_status
            order.save()

            return Response({
                "message": "Статус обновлен",
                "status": order.status,
                "new_balance": float(driver_profile.balance)
            })

        except OrderTaxi.DoesNotExist:
            return Response({"error": "Заказ не найден или вы не являетесь его водителем"},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Ошибка сервера: {str(e)}"},
                            status=status.HTTP_400_BAD_REQUEST)



def get_active_order_details(request):
    try:
        # 1. Получаем профиль водителя через related_name="driver_profile"
        # Используем getattr, чтобы избежать ошибки, если у юзера нет профиля водителя
        driver_instance = getattr(request.user, 'driver_profile', None)

        if not driver_instance:
            return JsonResponse({
                "success": False,
                "error": "У вашего аккаунта нет профиля водителя"
            }, status=403)

        # 2. Ищем активный заказ именно этого водителя
        order = OrderTaxi.objects.filter(
            driver=driver_instance,
            status__in=['accepted', 'on_way', 'arrived', 'in_progress']
        ).first()

        if not order:
            return JsonResponse({
                "success": False,
                "message": "Активный заказ не найден"
            }, status=404)

        # 3. Собираем данные (учитывая ваши поля из модели)
        return JsonResponse({
            "success": True,
            "order": {
                "order_id": order.id,
                "pickup": order.pickup_address,
                "destination": order.destination_address,
                "price": float(order.price) if order.price else 0,
                "status": order.status,
                "comment": getattr(order, 'comment', ""),
                "pickup_latitude": order.pickup_latitude,
                "pickup_longitude": order.pickup_longitude,
                "destination_latitude": order.destination_latitude,
                "destination_longitude": order.destination_longitude,
                # Безопасное получение данных клиента (customer)
                "customer_phone": order.customer.user_phone_number if order.customer else "Нет номера",
                "customer_name": order.customer.user_name if order.customer else "Клиент",
            }
        })

    except Exception as e:
        print(f"Критическая ошибка в API: {e}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)
