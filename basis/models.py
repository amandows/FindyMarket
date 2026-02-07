from account.models import CustomUser
from django.db import models
from django.utils import timezone
from django.conf import settings
from decimal import Decimal, ROUND_HALF_UP
import os


class UserFCMToken(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)






class FoodCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categories'
    )

    def __str__(self):
        return self.name



class Food_menu(models.Model):
    STATUS_FOOD = [
        ('True', 'В наличии'),
        ('False', 'Отсутствует'),
    ]

    name = models.TextField(max_length=50)
    description = models.TextField(max_length=800)
    price = models.DecimalField(max_digits=10, decimal_places=0, default='10')
    discount_percent = models.PositiveIntegerField(default=0)  # 0–100
    discount_active = models.BooleanField(default=False)
    category = models.ForeignKey(
        FoodCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='foods'
    )
    food_status = models.CharField(max_length=20, choices=STATUS_FOOD, default='True')
    adscreenimg = models.ImageField(upload_to='static/media/foodimages/foodimg')
    imageOne = models.ImageField(upload_to='static/media/foodimages')
    date_add = models.DateField(blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    click_order = models.PositiveIntegerField(default=0)

    @property
    def final_price(self):
        if self.discount_active and self.discount_percent > 0:
            discount = (self.price * Decimal(self.discount_percent)) / Decimal(100)
            final = self.price - discount
            return final.quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        return self.price

    def delete(self, *args, **kwargs):
        self.delete_images()
        super(Food_menu, self).delete(*args, **kwargs)

    def delete_images(self):
        images = [self.adscreenimg, self.imageOne]
        for image_field in images:
            if image_field:
                if os.path.exists(image_field.path):
                    os.remove(image_field.path)

    def save(self, *args, **kwargs):
        # 🔥 Удаление старых файлов при обновлении изображения
        if self.pk:
            old = Food_menu.objects.get(pk=self.pk)

            for field in ['adscreenimg', 'imageOne']:
                old_file = getattr(old, field)
                new_file = getattr(self, field)

                if old_file and old_file != new_file:
                    if os.path.exists(old_file.path):
                        os.remove(old_file.path)

        if not self.date_add:
            self.date_add = timezone.now()

        # Авто статус по количеству — только если auto_status=True
        auto_status = kwargs.pop('auto_status', True)
        if auto_status:
            if self.quantity <= 0:
                self.food_status = 'False'
            elif self.food_status not in ['True', 'False']:
                self.food_status = 'True'

        super().save(*args, **kwargs)


class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('in_progress', 'В процессе'),
        ('completed', 'Успешно'),
        ('cancelled', 'Отменен'),
    ]
    ORDER_PAYMENT_STATUS = [
        ('Online', 'Онлайн'),
        ('Offline', 'Наличными'),
    ]
    ORDER_DELIVERY_STATUS = [
        ('Delivery', 'Доставка курьером'),
        ('Pickup', 'Самовывоз'),
    ]

    COURIER_STATUS = [
        ('expectation', 'Ожидание'),
        ('called', 'Вызываем курьера'),
        ('pick_up', 'Забирает заказ'),
        ('on_the_way', 'В пути'),
        ('delivered', 'Доставлено'),
        ('canceled', 'Отменено'),
    ]

    DELIVERY_RESULT_CHOICES = [
        ('none', 'Не выбран'),
        ('success', 'Завершен успешно'),
        ('failed', 'Заказ не приехал'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    delivery_result = models.CharField(max_length=20, choices=DELIVERY_RESULT_CHOICES, default='none')
    courier_first_name = models.CharField(max_length=15, blank=True)
    courier_last_name = models.CharField(max_length=15, blank=True)
    courier_tel_number = models.CharField(max_length=15, blank=True)
    courier_car = models.CharField(max_length=40, blank=True)
    courier_car_number = models.CharField(max_length=15, blank=True)
    courier_status = models.CharField(max_length=30, choices=COURIER_STATUS, default='expectation')

    order_number = models.CharField(max_length=255, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    order_user_name = models.CharField(max_length=100)
    user_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    order_details = models.TextField()
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='in_progress')
    order_tel_number = models.CharField(max_length=14)
    order_adsress = models.CharField(max_length=100)
    order_bank_check = models.ImageField(upload_to='static/media/orders_bank_check', blank=True, null=True)
    order_payment_status = models.CharField(max_length=100)
    order_delivery_status = models.CharField(max_length=100)
    order_city = models.CharField(max_length=14, blank=True)



    def __str__(self):
        return self.order_number



# from fcm_django.models import FCMDevice
# FCMDevice.objects.all()

# python manage.py shell
# Create your models here.
# python manage.py makemigrations basis
# python manage.py migrate
# python manage.py runserver
# python manage.py runsslserver --certificate cert.pem --key key.pem
# python manage.py runsslserver 192.168.0.101:8000 --certificate cert.pem --key key.pem
# citizenfour0
# underground0
# & "C:/Users/Admin/PycharmProjects/Findy_store/venv/Scripts/activate.ps1"
# cd fmarket
# python manage.py runserver
# python manage.py runserver 192.168.0.103:8000
# python manage.py createsuperuser source venv/bin/activate pip install -r req.txt
# amandows@mail.ru citizenfour0
# pip install
#         android:networkSecurityConfig="@xml/network_security_config"