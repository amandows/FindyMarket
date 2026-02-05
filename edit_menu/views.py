from django.shortcuts import render
from basis.models import Food_menu
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from collections import defaultdict
from django.contrib import messages
from io import BytesIO
from django.core.files.base import ContentFile
from PIL import Image
from django.core.cache import cache
import datetime



@login_required
def edit_menu_view(request):
    # Получаем блюда, принадлежащие только текущему пользователю
    food_items = Food_menu.objects.filter(user=request.user)

    # Группируем блюда по категориям
    categories = defaultdict(list)
    for food_item in food_items:
        if food_item.category:  # Проверяем, есть ли категория
            categories[food_item.category.name].append(food_item)
        else:
            categories['Без категории'].append(food_item)  # Для блюд без категории

    context = {
        'categories': categories.items(),  # Передаем пары (категория, блюда)
    }
    return render(request, 'edit_menu/edit_menu.html', context)




@login_required
def edit_food_view(request, food_id):
    food_item = get_object_or_404(Food_menu, id=food_id)

    if request.method == 'POST':
        # Обновляем данные блюда из формы
        food_item.description = request.POST.get('description')
        food_item.price = request.POST.get('price')
        food_item.food_status = request.POST.get('food_status')
        food_item.name = request.POST.get('food_name')

        # 🔥 Обновляем скидки
        food_item.discount_active = bool(request.POST.get('discount_active'))
        try:
            discount_percent = int(request.POST.get('discount_percent', 0))
            if discount_percent < 0: discount_percent = 0
            if discount_percent > 100: discount_percent = 100
            food_item.discount_percent = discount_percent
        except ValueError:
            food_item.discount_percent = 0

        # Обработка изображения
        if 'imageOne' in request.FILES:
            image_field = request.FILES['imageOne']
            image = Image.open(image_field)

            # Сжатие исходного изображения
            output = BytesIO()
            image.save(output, format='JPEG', quality=40)
            output.seek(0)
            food_item.imageOne.save(image_field.name, ContentFile(output.read()))

            # Изменение размера для adscreenimg
            width, height = image.size
            target_width = 500
            target_height = 500

            if width > height:
                new_width = target_width
                new_height = int(target_width * (height / width))
            else:
                new_height = target_height
                new_width = int(target_height * (width / height))

            resized_image = image.resize((new_width, new_height))
            output = BytesIO()
            resized_image.save(output, format='JPEG', quality=60)
            output.seek(0)
            food_item.adscreenimg.save('filename.jpg', ContentFile(output.read()))

        # Сохраняем объект после всех изменений
        food_item.save()
        # Удаляем кэш для этого пользователя
        cache_key = f"foods_shuffle_{food_item.user.id}_{datetime.date.today()}"
        cache.delete(cache_key)
        messages.success(request, 'Блюдо успешно обновлено!')
        return redirect(reverse('edit_menu'))

    return render(request, 'edit_food.html', {'food_item': food_item})


def delete_food(request, id):
    food = Food_menu.objects.get(id=id)
    food.delete()  # тут автоматически вызовется delete_images()
    # Удаляем кэш для этого пользователя
    cache_key = f"foods_shuffle_{food.user.id}_{datetime.date.today()}"
    cache.delete(cache_key)
    return redirect('edit_menu')