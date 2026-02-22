from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import OrderTaxi
from django.utils import timezone


def taxi(request):
    return render(request, 'taxi_del/taxi_del.html')





class CreateOrderView(APIView):
    def post(self, request):
        data = request.data
        try:
            # Создаем запись в базе данных
            order = OrderTaxi.objects.create(
                customer=request.user,  # Предполагаем, что юзер авторизован
                pickup_address=data.get('pickup_address'),
                pickup_latitude=data.get('pickup_latitude'),
                pickup_longitude=data.get('pickup_longitude'),
                destination_address=data.get('destination_address'),
                destination_latitude=data.get('destination_latitude'),
                destination_longitude=data.get('destination_longitude'),
                car_class=data.get('car_class'),
                price=data.get('price'),
                order_type=data.get('order_type', 'taxi'),
                status='pending'
            )
            return Response({"id": order.id, "order_number": order.order_number}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class CancelOrderView(APIView):
    def post(self, request, order_id):
        try:
            # Ищем заказ, который принадлежит текущему пользователю и еще не завершен
            order = OrderTaxi.objects.get(id=order_id, customer=request.user)

            if order.status in ['completed', 'canceled']:
                return Response({"error": "Заказ уже завершен или отменен"}, status=status.HTTP_400_BAD_REQUEST)

            # Обновляем статус и время отмены
            order.status = 'canceled'
            order.canceled_at = timezone.now()
            order.cancel_reason = request.data.get('reason', 'Отменено клиентом')
            order.save()

            return Response({"message": "Заказ отменен"})
        except OrderTaxi.DoesNotExist:
            return Response({"error": "Заказ не найден"}, status=status.HTTP_404_NOT_FOUND)


class OrderStatusView(APIView):
    def get(self, request, order_id):
        try:
            order = OrderTaxi.objects.get(id=order_id)
            response_data = {
                "status": order.status,
                "order_number": order.order_number,
                "bank_link": order.driver.bank_link,
            }

            if order.driver:
                driver_user = order.driver.user
                # Получаем URL фото или ставим заглушку, если фото нет
                photo_url = None
                if driver_user.user_logo:
                    photo_url = request.build_absolute_uri(driver_user.user_logo.url)
                else:
                    # Путь к стандартной иконке пользователя
                    photo_url = request.build_absolute_uri('/static/icons/default-avatar.png')

                response_data.update({
                    "driver_name": driver_user.get_full_name() or driver_user.user_name,
                    "driver_photo": photo_url,  # <--- Добавляем URL фото
                    "rating": str(order.driver.rating),
                    "vehicle_model": order.driver.vehicle_model,
                    "vehicle_number": order.driver.vehicle_number,
                    "vehicle_color": order.driver.vehicle_color,
                    "phone": order.driver.phone,
                })

            return Response(response_data)
        except OrderTaxi.DoesNotExist:
            return Response({"error": "Not found"}, status=404)