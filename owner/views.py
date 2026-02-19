from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from basis.models import Order
from django.db.models import Q

@login_required
def get_orders(request):
    user_name = request.user.user_name

    orders = Order.objects.filter(
        Q(user_name=user_name),
        Q(status='in_progress') | Q(status='accept')
    ).order_by('-created_at')

    orders_count = orders.filter(status='in_progress').count()

    orders = orders.values(
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

    return JsonResponse({
        'orders_count': orders_count,
        'orders': list(orders)
    })



# Create your views here.
