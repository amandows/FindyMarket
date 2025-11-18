import json
from datetime import datetime, timedelta
from django.shortcuts import render, redirect
from account.models import Courier
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from basis.models import Order
from basis.city_of_kg import CITY

def courier_page(request):
    context = {
        'CITY': [city for city, _ in CITY],  # Передаем только названия городов
    }
    return render(request, 'courier/courier.html', context)


@csrf_exempt
def register_or_login(request):
    if request.method == 'POST':
        data = request.POST
        try:
            # Check for existing user
            courier = Courier.objects.get(login=data['login'], password=data['password'])
        except Courier.DoesNotExist:
            # Create new user with city
            courier = Courier.objects.create(
                login=data['login'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                tel_number=data['tel_number'],
                car=data['car'],
                car_number=data['car_number'],
                city=data['courier-city']  # Save the city here
            )

        # Return data for localStorage
        courier_data = {
            'first_name': courier.first_name,
            'last_name': courier.last_name,
            'tel_number': courier.tel_number,
            'car': courier.car,
            'car_number': courier.car_number,
            'city': courier.city  # Include city in the returned data if needed
        }
        return JsonResponse(courier_data)
    return JsonResponse({'error': 'Invalid request'}, status=400)



def get_courier_orders(request):
    if request.method == 'GET':
        city = request.GET.get('city', None)
        orders = Order.objects.filter(
            courier_status='called', order_city=city
        ).order_by('-created_at').values(
            'id', 'order_number', 'total_amount', 'order_user_name',
            'user_name', 'created_at', 'order_details', 'status',
            'order_tel_number', 'order_adsress', 'order_bank_check',
            'order_payment_status', 'order_delivery_status', 'order_city'
        )

        formatted_orders = []
        for order in orders:
            # Корректируем время на +6 часов
            local_time = order['created_at'] + timedelta(hours=6)
            order['created_at'] = local_time.strftime('%d.%m.%Y, %H:%M:%S')
            formatted_orders.append(order)

        return JsonResponse(formatted_orders, safe=False)

    return JsonResponse({'error': 'Invalid request'}, status=400)



@csrf_exempt
def get_orders_by_ids(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        order_ids = data.get('order_ids', [])
        orders = Order.objects.filter(id__in=order_ids).values(
            'id', 'order_number', 'total_amount', 'order_user_name',
            'user_name', 'created_at', 'order_details', 'status',
            'order_tel_number', 'order_adsress', 'order_bank_check',
            'order_payment_status', 'order_delivery_status', 'order_city'
        )

        return JsonResponse(list(orders), safe=False)

    return JsonResponse({'error': 'Invalid request'}, status=400)




@csrf_exempt
def courier_update_order_status(request, order_id):
    if request.method == 'POST':
        data = json.loads(request.body)
        status = data.get('status')

        try:
            order = Order.objects.get(id=order_id)
            order.courier_status = status
            order.save()
            return JsonResponse({'message': 'Статус обновлён успешно'}, status=200)
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Заказ не найден'}, status=404)

    return JsonResponse({'error': 'Invalid request'}, status=400)




@csrf_exempt
def pickup_order(request, order_id):
    if request.method == 'POST':


        try:
            order = Order.objects.get(id=order_id)
            if order.courier_status == 'called':
                data = json.loads(request.body)
                order.courier_first_name = data.get('first_name')
                order.courier_last_name = data.get('last_name')
                order.courier_tel_number = data.get('tel_number')
                order.courier_car = data.get('car')
                order.courier_car_number = data.get('car_number')
                order.courier_status = 'pick_up'
                order.save()
                return JsonResponse({'message': 'Вы забрали заказ!'})
            elif order.courier_status == 'canceled':
                return JsonResponse({'error': 'Заказ отменен!'}, status=400)
            else:
                return JsonResponse({'error': 'Заказ уже забрали!'}, status=400)
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Заказ не найден!'}, status=404)
    return JsonResponse({'error': 'Неверный запрос.'}, status=400)
