from .models import CustomUser, description_txt
from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from account.models import CustomUser

class CustomUserLoginForm(AuthenticationForm):
    # Add any additional form fields if required
    pass

class SignUpForm(UserCreationForm):
    # city = forms.ChoiceField(choices=CITY, initial="Неизвестно")
    user_name = forms.CharField(max_length=25, required=False)
    user_description = forms.CharField(max_length=500, required=False, initial=description_txt)
    user_phone_number = forms.DecimalField(max_digits=9, decimal_places=0, required=False)
    user_phone_number2 = forms.DecimalField(max_digits=9, decimal_places=0, required=False)
    CATEGORY_OF_EDUCATION = [
        ('', ''),
        ('Food', 'Еда'),
        ('Vegetables', 'Овощи'),
        ('Shop', 'Магазин'),
    ]
    category_of_education = forms.ChoiceField(choices=CATEGORY_OF_EDUCATION, required=False, initial='')

    SUB_CATEGORY_OF_EDUCATION = [
        ('', ''),
        ('Grocery', 'Продуктовый'),
        ('Vegetables', 'Электроника'),
        ('Clothes', 'Одежды'),
        ('Office', 'Канцелярия'),
    ]
    sub_category_of_education = forms.ChoiceField(choices=SUB_CATEGORY_OF_EDUCATION, required=False, initial='')

    USER_STATUS = [
        ('', ''),
        ('Online', 'Онлайн'),
        ('Offline', 'Оффлайн'),
    ]
    user_status = forms.ChoiceField(choices=USER_STATUS, required=False, initial='')
    user_logo = forms.ImageField(required=False)
    user_logo_mini = forms.ImageField(required=False)
    user_mbank_qr = forms.ImageField(required=False)
    user_rsk_qr = forms.ImageField(required=False)
    USER_BLOCKED = [
        ('', ''),
        ('Yes', 'Да'),
        ('No', 'Нет'),
    ]
    user_blocked = forms.ChoiceField(choices=USER_BLOCKED, required=False, initial='')

    class Meta:
        model = CustomUser
        fields = ('username',
                  'city',
                  'user_name',
                  'user_description',
                  'user_phone_number',
                  'user_phone_number2',
                  'category_of_education',
                  'sub_category_of_education',
                  'user_status',
                  'user_logo',
                  'user_logo_mini',
                  'user_mbank_qr',
                  'user_rsk_qr',
                  'password1',
                  'password2')

    def clean_username(self):
        username = self.cleaned_data['username']
        if CustomUser.objects.filter(username=username).exists():
            raise forms.ValidationError("Имя пользователя уже занято.")
        return username


# class SignUpForm(UserCreationForm):
#     user_name = forms.CharField(max_length=25, required=False)
#     user_phone_number = forms.DecimalField(max_digits=9, decimal_places=0, required=False)
#
#     class Meta:
#         model = CustomUser
#         fields = ('username',
#                   'user_name',
#                   'user_phone_number',
#                   'password1',
#                   'password2')
#
#     def clean_username(self):
#         username = self.cleaned_data['username']
#         if CustomUser.objects.filter(username=username).exists():
#             raise forms.ValidationError("Имя пользователя уже занято.")
#         return username