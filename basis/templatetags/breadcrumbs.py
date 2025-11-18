from django import template
from django.urls import resolve, Resolver404

register = template.Library()

@register.simple_tag(takes_context=True)
def generate_breadcrumbs(context):
    request = context['request']
    path = request.path.strip('/').split('/')

    breadcrumbs = []
    url = ''

    for index, segment in enumerate(path):
        url += f'/{segment}'

        try:
            match = resolve(url)
            # Проверяем, есть ли в URL параметр user_id, и объединяем его с сегментом
            if 'user_id' in match.kwargs:
                segment_name = f"account {match.kwargs['user_id']}"
                breadcrumbs.append({'name': segment_name, 'url': url})
                break  # Останавливаем обработку после объединения
            else:
                # Стандартный случай: добавляем сегмент в хлебные крошки
                segment_name = segment.replace('_', ' ').capitalize()
                breadcrumbs.append({'name': segment_name, 'url': url})

        except Resolver404:
            # Если маршрут не найден, просто добавляем сегмент как текст
            segment_name = segment.replace('_', ' ').capitalize()
            breadcrumbs.append({'name': segment_name, 'url': url})

    return breadcrumbs
