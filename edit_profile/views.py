from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from account.models import CustomUser
from edit_profile.forms import CustomUserForm
import os
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile

from basis.city_of_kg import CITY


def compress_image_keep_ratio(uploaded_file, max_size=700, quality=45):
    img = Image.open(uploaded_file)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img.thumbnail((max_size, max_size))

    output = BytesIO()
    img.save(output, format='JPEG', quality=quality)
    output.seek(0)

    return ContentFile(output.read())



@login_required
def edit_profile_view(request):
    user = get_object_or_404(CustomUser, id=request.user.id)

    if request.method == 'POST':
        form = CustomUserForm(request.POST, request.FILES, instance=user)

        if form.is_valid():
            user_obj = form.save(commit=False)

            # ---------- Большое лого ----------
            if 'user_logo' in request.FILES:
                compressed = compress_image_keep_ratio(
                    request.FILES['user_logo'],
                    max_size=1400,
                    quality=50
                )

                user_obj.user_logo.save(
                    "logo.jpg",   # имя можно фиксированное
                    compressed,
                    save=False
                )

            # ---------- Мини лого ----------
            if 'user_logo_mini' in request.FILES:
                compressed = compress_image_keep_ratio(
                    request.FILES['user_logo_mini'],
                    max_size=300,
                    quality=50
                )

                user_obj.user_logo_mini.save(
                    "logo_mini.jpg",
                    compressed,
                    save=False
                )

            # ❗ Просто сохраняем. ВСЁ.
            user_obj.save()

            messages.success(request, 'Ваш профиль успешно обновлен!')
            return redirect('profile')

    else:
        form = CustomUserForm(instance=user)

    return render(request, 'edit_profile/edit_profile.html', {
        'form': form,
        'CITY': CITY
    })



