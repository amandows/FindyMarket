from django.shortcuts import render
from account.models import CustomUser  # Импортируйте вашу модель пользователя

from django.db.models import Count

def user_list(request, category):
    users = (
        CustomUser.objects
        .filter(category_of_education=category, user_status='Online', user_blocked='No')
        .annotate(menu_count=Count('food_menu'))  # связывается по related_name
    )
    return render(request, 'shop_list/shop_list.html', {
        'users': users,
        'category': category
    })
