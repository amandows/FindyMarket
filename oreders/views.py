import json
from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification

from django.shortcuts import render
from basis.models import Order
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from collections import defaultdict
from django.utils import timezone, translation
from django.db.models import Sum
from .utils import send_push_to_user




@login_required
def orders_view(request):
    # Получаем все заказы пользователя, отсортированные по дате создания
    orders = Order.objects.filter(user_name=request.user.user_name).order_by('-created_at')

    # Подсчитываем количество заказов со статусом "in_progress"
    in_progress_count = orders.filter(status='in_progress').count()

    # Для каждого заказа считаем количество строк в order_details и добавляем новое поле
    for order in orders:
        order_details = order.order_details
        # Считаем количество строк в тексте с использованием split('\n')
        order.order_details_line_count = len(order_details.split('\n'))

    # Передаем данные в контекст
    context = {
        'orders': orders,
        'in_progress_count': in_progress_count,  # Добавляем количество заказов со статусом "in_progress"
    }
    return render(request, 'orders/orders.html', context)



@login_required
@csrf_exempt
def update_order_status(request):
    if request.method == 'POST':
        order_id = request.POST.get('order_id')
        status = request.POST.get('status')

        try:
            order = Order.objects.get(id=order_id)

            if status in ['in_progress', 'completed', 'cancelled', 'called']:
                order.status = status  # Обновление статуса курьера
                order.save()
                print(status)
                print(order.order_delivery_status)

                # Получаем все устройства для пуш-уведомлений
                # devices = FCMDevice.objects.all()
                devices = FCMDevice.objects.filter(user=order.user)
                print("USEEEEEEEEER: ", devices)

                # Определяем текст уведомления
                if status == 'completed':
                    if order.order_delivery_status == "Самовывоз":
                        body_text = f"Ваш заказ {order.order_number} готов 🍽. Можете забрать его."
                    else:
                        body_text = f"Ваш заказ {order.order_number} готов 🚕. Курьер уже едет к вам."
                else:
                    body_text = f"Статус вашего заказа №{order.order_number} обновлён: {order.status}"

                # Формируем сообщение
                message = Message(
                    notification=Notification(
                        title="Статус заказа",
                        body=body_text,
                        image="https://i.imgur.com/zYIlgBl.png"  # Опционально
                    ),
                    # data={
                    #     "order_id": str(order.id),
                    #     "status": order.status
                    # }
                )

                # Отправка только устройствам заказчика
                devices.send_message(message)

                return JsonResponse({'success': True})
            else:
                return JsonResponse({'success': False, 'error': 'Invalid status'}, status=400)

        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)




@csrf_exempt
def update_order_courier_status(request, order_id):
    if request.method == 'POST':
        try:
            order = Order.objects.get(id=order_id)
            data = json.loads(request.body)
            order.courier_status = data.get('courier_status', 'called')
            order.save()
            print(f'Статус курьера для заказа {order_id} обновлён на: {order.courier_status}')
            return JsonResponse({'success': True})
        except Order.DoesNotExist:
            print(f'Ошибка: Заказ с ID {order_id} не найден.')
            return JsonResponse({'error': 'Order not found'}, status=404)
        except json.JSONDecodeError:
            print('Ошибка: Неверный формат JSON в запросе.')
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    print('Ошибка: Неверный метод запроса.')
    return JsonResponse({'error': 'Invalid request'}, status=400)





@login_required
def user_orders_json(request):
    """
    This view fetches all orders of the logged-in user and returns data in JSON format.
    Accepts `year` and `month` parameters from the frontend.
    """
    year = int(request.GET.get('year', timezone.now().year))
    month = int(request.GET.get('month', timezone.now().month))

    # Получаем все заказы пользователя
    user_orders = Order.objects.filter(user_name=request.user.user_name)

    orders_count_by_day = defaultdict(int)
    cancelled_orders_count_by_day = defaultdict(int)
    total_amount = 0

    for order in user_orders:
        local_time = timezone.localtime(order.created_at)
        order_year = local_time.year
        order_month = local_time.month
        order_day = local_time.day

        # Если заказ соответствует выбранному году и месяцу
        if order_year == year and order_month == month:
            if order.status == 'completed':
                orders_count_by_day[order_day] += 1
                total_amount += order.total_amount  # Добавляем к общей сумме для успешных заказов
            elif order.status == 'cancelled':
                cancelled_orders_count_by_day[order_day] += 1

    orders_data = [{'year': year, 'month': month, 'day': day, 'count': count, 'status': 'completed', 'total_amount': order.total_amount}
                   for day, count in orders_count_by_day.items()]
    cancelled_orders_data = [{'year': year, 'month': month, 'day': day, 'count': count, 'status': 'cancelled'}
                             for day, count in cancelled_orders_count_by_day.items()]

    # Объединяем успешные и отмененные заказы
    orders_data.extend(cancelled_orders_data)

    print(f"total_amount: {total_amount}")
    # Преобразуем Decimal в float
    total_amount = float(total_amount)  # Преобразуем Decimal в float

    # Отправляем сумму успешных заказов как отдельное поле
    return JsonResponse({
        'orders': orders_data,
        'total_amount': total_amount
    })







@login_required
def orders_chart_view(request):
    """
    View для отображения HTML-страницы с графиком заказов.
    """
    translation.activate('ru')  # Активировать русский язык
    now = timezone.now()
    current_month = now.strftime('%B %Y')  # Получение текущего месяца и года

    # Получаем заказы текущего месяца для текущего пользователя
    user_orders_current_month = Order.objects.filter(
        user_name=request.user.user_name,
        created_at__year=now.year,
        created_at__month=now.month
    )

    # Получаем заказы прошлого месяца
    last_month = now.month - 1 if now.month > 1 else 12
    last_month_year = now.year if now.month > 1 else now.year - 1
    user_orders_last_month = Order.objects.filter(
        user_name=request.user.user_name,
        created_at__year=last_month_year,
        created_at__month=last_month
    )

    # Получаем все заказы для общего графика
    user_orders_all_time = Order.objects.filter(
        user_name=request.user.user_name
    )

    # Подсчитываем количество успешных и неудачных заказов
    successful_orders_count_current = user_orders_current_month.filter(status='completed').count()
    failed_orders_count_current = user_orders_current_month.filter(status='cancelled').count()

    successful_orders_count_last = user_orders_last_month.filter(status='completed').count()
    failed_orders_count_last = user_orders_last_month.filter(status='cancelled').count()

    successful_orders_count_all = user_orders_all_time.filter(status='completed').count()
    failed_orders_count_all = user_orders_all_time.filter(status='cancelled').count()

    # Сумма успешных заказов на деньги
    successful_orders_amount_current = user_orders_current_month.filter(status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    successful_orders_amount_last = user_orders_last_month.filter(status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    successful_orders_amount_all = user_orders_all_time.filter(status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0

    # Подготовка данных для шаблона
    context = {
        'current_month': current_month,
        'successful_orders_count_current': successful_orders_count_current,
        'failed_orders_count_current': failed_orders_count_current,
        'successful_orders_amount_current': successful_orders_amount_current,

        'successful_orders_count_last': successful_orders_count_last,
        'failed_orders_count_last': failed_orders_count_last,
        'successful_orders_amount_last': successful_orders_amount_last,

        'successful_orders_count_all': successful_orders_count_all,
        'failed_orders_count_all': failed_orders_count_all,
        'successful_orders_amount_all': successful_orders_amount_all,
    }

    return render(request, 'statistics/statistics.html', context)

