from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from account.models import CustomUser
from edit_profile.forms import CustomUserForm

from basis.city_of_kg import CITY

@login_required
def edit_profile_view(request):
    user = get_object_or_404(CustomUser, id=request.user.id)

    if request.method == 'POST':
        form = CustomUserForm(request.POST, request.FILES, instance=user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Ваш профиль успешно обновлен!')
            return redirect('profile')
    else:
        form = CustomUserForm(instance=user)

    return render(request, 'edit_profile/edit_profile.html', {'form': form, 'CITY': CITY})
