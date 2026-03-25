from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification
from django.shortcuts import render
from django.http import JsonResponse
from account.models import CustomUser  # Импортируйте вашу модель пользователя


def send_city_news(request):
    if request.method == "POST":
        selected_city = request.POST.get('city')
        news_title = request.POST.get('title')
        news_body = request.POST.get('message')

        # 1. Находим всех пользователей из этого города
        users_in_city = CustomUser.objects.filter(city=selected_city)

        # 2. Получаем все их зарегистрированные устройства (FCM Токены)
        devices = FCMDevice.objects.filter(user__in=users_in_city, active=True)

        if devices.exists():
            # 3. Формируем сообщение
            # Используем и notification (для системного пуша) и data (для вашего JS моста)
            message = Message(
                notification=Notification(
                    title=news_title,
                    body=news_body,
                    image="https://i.imgur.com/zYIlgBl.png"
                ),
                data={
                    "title": news_title,
                    "body": news_body,
                    "type": "NEWS"
                }
            )

            # 4. Отправляем массово
            send_result = devices.send_message(message)

            return JsonResponse({
                'success': True,
                'delivered': len(devices),
                'city': selected_city
            })

        return JsonResponse({'success': False, 'error': 'Нет устройств в этом городе'})

    # Если GET - просто показываем страницу со списком городов
    from basis.city_of_kg import CITY
    return render(request, 'send_news/send_news.html', {'cities': CITY})