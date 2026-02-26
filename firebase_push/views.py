from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from fcm_django.models import FCMDevice

# @login_required
@csrf_exempt
def save_fcm_token(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            token = data.get("token")

            if not token:
                return JsonResponse({"success": False, "error": "No token provided"})

            # 1. ОЧИСТКА: Удаляем все дубликаты этого токена в базе,
            # чтобы осталась только одна чистая запись
            FCMDevice.objects.filter(registration_id=token).delete()

            # 2. СОЗДАНИЕ: Теперь создаем одну уникальную запись
            FCMDevice.objects.create(
                registration_id=token,
                user=request.user if request.user.is_authenticated else None,
                type="web",
                active=True
            )

            return JsonResponse({"success": True})

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse({"success": False, "error": "Invalid request method"})


# @login_required
# @csrf_exempt
# def save_fcm_token(request):
#     if request.method == "POST":
#         data = json.loads(request.body)
#         token = data.get("token")
#         if token:
#             FCMDevice.objects.get_or_create(
#                 registration_id=token,
#                 user=request.user,
#                 type="web"
#             )
#             return JsonResponse({"success": True})
#         return JsonResponse({"success": False, "error": "No token"})
#     return JsonResponse({"success": False, "error": "Invalid request"})
