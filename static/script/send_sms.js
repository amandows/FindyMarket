$(document).ready(function () {
    let smsCode = "";

    // Обработчик для отправки SMS
    $(".send-code-btn").click(function (e) {
        e.preventDefault();

        const telCode = $(".tel-code").val(); // Код страны
        const telNumber = $(".tel-number").val(); // Введённый номер телефона

        // Проверка ввода
        if (telNumber.length !== 9 || isNaN(telNumber)) {
            alert("Введите корректный номер телефона.");
            return;
        }

        // Формируем полный номер телефона
        const fullTelNumber = telCode + telNumber;

        // Отправка запроса на сервер
        $.ajax({
            url: "/sending/sms/",
            method: "POST",
            headers: { "X-CSRFToken": "{{ csrf_token }}" },
            data: { tel_number: fullTelNumber },
            success: function (response) {
                smsCode = response.sms_code;

                // Сохраняем данные в localStorage
                localStorage.setItem("smsCode", smsCode);
                localStorage.setItem("user_reg_tel_number", telNumber);

                // Перенаправляем на страницу регистрации
                window.location.href = "/signup/";
            },
            error: function () {
                alert("Ошибка при отправке кода.");
            }
        });
    });
});