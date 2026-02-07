from django.contrib.auth import authenticate, login
from django.contrib.auth import login
from django.shortcuts import render, get_object_or_404
from account.models import CustomUser, UserInfo
from basis.models import Food_menu, FoodCategory
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from account.forms import CustomUserLoginForm
import random
import string
from django.contrib.auth.decorators import login_required
import json
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.db.models import Avg
from django.http import JsonResponse, HttpResponseBadRequest
from .models import CustomUser, UserRating
from twilio.rest import Client
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.cache import cache
import random, datetime



def registration_sms(request):
    return render(request, 'registration/send_sms.html')

def user_profile(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)
    categories = Food_menu.CATEGORY_CHOICES
    return render(request, 'account/account_menu.html', {'user': user, 'categories': categories})


def account_menu(request, user_id):
    user = get_object_or_404(CustomUser, pk=user_id)
    categories = FoodCategory.objects.filter(user=user)

    today = datetime.date.today()
    cache_key = f"foods_shuffle_{user_id}_{today}"

    food_items = cache.get(cache_key)

    if not food_items:
        # Товары со скидкой
        discounted = list(Food_menu.objects.filter(user=user, discount_active=True))
        non_discounted = list(Food_menu.objects.filter(user=user, discount_active=False))

        # Сортируем по популярности (click_order) по убыванию
        discounted.sort(key=lambda x: x.click_order, reverse=True)
        non_discounted.sort(key=lambda x: x.click_order, reverse=True)

        # Объединяем списки: сначала со скидкой, потом без
        food_items = discounted + non_discounted

        # Кэшируем
        cache.set(cache_key, food_items, 60 * 60 * 24)

    return render(request, 'account/account_menu.html', {
        'user': user,
        'food_items': food_items,
        'categories': categories
    })



