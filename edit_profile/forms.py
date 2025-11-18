from django import forms
from account.models import CustomUser

class CustomUserForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = [
            'city',
            'user_name',
            'user_description',
            'user_phone_number',
            'user_phone_number2',
            'user_mbank_qr',
            'user_rsk_qr',
            'category_of_education',
            'user_status',
            'user_logo',
            'user_logo_mini',
            'user_mbank_link',
            'user_obank_link',
            'user_rsk_link',
            'user_abank_link',
        ]
