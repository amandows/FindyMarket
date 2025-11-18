from basis.models import Food_menu, FoodCategory

# Список категорий для миграции
CATEGORY_CHOICES = [
    ('national_dishes', 'Национальные блюда'),
    ('meat', 'Мясное'),
    ('fast_food', 'Быстрое питание'),
    ('dairy', 'Молочное'),
    ('desserts', 'Десерты'),
    ('pastries', 'Выпечки'),
    ('seafood', 'Морепродукты'),
    ('sushi_rolls', 'Суши, Роллы'),
    ('pizza_burgers', 'Пиццы, Бургеры'),
    ('soups', 'Супы'),
    ('salads', 'Салаты'),
    ('drinks', 'Напитки'),
    ('alcoholic_drinks', 'Алкогольные напитки'),
    ('snacks', 'Закуски'),
    ('kids_menu', 'Детское меню'),
]

# Создание записей в новой таблице FoodCategory и обновление существующих Food_menu
for key, name in CATEGORY_CHOICES:
    category, created = FoodCategory.objects.get_or_create(name=name)
    Food_menu.objects.filter(category=key).update(category=category)

print("Миграция категорий завершена.")
