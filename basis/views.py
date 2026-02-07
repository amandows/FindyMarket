import json
from django.http import JsonResponse
from django.utils import timezone
from .models import Order, Food_menu
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os
from django.core.cache import cache
import datetime

def create_order(request):
    if request.method == 'POST':
        try:
            # Получаем данные из запроса формы
            order_user_name = request.POST.get('userName')
            order_number = request.POST.get('orderNumber')
            order_items = request.POST.get('orderItems')
            phone_number = request.POST.get('phoneNumber')
            address = request.POST.get('address')
            delivery_method = request.POST.get('deliveryMethod')
            payment_method = request.POST.get('paymentMethod')
            order_city = request.POST.get('orderCity')
            order_bank_check = request.FILES.get('orderBankCheck')  # Если чек загружен

            # Проверка на обязательные поля
            if not order_number or not order_items or not phone_number or not address or not delivery_method or not payment_method:
                return JsonResponse({'success': False, 'error': 'Missing order details'})

            # Преобразуем order_items из строки JSON в список Python
            try:
                order_items = json.loads(order_items)
            except json.JSONDecodeError:
                return JsonResponse({'success': False, 'error': 'Invalid order items format'})

            # Инициализация объекта заказа
            order = Order(
                user=request.user,
                order_number=order_number,
                total_amount=0,
                order_user_name=order_user_name,
                user_name='',
                created_at=timezone.now(),
                order_details='',
                order_tel_number=phone_number,
                order_adsress=address,
                order_payment_status=payment_method,
                order_city=order_city,
                order_delivery_status=delivery_method,
                status='in_progress',
            )

            order_details = []
            total_amount = 0
            user_name = None

            # Обработка каждого элемента заказа
            for item in order_items:
                food_id = item['foodId']
                quantity = int(item['quantity'])

                try:
                    food = Food_menu.objects.get(id=food_id)

                    # ✅ Проверка остатка
                    if food.quantity < quantity:
                        return JsonResponse({
                            'success': False,
                            'error': f'Недостаточно "{food.name}" на складе. Остаток: {food.quantity}'
                        })

                    # ✅ Цена с учётом скидки
                    price = food.final_price

                    order_details.append(
                        f"{food.name} ({price} сом), {quantity} штук, итого {price * quantity} сом"
                    )
                    total_amount += price * quantity

                    # ✅ Уменьшаем склад
                    food.quantity -= quantity

                    # ✅ Увеличиваем популярность (ВАЖНО)
                    food.click_order += quantity

                    food.save()  # тут обновится и статус и всё остальное

                    if user_name is None:
                        user_name = food.user.user_name

                except Food_menu.DoesNotExist:
                    return JsonResponse({
                        'success': False,
                        'error': f'Food with id {food_id} not found'
                    })

            # Записываем детали заказа
            order.order_details = "\n".join(order_details)
            order.total_amount = total_amount
            if user_name:
                order.user_name = user_name

            # Если был загружен чек, сохраняем его в заказе
            if order_bank_check:
                file_name = order_bank_check.name.lower()
                ext = os.path.splitext(file_name)[1]

                # Проверяем, что это изображение
                if ext in ['.jpg', '.jpeg', '.png', '.webp']:
                    img = Image.open(order_bank_check)

                    # Конвертация в RGB (важно для png/webp)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")

                    # Уменьшаем размер с сохранением пропорций
                    max_size = 700
                    img.thumbnail((max_size, max_size))

                    # Сжимаем
                    output = BytesIO()
                    img.save(output, format='JPEG', quality=45)
                    output.seek(0)

                    # Сохраняем в поле модели
                    order.order_bank_check.save(
                        f'check_{order.order_number}.jpg',
                        ContentFile(output.read()),
                        save=False
                    )
                else:
                    # Если это не изображение (pdf, doc и т.д.) — просто сохраняем как есть
                    order.order_bank_check = order_bank_check

            # Сохраняем заказ
            order.save()
            today = datetime.date.today()
            cache_key = f"foods_shuffle_{food.user.id}_{today}"
            cache.delete(cache_key)

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'error': 'Invalid request method'})


