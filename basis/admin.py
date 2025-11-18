from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from account.models import CustomUser, Courier
from basis.models import Food_menu, Order, FoodCategory

@admin.register(Food_menu)
class FoodMenuAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'price', 'category', 'date_add', 'user', 'click_order']
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

