from django.db import models
from django.conf import settings
import uuid


class Driver(models.Model):

    STATUS_CHOICES = [
        ("offline", "Offline"),
        ("online", "Online"),
        ("busy", "Busy"),
    ]

    ROLE_CHOICES = [
        ("taxi", "Taxi Driver"),
        ("delivery", "Delivery Courier"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="driver_profile"
    )

    phone = models.CharField(max_length=20)

    # Тип водителя
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="delivery"
    )

    # Данные автомобиля
    vehicle_model = models.CharField(max_length=100, blank=True)
    vehicle_number = models.CharField(max_length=20, blank=True)
    vehicle_color = models.CharField(max_length=50, blank=True)

    # Банковская ссылка (MBank, Optima и т.д.)
    bank_link = models.URLField(blank=True, null=True)

    # Геолокация
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="offline"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.role} - {self.status}"




class Order_taxi(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),  # создан, ищем водителя
        ("accepted", "Accepted"),  # водитель принял
        ("on_way", "On the way"),  # едет к клиенту
        ("in_progress", "In progress"),  # заказ выполняется
        ("completed", "Completed"),  # завершен
        ("canceled", "Canceled"),  # отменен
    ]

    TYPE_CHOICES = [
        ("taxi", "Taxi"),
        ("delivery", "Delivery"),
    ]

    PAYMENT_CHOICES = [
        ("cash", "Cash"),
        ("online", "Online"),
    ]

    # Уникальный номер заказа
    order_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False
    )

    # Кто заказал
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    # Назначенный водитель
    driver = models.ForeignKey(
        "Driver",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="taxi_orders"
    )

    # Тип заказа
    order_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES
    )

    # Тип оплаты
    payment_type = models.CharField(
        max_length=10,
        choices=PAYMENT_CHOICES,
        default="cash"
    )

    # Адрес забора
    pickup_address = models.CharField(max_length=255)
    pickup_latitude = models.FloatField()
    pickup_longitude = models.FloatField()

    # Адрес назначения (для такси)
    destination_address = models.CharField(max_length=255, blank=True)
    destination_latitude = models.FloatField(null=True, blank=True)
    destination_longitude = models.FloatField(null=True, blank=True)

    # Стоимость
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Номер заказа еды / товара (если есть внешняя система)
    external_order_number = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    # Дополнительная информация (список товаров, комментарии и т.д.)
    extra_info = models.JSONField(
        blank=True,
        null=True
    )

    # Статус
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 👇 Простая жалоба текстом
    complaint_text = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = str(uuid.uuid4()).replace("-", "")[:10].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number} - {self.status}"
