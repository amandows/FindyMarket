document.querySelector('input[name="verificationCode"]').addEventListener('input', function (event) {
    let inputValue = event.target.value;

    // Убираем все символы, кроме цифр и букв, заменяем на тире
    inputValue = inputValue.replace(/[^0-9a-zA-Z]/g, '-');

    // Разделяем цифры тире каждые 3 цифры
    inputValue = inputValue.replace(/(\d{3})(?=\d)/g, '$1-'); // Для цифр
    inputValue = inputValue.replace(/([a-zA-Z]+)(?=\w)/g, '$1-'); // Для букв

    event.target.value = inputValue.trim();
});

addValueCod();

function addValueCod() {
    const smsCode = localStorage.getItem("smsCode");
    const verificationcodeValue = document.querySelector('.verification-code');
    if (verificationcodeValue && smsCode) {
        verificationcodeValue.value = smsCode;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const inputEl = document.querySelector('input[name="verificationCode"]');
    const formEl = document.querySelector("form.inputs");

    // ✅ Анимация успеха
    const successAnim = document.createElement("div");
    successAnim.className = "success-animation hidden";
    successAnim.innerHTML = `<div class="checkmark"></div>`;
    document.body.appendChild(successAnim);

    // ✅ Прелоадер (добавим, если нет)
    if (!document.getElementById("preloader")) {
        const preloader = document.createElement("div");
        preloader.id = "preloader";
        preloader.innerHTML = `<div class="loader"></div>`;
        preloader.style.display = "none";
        document.body.appendChild(preloader);
    }

    formEl.addEventListener("submit", function (event) {
        event.preventDefault();

        const smsCode = localStorage.getItem("smsCode");
        const userRegTelNumber = localStorage.getItem("user_reg_tel_number");
        const codeTmp = inputEl.value.trim();
        const code = codeTmp.replace(/[^0-9a-zA-Z]/g, '');

        if (!code) {
            alert("Пожалуйста, введите код.");
            return false;
        }

        if (code !== smsCode) {
            inputEl.classList.add("shake");
            setTimeout(() => inputEl.classList.remove("shake"), 500);
            alert("Введённый код неверный. Попробуйте снова.");
            return false;
        }

        // ✅ Успех
        inputEl.classList.add("success-glow");
        successAnim.classList.remove("hidden");
        successAnim.classList.add("visible");

        localStorage.removeItem("smsCode");
        localStorage.removeItem("user_reg_tel_number");

        // ⏱ После анимации (через 1.5 сек) показываем прелоадер и отправляем форму
        setTimeout(() => {
            const preloader = document.getElementById("preloader");
            if (preloader) {
                preloader.style.display = "flex";
                preloader.classList.add("fade-in");
            }

            const csrfToken = document.querySelector("input[name='csrfmiddlewaretoken']").value;
            const form = document.createElement("form");
            form.method = "POST";
            form.action = event.target.action;

            form.innerHTML = `
                <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                <input type="text" name="username" value="${userRegTelNumber}">
                <input type="tel" name="user_phone_number" value="${userRegTelNumber}">
                <input type="password" name="password1" value="${smsCode}">
                <input type="password" name="password2" value="${smsCode}">
            `;
            document.body.appendChild(form);

            // Задержка 0.7 сек, чтобы показать прелоадер перед редиректом
            setTimeout(() => {
                form.submit();
            }, 700);
        }, 1500);
    });
});
