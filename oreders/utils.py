from firebase_admin import messaging
from basis.models import UserFCMToken

def send_push_to_user(user, title, body):
    tokens = UserFCMToken.objects.filter(user=user).values_list("token", flat=True)

    if not tokens:
        return False

    for token in tokens:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            token=token,
        )

        try:
            response = messaging.send(message)
            print("Push sent:", response)
        except Exception as e:
            print("Push error:", e)

    return True
