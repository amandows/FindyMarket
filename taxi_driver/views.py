from django.shortcuts import render

def taxi_driver(request):
    return render(request, 'taxi_driver/taxi_driver.html')