from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from account.models import CustomUser, Courier, UserRating
from basis.models import Food_menu, Order, FoodCategory
from taxi_del.models import OrderTaxi, Driver

@admin.register(Food_menu)
class FoodMenuAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'price', 'category', 'date_add', 'user', 'click_order', 'discount_percent', 'discount_active',]
    list_filter = ['category', 'date_add']
    search_fields = ['name', 'description', 'user']


@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    list_filter = ['name']
    search_fields = ['name']

@admin.register(Courier)
class CourierAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'car', 'car_number']
    list_filter = ['login', 'tel_number', 'city']
    search_fields = ['first_name', 'last_name', 'car', 'car_number']



@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('city',
                    'username',
                    'user_name',
                    'user_phone_number',
                    'category_of_education',
                    'user_type',
                    'sub_category_of_education','user_blocked', 'user_status', 'is_staff')
    list_filter = ['username', 'user_blocked', 'city']
    search_fields = ('city', 'username', 'user_name', 'user_status', 'user_phone_number')
    readonly_fields = ('date_joined', 'last_login')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info',{'fields': ('user_name',
                                        'city',
                                        'user_phone_number',
                                         'user_status',
                                         'user_blocked',
                                         'user_raiting',
                                         'user_logo_mini',
                                         'user_logo',
                                         'category_of_education',
                                         'sub_category_of_education',
                                         'user_mbank_qr',
                                         'user_rsk_qr',
                                         'user_type')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                    'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'user_name', 'user_phone_number', 'password1', 'password2'),
        }),
    )

    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_user_name', 'courier_status', 'order_number', 'total_amount', 'user_name', 'created_at']
    list_filter = ['user_name', 'created_at', 'courier_status', 'status']
    search_fields = ['order_number', 'user_name', 'status']
    readonly_fields = ['created_at']

    def created_at(self, obj):
        return obj.created_at
    created_at.short_description = 'Date Created'


@admin.register(UserRating)
class UserRatingAdmin(admin.ModelAdmin):
    # Столбцы в списке всех записей
    list_display = ('id', 'rated_by', 'user', 'score', 'created_at')

    # Фильтры справа
    list_filter = ('score', 'created_at')

    # Поля, по которым работает поиск (username пользователей)
    search_fields = ('user__username', 'rated_by__username')

    # Даты создания/обновления нельзя редактировать вручную
    readonly_fields = ('created_at', 'updated_at')

    # Удобный выбор пользователей (особенно если их тысячи)
    raw_id_fields = ('user', 'rated_by')


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    # Что отображаем в списке
    list_display = ('user', 'vehicle_number', 'car_class', 'status', 'rating', 'balance', 'is_active')

    # По каким полям можно фильтровать (правая колонка)
    list_filter = ('status', 'car_class', 'role', 'is_active')

    # Поиск (по логину юзера, номеру авто или телефону)
    search_fields = ('user__username', 'user__first_name', 'vehicle_number', 'phone')

    # Поля только для чтения (рейтинг и баланс лучше менять через логику, а не руками)
    readonly_fields = ('rating', 'trips_count', 'created_at')

    # Группировка полей в форме редактирования
    fieldsets = (
        ("Личные данные", {
            'fields': ('user', 'phone', 'role', 'is_active')
        }),
        ("Автомобиль", {
            'fields': ('vehicle_model', 'vehicle_number', 'vehicle_color', 'car_class')
        }),
        ("Статус и Локация", {
            'fields': ('status', 'latitude', 'longitude', 'last_location_update', 'online_at')
        }),
        ("Финансы и Рейтинг", {
            'fields': ('balance', 'rating', 'trips_count', 'bank_link')
        }),
    )


@admin.register(OrderTaxi)
class OrderTaxiAdmin(admin.ModelAdmin):
    # Основные поля в списке
    list_display = ('order_number', 'customer', 'driver', 'status', 'car_class', 'price', 'created_at')

    # Фильтры
    list_filter = ('status', 'car_class', 'payment_type', 'created_at')

    # Поиск по номеру заказа или именам участников
    search_fields = ('order_number', 'customer__username', 'driver__user__username', 'pickup_address')

    # Запрещаем редактировать ключевые поля вручную
    readonly_fields = (
    'order_number', 'created_at', 'updated_at', 'accepted_at', 'arrived_at', 'started_at', 'finished_at')

    # Организация интерфейса
    fieldsets = (
        ("Основная информация", {
            'fields': ('order_number', 'status', 'order_type', 'car_class')
        }),
        ("Участники", {
            'fields': ('customer', 'driver')
        }),
        ("Маршрут", {
            'fields': ('pickup_address', ('pickup_latitude', 'pickup_longitude'),
                       'destination_address', ('destination_latitude', 'destination_longitude'))
        }),
        ("Оплата", {
            'fields': ('price', 'tips', 'payment_type')
        }),
        ("Таймлайн и Отмена", {
            'fields': (
            'created_at', 'accepted_at', 'arrived_at', 'started_at', 'finished_at', 'canceled_at', 'cancel_reason'),
            'classes': ('collapse',)  # Скрываем по умолчанию для чистоты интерфейса
        }),
        ("Отзыв", {
            'fields': ('rating', 'review_text')
        }),
    )

    # Метод для автоматической подстановки иконок или цвета в будущем (опционально)
    def save_model(self, request, obj, form, change):
        # Здесь можно добавить логику, если что-то нужно сделать при сохранении из админки
        super().save_model(request, obj, form, change)