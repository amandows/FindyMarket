from django.conf import settings
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save
from basis.city_of_kg import CITY

description_txt = ' Рабочий день: ПН-ВС \n Время работы: 08:00-23:00 \n Адресс: ул. Ленина 55 '


class UserInfo(models.Model):
    user_phone_number = models.DecimalField(max_digits=9, decimal_places=0, blank=True, null=True)
    sms_code = models.CharField(max_length=25, blank=True, null=True)

    def __str__(self):
        return self.user_phone_number


class UserRating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings"   # оценки, полученные пользователем
    )
    rated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="given_ratings"  # оценки, которые поставил пользователь
    )
    score = models.PositiveSmallIntegerField()  # 1..5
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "rated_by")  # один пользователь — одна оценка для target
        indexes = [
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.rated_by} -> {self.user}: {self.score}"


class CustomUser(AbstractUser):
    city = models.CharField(
        max_length=50,
        choices=CITY,
        default="Неизвестно"
    )
    USER_TYPES = [
        ('ordinary_user', 'Обычный пользователь'),
        ('food_user', 'Пользователь еда'),
        ('shop_user', 'Пользователь магазин'),
        ('taxi_user', 'Водитель такси'),
        ('courier_user', 'Водитель курьер'),
        ('taxi_company_user', 'Владелец таксопарк'),
    ]
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='ordinary_user')
    user_name = models.CharField(max_length=25, blank=True, null=True)
    user_description = models.CharField(max_length=500, default=description_txt, blank=True, null=True)
    user_phone_number = models.DecimalField(max_digits=9, decimal_places=0, blank=True, null=True)
    user_phone_number2 = models.DecimalField(max_digits=9, decimal_places=0, blank=True, null=True)
    user_mbank_qr = models.ImageField(upload_to='static/media/user/logo/', blank=True, null=True)
    user_rsk_qr = models.ImageField(upload_to='static/media/user/logo/', blank=True, null=True)
    user_mbank_link = models.CharField(max_length=500, blank=True, null=True)
    user_obank_link = models.CharField(max_length=500, blank=True, null=True)
    user_rsk_link = models.CharField(max_length=500, blank=True, null=True)
    user_abank_link = models.CharField(max_length=500, blank=True, null=True)

    user_raiting = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    CATEGORY_OF_EDUCATION = [
        ('', ''),
        ('Food', 'Еда'),
        ('Vegetables', 'Овощи'),
        ('Shop', 'Магазин'),
    ]
    category_of_education = models.CharField(max_length=20, choices=CATEGORY_OF_EDUCATION, default='', blank=True, null=True)

    SUB_CATEGORY_OF_EDUCATION = [
        ('', ''),
        ('Grocery', 'Продуктовый'),
        ('Vegetables', 'Электроника'),
        ('Clothes', 'Одежды'),
        ('Office', 'Канцелярия'),
    ]

    sub_category_of_education = models.CharField(max_length=20, choices=SUB_CATEGORY_OF_EDUCATION, blank=True, null=True, default='')

    USER_STATUS = [
        ('', ''),
        ('Online', 'Онлайн'),
        ('Offline', 'Оффлайн'),
    ]
    user_status = models.CharField(max_length=20, choices=USER_STATUS, default='', blank=True, null=True)
    user_logo = models.ImageField(upload_to='static/media/user/logo/', blank=True, null=True)
    user_logo_mini = models.ImageField(upload_to='static/media/user/logo/', blank=True, null=True)

    USER_BLOCKED = [
        ('', ''),
        ('Yes', 'Да'),
        ('No', 'Нет'),
    ]
    user_blocked = models.CharField(max_length=20, choices=USER_BLOCKED, default='No')

    # Добавляем related_name для полей groups и user_permissions
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        related_name='custom_user_set',  # Пример названия, которое можно выбрать
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        related_name='custom_user_set',  # Пример названия, которое можно выбрать
        related_query_name='user',
    )

    def __str__(self):
        return self.username if self.username else "Unnamed User"

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        pass
        # CustomUser.objects.create(email=instance.email)




class Courier(models.Model):
    login = models.CharField(max_length=20)
    password = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=15, unique=True)
    last_name = models.CharField(max_length=15, unique=True)
    tel_number = models.CharField(max_length=15, unique=True)
    car = models.CharField(max_length=30, unique=True)
    car_number = models.CharField(max_length=15, unique=True)
    city = models.CharField(max_length=50, default="Неизвестно")

    def __str__(self):
        return self.car_number