def login_view(request):
    if request.method == 'POST':
        form = CustomUserLoginForm(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('home')  # or where you want to redirect
            else:
                return render(request, 'registration/login.html', {'form': form, 'error': 'Invalid credentials'})
    else:
        form = CustomUserLoginForm()
    return render(request, 'registration/login.html', {'form': form})



def SignUp(request):
    if request.method == "POST":
        username = request.POST.get('username')  # Телефонный номер из формы
        user_phone_number = request.POST.get('user_phone_number')
        password_1 = request.POST.get('password1')
        password_2 = request.POST.get('password2')

        # Проверяем совпадение паролей
        if password_1 != password_2:
            return render(request, 'registration/signup.html', {
                'error': "Пароли не совпадают."
            })

        # Ищем пользователя в UserInfo
        user_info = UserInfo.objects.filter(user_phone_number=username).first()

        if user_info:
            # Если пользователь найден, пытаемся аутентифицироваться
            usr = authenticate(
                request,
                username=user_info.user_phone_number,  # Используем номер телефона как username
                password=user_info.sms_code            # Используем SMS-код как пароль
            )
            if usr:
                # Если аутентификация успешна, выполняем вход
                login(request, usr)
                return redirect('home')  # Перенаправляем на главную страницу
            else:
                return render(request, 'registration/signup.html', {
                    'error': "Не удалось войти. Проверьте данные."
                })
        else:
            # Если пользователь не найден, регистрируем нового
            try:
                # Создаём пользователя
                user = CustomUser.objects.create_user(
                    username=username,
                    user_phone_number=user_phone_number,
                    password=password_1
                )
                user.save()

                # Сохраняем данные в UserInfo
                UserInfo.objects.create(
                    user_phone_number=username,
                    sms_code=password_1
                )

                # Аутентификация и вход нового пользователя
                usr = authenticate(request, username=username, password=password_1)
                if usr is not None:
                    login(request, usr)
                    return redirect('home')  # Перенаправляем на главную страницу
                else:
                    return render(request, 'registration/signup.html', {
                        'error': "Не удалось войти. Проверьте данные."
                    })
            except Exception as e:
                return render(request, 'registration/signup.html', {
                    'error': f"Ошибка при создании пользователя: {str(e)}"
                })

    # Если GET-запрос, просто отображаем форму регистрации
    return render(request, 'registration/signup.html')



@csrf_exempt
def submit_rating(request):
    if request.method == "POST":
        data = json.loads(request.body.decode("utf-8"))
        rating = int(data.get("rating"))
        user_id = data.get("user_id")

        target_user = get_object_or_404(CustomUser, pk=user_id)

        # сохраняем/обновляем оценку
        UserRating.objects.update_or_create(
            user=target_user,
            rated_by=request.user,
            defaults={"score": rating}
        )

        # пересчитываем средний рейтинг
        avg = UserRating.objects.filter(user=target_user).aggregate(avg=Avg("score"))["avg"]

        if avg is not None:
            target_user.user_raiting = round(avg, 1)  # округляем до 1 знака
            target_user.save(update_fields=["user_raiting"])

        return JsonResponse({
            "status": "success",
            "new_rating": float(target_user.user_raiting)
        })

# def SignUp(request):
#     if request.method == "POST":
#         username = request.POST.get('username')
#         user_name = request.POST.get('user_name')
#         user_phone_number = request.POST.get('user_phone_number')
#         password_1 = request.POST.get('password1')
#         password_2 = request.POST.get('password2')
#
#         # Проверяем, что пароли совпадают
#         if password_1 != password_2:
#             return render(request, 'registration/signup.html', {
#                 'error': "Пароли не совпадают."
#             })
#
#         try:
#             # Создаём пользователя через `create_user`
#             user = CustomUser.objects.create_user(
#                 username=username,
#                 user_name=user_name,
#                 user_phone_number=user_phone_number,
#                 password=password_1
#             )
#             user.save()
#
#             # Аутентификация и вход
#             usr = authenticate(request, username=username, password=password_1)
#             if usr is not None:
#                 login(request, usr)
#                 return redirect('home')  # Перенаправляем на главную страницу
#             else:
#                 return render(request, 'registration/signup.html', {
#                     'error': "Не удалось войти. Проверьте данные."
#                 })
#
#         except Exception as e:
#             return render(request, 'registration/signup.html', {
#                 'error': f"Ошибка при создании пользователя: {str(e)}"
#             })
#
#     # Если GET-запрос, просто отобразим форму регистрации
#     return render(request, 'registration/signup.html')




@csrf_exempt
def send_sms(request):
    if request.method == "POST":
        # Генерируем 7 цифр
        digits = ''.join(random.choices(string.digits, k=7))

        # Генерируем одну букву
        letter = random.choice(string.ascii_letters)

        # Добавляем букву к цифрам
        sms_code = '0000000A'
        print(sms_code)
        return JsonResponse({"sms_code": sms_code})
    return JsonResponse({"error": "Invalid request method"}, status=400)



# @csrf_exempt
# def send_sms(request):
#     if request.method == "POST":
#         tel_number = request.POST.get('tel_number')  # Получаем номер телефона из запроса
#         print(f'Tel number: {tel_number}')
#         if not tel_number:  # Проверяем, что номер телефона передан
#             return JsonResponse({'status': 'error', 'message': 'Номер телефона не передан'})
#
#         # Параметры Twilio
#         account_sid = 'AC4c454a8017289a96e3495f069f2ba805'
#         auth_token = 'ac21b2babb6af820d9514cea803d4cfa'
#         twilio_phone_number = '+12315155356'  # Ваш Twilio номер
#
#         client = Client(account_sid, auth_token)
#
#         # Генерируем 7 цифр
#         digits = ''.join(random.choices(string.digits, k=7))
#
#         # Генерируем одну букву
#         letter = random.choice(string.ascii_letters)
#
#         # Формируем код с буквой и цифрами
#         sms_code = digits + letter
#         print(f"Generated SMS code: {sms_code}")
#
#         try:
#             # Отправляем SMS
#             message = client.messages.create(
#                 body=f"Ваш код подтверждения: {sms_code}",
#                 from_=twilio_phone_number,
#                 to=tel_number
#             )
#
#             # Печатаем SID сообщения для проверки
#             print(f"Сообщение отправлено: {message.sid}")
#
#             return JsonResponse({'status': 'success', 'message': 'SMS отправлено', 'sms_code': sms_code})
#         except Exception as e:
#             return JsonResponse({'status': 'error', 'message': str(e)})
#
#     return JsonResponse({"error": "Invalid request method"}, status=400)



@login_required
def update_username(request):
    if request.method == "POST":
        data = json.loads(request.body)
        new_username = data.get("username", "").strip()
        if new_username:
            request.user.user_name = new_username
            request.user.save()
            return JsonResponse({"success": True})
        return JsonResponse({"success": False, "error": "Имя пустое"})
    return JsonResponse({"success": False, "error": "Неверный метод"})



@login_required
def update_avatar(request):
    if request.method == "POST" and request.FILES.get("avatar"):
        avatar = request.FILES["avatar"]

        # Открываем изображение
        image = Image.open(avatar)

        # Определяем новые размеры (квадратное обрезание 500x500)
        target_size = 500
        width, height = image.size

        # Центрируем и обрезаем до квадрата
        if width > height:
            left = (width - height) / 2
            top = 0
            right = left + height
            bottom = height
        else:
            top = (height - width) / 2
            left = 0
            right = width
            bottom = top + width

        image_cropped = image.crop((left, top, right, bottom))
        image_resized = image_cropped.resize((target_size, target_size), Image.LANCZOS)

        # Сохраняем в BytesIO
        output = BytesIO()
        image_resized.save(output, format='JPEG', quality=60)
        output.seek(0)

        # Сохраняем обратно в поле user_logo
        request.user.user_logo.save(
            f"{request.user.username}_avatar.jpg",
            ContentFile(output.read()),
            save=True
        )

        return JsonResponse({"success": True, "avatar_url": request.user.user_logo.url})

    return JsonResponse({"success": False}, status=400)
