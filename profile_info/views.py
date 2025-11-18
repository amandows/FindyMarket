from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required  # Убедимся, что страница доступна только для авторизованных пользователей
def profile_view(request):
    user = request.user  # Получаем текущего авторизованного пользователя
    return render(request, 'profile/profile.html', {'user': user})
