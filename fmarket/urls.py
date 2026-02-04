# from tkinter.font import names

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth import views as auth_views
from basis.views import create_order
from home.views import home
from account.views import SignUp, user_profile, account_menu, send_sms, registration_sms, login_view, submit_rating, update_username, update_avatar
from create_food.views import add_food, create_category, manage_category
from owner.views import get_orders
from oreders.views import orders_view, update_order_status, user_orders_json, orders_chart_view, update_order_courier_status
from edit_menu.views import edit_menu_view, edit_food_view, delete_food
from edit_profile.views import edit_profile_view
from profile_info.views import profile_view
from basis_admin.views import toggle_user_status
from courier.views import courier_page, register_or_login, get_courier_orders, pickup_order, get_orders_by_ids, courier_update_order_status
from shop_list.views import user_list
from dynamic_search.views import search_food_menu
from taxi_del.views import taxi
from taxi_driver.views import taxi_driver
from my_orders.views import my_orders, update_order_result_ajax, my_orders_ajax
from firebase_push.views import save_fcm_token


urlpatterns = [
    path('save-fcm-token/', save_fcm_token, name='save_fcm_token'),
    path('my-orders/', my_orders, name='my_orders'),
    path('my-orders-ajax/', my_orders_ajax, name='my_orders_ajax'),
    path('update-order-ajax/<int:order_id>/<str:result>/', update_order_result_ajax, name='update_order_result_ajax'),
    path("submit-rating/", submit_rating, name="submit_rating"),
    path('taxi_driver/', taxi_driver, name='taxi_driver'),
    path('taxi/', taxi, name='taxi'),
    path('update-username/', update_username, name='update_username'),
    path('update-avatar/', update_avatar, name='update_avatar'),
    path('sending/sms/', send_sms, name='send_sms'),
    path('registration/', registration_sms, name='registration_sms'),
    path('search/', search_food_menu, name='search_food_menu'),
    path('create-category/', create_category, name='create_category'),
    path('manage-category/', manage_category, name='manage_category'),
    path('category/<str:category>/', user_list, name='user_list'),
    path('pickup_order/<int:order_id>/', pickup_order, name='pickup_order'),
    path('courier_update_order_status/<int:order_id>/', courier_update_order_status, name='courier_update_order_status'),
    path('get_orders_by_ids/', get_orders_by_ids, name='get_orders_by_ids'),
    path('get_courier_orders/', get_courier_orders, name='get_courier_orders'),
    path('update_order_courier_status/<int:order_id>/', update_order_courier_status, name='update_order_courier_status'),
    path('courier/orders/', courier_page, name='courier_page'),
    path('register_or_login/', register_or_login, name='register_or_login'),
    path('toggle-status/', toggle_user_status, name='toggle_user_status'),
    path('profile/', profile_view, name='profile'),
    path('edit-profile/', edit_profile_view, name='edit_profile'),
    path('edit-menu/', edit_menu_view, name='edit_menu'),
    path('delete_food/<int:id>/', delete_food, name='delete_food'),
    path('edit-food/<int:food_id>/', edit_food_view, name='edit_food'),
    path('orders-chart/', orders_chart_view, name='orders_chart'),  # показать на странице график json статистика
    path('user-orders-json/', user_orders_json, name='user_orders_json'),  # запрос на создание json статистика
    path('user/<int:user_id>/', user_profile, name='user_profile'),
    path('account/<int:user_id>/', account_menu, name='account_menu'),
    path('orders/', orders_view, name='orders'),
    path('get-orders/', get_orders, name='get_orders'),
    path('update-order-status/', update_order_status, name='update_order_status'),
    path('', home, name='home'),
    path('account/', include('django.contrib.auth.urls')),
    path("signup/", SignUp, name="signup"),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/', LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('add/', add_food, name='add_food'),
    path('create-order/', create_order, name='create_order'),
    path('admin/', admin.site.urls),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
