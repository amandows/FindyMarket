from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

@login_required
@require_POST
def toggle_user_status(request):
    user = request.user
    # Проверяем и меняем статус пользователя
    if user.user_status == 'Online':
        user.user_status = 'Offline'
    else:
        user.user_status = 'Online'
    user.save()
    return JsonResponse({'status': user.get_user_status_display()})
