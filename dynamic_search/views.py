from django.shortcuts import render
from account.models import CustomUser
from basis.models import Food_menu



def search_food_menu(request):
    query = request.GET.get('query', '').strip()  # Убираем лишние пробелы
    if not query:  # Если запрос пустой
        return render(request, 'search/search_results.html', {'results': [], 'query':query})

    print(f"Search query: {query}")  # Для проверки запроса
    results = CustomUser.objects.filter(user_name__iregex=query)
    print(f"Results: {results}")  # Для проверки результатов

    return render(request, 'search/search_results.html', {'results': results, 'query':query})

