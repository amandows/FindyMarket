from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from basis.models import Order

@login_required
def get_orders(request):
    user_name = request.user.user_name
    orders_count = Order.objects.filter(user_name=user_name, status='in_progress').count()
    orders = Order.objects.filter(user_name=user_name, status='in_progress').order_by('-created_at').values(
        'id', 'order_number',
        'created_at', 'order_details',
        'total_amount', 'status',
        'order_user_name',
        'order_tel_number',
        'order_adsress',
        'order_bank_check',
        'order_payment_status',
        'order_delivery_status',
        'courier_first_name',
        'courier_last_name',
        'courier_tel_number',
        'courier_car',
        'courier_car_number',
        'courier_status'
    )
    orders_list = list(orders)
    return JsonResponse({'orders_count': orders_count, 'orders': orders_list})



# Create your views here.
