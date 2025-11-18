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

            # Сохраняем или обновляем токен с привязкой к пользователю
            device, created = FCMDevice.objects.get_or_create(
                registration_id=token,
                defaults={"user": request.user, "type": "web"}
            )

            # Если токен уже существовал, обновим пользователя на текущего
            if not created:
                if device.user != request.user:
                    device.user = request.user
                    device.save()

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
