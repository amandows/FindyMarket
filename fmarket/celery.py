import os
from celery import Celery

# Устанавливаем переменную окружения с настройками вашего проекта
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fmarket.settings')

app = Celery('fmarket')

# Используем строку с настройками из settings.py (все настройки Celery должны начинаться с CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматически находим задачи (tasks.py) во всех установленных приложениях (apps)
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')