from django.shortcuts import render
from basis.models import Food_menu
from account.models import CustomUser
from basis.city_of_kg import CITY


def home(request):
    users = CustomUser.objects.filter(user_status='Online', user_blocked='No')[2:]  # Пропускаем первого пользователя
    foods = Food_menu.objects.order_by('-click_order')[:5]
    context = {
        'users': users,
        'foods': foods,
        'CITY': [city for city, _ in CITY],  # Передаем только названия городов
    }
    return render(request, 'home/index.html', context)


# Create your views here.
