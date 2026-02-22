from django.db import models
from django.conf import settings
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator


class Driver(models.Model):
    # --- Перечисления ---
    class Status(models.TextChoices):
        OFFLINE = "offline", "Оффлайн"
        ONLINE = "online", "Свободен (на линии)"
        BUSY = "busy", "Занят (на заказе)"

    class Role(models.TextChoices):
        TAXI = "taxi", "Такси"
        DELIVERY = "delivery", "Доставка"
        BOTH = "both", "Такси и Доставка"

    class CarClass(models.TextChoices):
        ECONOMY = "economy", "Эконом"
        COMFORT = "comfort", "Комфорт"
        BUSINESS = "business", "Бизнес"

    # --- Связь с пользователем ---
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="driver_profile",
        verbose_name="Пользователь"
    )

    # --- Личные данные и статус ---
    phone = models.CharField("Номер телефона", max_length=20)
    role = models.CharField("Специализация", max_length=20, choices=Role.choices, default=Role.TAXI)
    status = models.CharField("Статус", max_length=10, choices=Status.choices, default=Status.OFFLINE)
    is_active = models.BooleanField("Проверен/Активен", default=True, help_text="Администратор может забанить водителя")

    # --- Данные автомобиля ---
    car_class = models.CharField("Класс авто", max_length=20, choices=CarClass.choices, default=CarClass.ECONOMY)
    vehicle_model = models.CharField("Марка и модель", max_length=100)
    vehicle_number = models.CharField("Гос. номер", max_length=20)
    vehicle_color = models.CharField("Цвет", max_length=50, blank=True)

    # --- Финансы и Рейтинг ---
    balance = models.DecimalField("Баланс", max_digits=10, decimal_places=2, default=0)
    rating = models.DecimalField("Рейтинг", max_digits=3, decimal_places=2, default=5.0,
                                 validators=[MinValueValidator(1), MaxValueValidator(5)])
    trips_count = models.PositiveIntegerField("Количество поездок", default=0)

    # --- Выплаты ---
    bank_link = models.URLField("Ссылка на оплату/банк", blank=True, null=True, help_text="MBank, Optima и т.д.")

    # --- Геолокация (с индексами для быстрого поиска ближайших) ---
    latitude = models.FloatField("Широта", null=True, blank=True, db_index=True)
    longitude = models.FloatField("Долгота", null=True, blank=True, db_index=True)
    last_location_update = models.DateTimeField("Последнее обновление координат", null=True, blank=True)

    # --- Таймлайны ---
    online_at = models.DateTimeField("Вышел на линию", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Водитель"
        verbose_name_plural = "Водители"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} [{self.vehicle_number}]"

    def update_rating(self, new_rating):
        """Логика пересчета среднего рейтинга (упрощенно)"""
        # Это лучше делать через сигналы или отдельный метод
        # rating = (текущий_рейтинг * поездки + новая_оценка) / (поездки + 1)
        pass



class OrderTaxi(models.Model):
    # --- Перечисления (Choices) ---
    class Status(models.TextChoices):
        PENDING = "pending", "Ожидание (поиск водителя)"
        ACCEPTED = "accepted", "Принят водителем"
        ON_WAY = "on_way", "Водитель едет к клиенту"
        ARRIVED = "arrived", "Водитель на месте"
        IN_PROGRESS = "in_progress", "В пути с клиентом"
        COMPLETED = "completed", "Завершен"
        CANCELED = "canceled", "Отменен"

    class OrderType(models.TextChoices):
        TAXI = "taxi", "Такси"
        DELIVERY = "delivery", "Доставка"

    class PaymentType(models.TextChoices):
        CASH = "cash", "Наличные"
        CARD = "card", "Карта (онлайн)"
        WALLET = "wallet", "Личный баланс"

    class CarClass(models.TextChoices):
        ECONOMY = "economy", "Эконом"
        COMFORT = "comfort", "Комфорт"
        BUSINESS = "business", "Бизнес"

    # --- Основная информация ---
    order_number = models.CharField(
        "Номер заказа",
        max_length=20,
        unique=True,
        editable=False,
        db_index=True
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="taxi_orders",
        verbose_name="Клиент"
    )
    driver = models.ForeignKey(
        "Driver",  # Предполагается наличие модели Driver
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="taxi_orders",
        verbose_name="Водитель"
    )
    order_type = models.CharField("Тип", max_length=20, choices=OrderType.choices, default=OrderType.TAXI)
    car_class = models.CharField("Класс авто", max_length=20, choices=CarClass.choices, default=CarClass.ECONOMY)
    status = models.CharField("Статус", max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    # --- Геопозиция ---
    pickup_address = models.CharField("Адрес подачи", max_length=255)
    pickup_latitude = models.FloatField("Широта подачи")
    pickup_longitude = models.FloatField("Долгота подачи")

    destination_address = models.CharField("Адрес назначения", max_length=255, blank=True)
    destination_latitude = models.FloatField("Широта назначения", null=True, blank=True)
    destination_longitude = models.FloatField("Долгота назначения", null=True, blank=True)

    # --- Финансы и параметры ---
    price = models.DecimalField("Стоимость", max_digits=10, decimal_places=2, default=0)
    tips = models.DecimalField("Чаевые", max_digits=10, decimal_places=2, default=0)
    payment_type = models.CharField("Тип оплаты", max_length=10, choices=PaymentType.choices, default=PaymentType.CASH)
    distance = models.DecimalField("Расстояние (км)", max_digits=7, decimal_places=2, default=0)

    # --- Временные метки (Таймлайны) ---
    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлен", auto_now=True)
    accepted_at = models.DateTimeField("Принят водителем", null=True, blank=True)
    arrived_at = models.DateTimeField("Водитель прибыл", null=True, blank=True)
    started_at = models.DateTimeField("Поездка началась", null=True, blank=True)
    finished_at = models.DateTimeField("Поездка завершена", null=True, blank=True)
    canceled_at = models.DateTimeField("Отменен", null=True, blank=True)

    # --- Дополнительно ---
    cancel_reason = models.TextField("Причина отмены", blank=True, null=True)
    extra_info = models.JSONField("Доп. данные (товары, опции)", blank=True, null=True)
    external_order_number = models.CharField("Внешний ID", max_length=50, blank=True, null=True)

    # --- Отзыв и рейтинг ---
    rating = models.PositiveSmallIntegerField(
        "Оценка клиента",
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    review_text = models.TextField("Отзыв клиента", blank=True, null=True)

    class Meta:
        verbose_name = "Заказ такси"
        verbose_name = "Заказы такси"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Генерация короткого уникального номера заказа
            self.order_number = str(uuid.uuid4()).replace("-", "")[:10].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"#{self.order_number} ({self.get_status_display()})"