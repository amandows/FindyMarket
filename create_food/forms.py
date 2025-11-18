from django import forms
from basis.models import Food_menu, FoodCategory

class FoodMenuForm(forms.ModelForm):
    class Meta:
        model = Food_menu
        fields = ['name', 'description', 'price', 'category', 'imageOne', 'food_status']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)  # Получаем пользователя из kwargs
        super().__init__(*args, **kwargs)
        if user:
            self.fields['category'].queryset = FoodCategory.objects.filter(user=user)
