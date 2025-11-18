# views.py

from django.shortcuts import render, redirect, get_object_or_404
from basis.models import Order
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

def my_orders(request):
    phone = request.GET.get('phone') or request.user.user_phone_number  # ищем по телефону
    orders = Order.objects.filter(order_tel_number=phone).order_by('-created_at')
    return render(request, 'my_orders/my_orders.html', {'orders': orders})


@login_required
def my_orders_ajax(request):
    phone = request.GET.get('phone') or request.user.user_phone_number
    orders = Order.objects.filter(order_tel_number=phone).order_by('-created_at')

    orders_data = [
        {
            'id': o.id,
            'status': o.status,
            'delivery_result': o.delivery_result,
            'created_at': o.created_at.strftime("%d.%m.%Y %H:%M")
        } for o in orders
    ]

    return JsonResponse({'orders': orders_data})


@csrf_exempt
def update_order_result_ajax(request, order_id, result):
    order = get_object_or_404(Order, id=order_id)

    if result == 'success':
        order.delivery_result = 'success'
    elif result == 'failed':
        order.delivery_result = 'failed'
    order.save()

    # Возвращаем JSON с обновлёнными данными
    return JsonResponse({
        'order_id': order.id,
        'delivery_result': order.delivery_result,
        'status_text': '✅ Завершен успешно' if order.delivery_result == 'success' else '🚫 Заказ не приехал'
    })