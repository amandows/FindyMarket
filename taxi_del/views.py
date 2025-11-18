from django.shortcuts import render

# Create your views here.
def taxi(request):
    return render(request, 'taxi_del/taxi_del.html')