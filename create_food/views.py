import json
from django.shortcuts import render, redirect
from .forms import FoodMenuForm
from django.core.files.base import ContentFile
from PIL import Image
from io import BytesIO
from basis.models import FoodCategory, Food_menu
from django.http import JsonResponse
from django.core.cache import cache
import datetime


def create_category(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')

            if not name:
                return JsonResponse({'success': False, 'error': 'Name is required'}, status=400)

            category = FoodCategory(name=name, user=request.user)
            category.save()
            return JsonResponse({'success': True})

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

        except Exception as e:
            print(f"Error: {e}")  # Логирование ошибки
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)



def add_food(request):
    if request.method == 'POST':
        form = FoodMenuForm(request.POST, request.FILES)
        if form.is_valid():
            food = form.save(commit=False)
            food.user = request.user

            # Обработка изображений перед сохранением
            for field_name in ['imageOne']:
                image_field = getattr(food, field_name)
                if image_field:
                    image = Image.open(image_field)
                    output = BytesIO()
                    image.save(output, format='JPEG', quality=40)
                    output.seek(0)
                    image_field.file = output

            if food.imageOne:
                img_one = Image.open(food.imageOne)
                width, height = img_one.size
                target_width = 500
                target_height = 500
                if width > height:
                    new_width = target_width
                    new_height = int(target_width * (height / width))
                else:
                    new_height = target_height
                    new_width = int(target_height * (width / height))
                resized_image = img_one.resize((new_width, new_height))
                output = BytesIO()
                resized_image.save(output, format='JPEG', quality=60)
                output.seek(0)
                food.adscreenimg.save('filename.jpg', ContentFile(output.read()))

            food.save()
            # Удаляем кэш для этого пользователя
            cache_key = f"foods_shuffle_{food.user.id}_{datetime.date.today()}"
            cache.delete(cache_key)
            return redirect('add_food')  # Измените на URL, куда вы хотите перенаправлять после сохранения
    else:
        form = FoodMenuForm(user=request.user)  # **Передаем user в форму**
    return render(request, 'create_food/create_food.html', {'form': form})


def manage_category(request):
    if request.method == "POST":
        data = json.loads(request.body)
        category_id = data.get("id")
        action = data.get("action")
        new_name = data.get("name")

        try:
            category = FoodCategory.objects.get(id=category_id, user=request.user)

            # ✏️ Переименование
            if action == "edit":
                if not new_name:
                    return JsonResponse({'success': False, 'error': 'Введите имя'})

                category.name = new_name
                category.save()

                return JsonResponse({'success': True, 'message': 'Категория обновлена'})

            # 🗑️ Удаление
            if action == "delete":
                # Находим ВСЕ товары этого пользователя с этой категорией
                foods = Food_menu.objects.filter(
                    user=request.user,
                    category=category
                )

                for food in foods:
                    food.delete()  # <-- тут вызовется delete_images()

                category.delete()

                return JsonResponse({'success': True, 'message': 'Категория и все товары удалены'})


        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False})