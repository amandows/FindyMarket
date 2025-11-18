/////// **************Ajax запрс на список заказов и отображение их*************** ////////////

// Функция для отображения банковского чека заказчика //Админпанель
function viewReceipt(checkUrl) {
    var myUrl = window.location.origin
    const receiptWindow = window.open(myUrl + '/' + checkUrl, '_blank');
    if (!receiptWindow) {
        alert('Не удалось открыть чек. Разрешите всплывающие окна.');
    }
}


// Фнкция обновления списка заказов и отображения //Админпанель
$(document).ready(function () {
    let previousOrders = [];

    // Проверка на взаимодействие пользователя
    let userInteracted = false;

    // Функция для обновления списка заказов
    function updateOrderList() {
        console.log('Starting updateOrderList');
        $.ajax({
            url: '/get-orders/',
            type: 'GET',
            cache: false,
            success: function (data) {
                console.log('AJAX success:', data);

                let orderList = $('#tbody');
                orderList.empty();

                let newOrders = data.orders;
                let orderNumbers = newOrders.map(order => order.order_number);

                // Обновляем количество заказов
                $('.inProgressStatus').text(data.orders_count);

                // Найдите новые заказы, которые не были в предыдущем списке
                let newOrderNumbers = orderNumbers.filter(orderNumber => !previousOrders.includes(orderNumber));


                // Проигрываем звук, если есть новые заказы
                if (localStorage.getItem('previousOrders') < data.orders_count) {
                    console.log('Music Play OKAY')
                    playNotification();
                }
                // Обновляем список заказов
                newOrders.forEach(function (order) {
                    let statusOptions;
                    if (order.status === 'in_progress') {
                        statusOptions = `
                            <form action="" class="order-status">
                                <select name="order-status" data-order-id="${order.id}">
                                    <option value="in_progress">В процессе</option>
                                    <option value="completed">Успешно</option>
                                    <option value="cancelled">Отменён</option>
                                </select>
                            </form>`;
                    } else if (order.status === 'completed') {
                        statusOptions = `
                            <p class="order-completed">Успешно</p>`;
                    } else if (order.status === 'cancelled') {
                        statusOptions = `
                            <p class="order-cancelled">Неудачно</p>`;
                    }

                    // Статус курьера pick_up
                    let CourierStatus;
                    if (order.courier_status === 'expectation') {
                        CourierStatus = `
                        <button class="courier-notification">Вызвать курьера</button>`
                    } else if (order.courier_status === 'called') {
                        CourierStatus = `
                        <span class="courier-called">Ожидание ответа...</span>`
                    }else if (order.courier_status === 'pick_up') {
                        CourierStatus = `
                        <span class="courier-pick-up">Курьер в пути...</span>`
                    } else if (order.courier_status === 'on_the_way') {
                        CourierStatus = `
                        <span class="courier-ontheway">Доставляет заказ</span>`
                    } else if (order.courier_status === 'delivered') {
                        CourierStatus = `
                        <span class="courier-delivered">Заказ доставлен!!!</span>`
                    } else if (order.courier_status === 'canceled') {
                        CourierStatus = `
                        <span class="courier-canceled">Заказ не доставлен!</span>`
                    }



                    const orderElement = `
                            <tr class="order">
                                <td class="order-number-container">
                                    <p class="order-number">${order.order_number}</p>
                                </td>
                                <td class="created-at-container">
                                    <p class="user-name"><span>Имя:</span> ${order.order_user_name}</p>
                                    <p class="tel-number"><span>Тел:</span> ${order.order_tel_number}</p>
                                    <p class="adress"><span>Адрес:</span> ${order.order_adsress}</p>
                                </td>
                                <td class="order-details-container">
                                    <ol id="myList-${order.id}" class="order-details-list">
                                        ${order.order_details
                                            .split('\n')
                                            .map(line => `<li>${line}</li>`)
                                            .join('')}
                                    </ol>
                                    <p class="created-at">Дата: ${new Date(order.created_at).toLocaleString()} ${CourierStatus}</p>
                                </td>
                                <td class="total-amount-container">
                                    <p class="total-amount">${order.total_amount} сом</p>
                                </td>
                                <td class="payment">
                                    ${order.order_payment_status === 'Онлайн'
                                            ? `
                                            <div class="payment-online">
                                                <p>Оплачено онлайн</p>
                                                ${order.order_bank_check
                                                ? `<button onclick="viewReceipt('${order.order_bank_check}')">Посмотреть чек</button>`
                                                : `<p>Чек отсутствует</p>`
                                            }
                                            </div>
                                        `
                                            : `<p>Наличными</p>`
                                        }
                                </td>
                                <td class="order-status">
                                    ${statusOptions}
                                </td>
                            </tr>`;
                    orderList.append(orderElement);
                });

                // Сохраняем текущие заказы для следующего обновления
                previousOrders = orderNumbers;
                localStorage.setItem('previousOrders', previousOrders.length);

            },
            error: function (xhr, status, error) {
                console.error('Error updating order list:', error);
            }
        });
    }

    // Обновляем список заказов каждые 10 секунд
    setInterval(updateOrderList, 10000);

    // Начальное обновление списка заказов
    updateOrderList();
});





//////////////////////*********Обновление статуса курьера********/////////////////

document.addEventListener('click', async function (e) {
    if (e.target.classList.contains('courier-notification')) {
        const orderRow = e.target.closest('.order');
        const orderId = orderRow.querySelector('select[name="order-status"]').dataset.orderId;

        // Отключаем кнопку, чтобы предотвратить повторные нажатия
        e.target.disabled = true;

        try {
            const response = await fetch(`/update_order_courier_status/${orderId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')  // Убедитесь, что CSRF токен передается
                },
                body: JSON.stringify({ courier_status: 'called' })
            });

            if (response.ok) {
                alert('Курьер вызван!');
                location.reload();  // Обновляем страницу
            } else {
                alert('Не удалось вызвать курьера');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            // Включаем кнопку обратно
            e.target.disabled = false;
        }
    }
});




// Функция для получения CSRF токена из куки
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}








/////// *********Функция для отправки на сервер статус заказа*********/////////////////Админпанель

// Функция для получения CSRF токена из мета-тега
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}


function reloadPage() {
    location.reload();
}

$(document).ready(function () {
    $(document).on('change', 'select[name="order-status"]', function () {
        let selectedStatus = $(this).val();
        let orderId = $(this).data('order-id');

        $.ajax({
            url: '/update-order-status/',  // URL для POST-запроса
            type: 'POST',
            data: {
                'order_id': orderId,
                'status': selectedStatus
            },
            headers: {
                'X-CSRFToken': getCsrfToken()  // Передаем CSRF токен в заголовке
            },
            success: function (response) {
                console.log('Status updated successfully:', response);
                reloadPage()
            },
            error: function (xhr, status, error) {
                console.error('Error updating status:', error);
            }
        });
    });
});



// /////// *********Функция для определения высоты textarea*********/////////////////Админпанель


// // Функция для установки количества строк
// function setTextareaRows(textarea) {
//     // Временно устанавливаем значение rows на 1, чтобы получить высоту одной строки
//     textarea.setAttribute("rows", 1);
//     const lineHeight = textarea.clientHeight;

//     // Сбросим значение rows и затем установим правильное значение
//     textarea.setAttribute("rows", 0);
//     const rows = Math.ceil(textarea.scrollHeight / lineHeight);
//     textarea.setAttribute("rows", rows);
//     console.log("ROWS" + rows)
// }



function adjustTextareaRows(textarea) {
    // Временно устанавливаем минимальное значение rows
    textarea.setAttribute("rows", 1);

    // Получаем высоту строки из стилей
    const style = getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight);

    if (isNaN(lineHeight) || lineHeight === 0) {
        console.error("Не удалось определить высоту строки. Проверьте line-height в CSS.");
        return;
    }

    // Рассчитываем количество строк на основе scrollHeight
    const rows = Math.ceil(textarea.scrollHeight / lineHeight);

    // Устанавливаем рассчитанное значение rows
    textarea.setAttribute("rows", rows);
}

// Применение функции ко всем текстовым полям
document.addEventListener('DOMContentLoaded', () => {
    const textareas = document.querySelectorAll('.order-details'); // Селектор для всех textarea
    textareas.forEach(adjustTextareaRows);
});






// Функция для поиска звукового файла // Админпанель

document.addEventListener('DOMContentLoaded', function () {
    ion.sound({
        sounds: [
            {name: "notification"}
        ],
        path: "/static/media/", // Укажите путь до папки с файлами звуков
        preload: true,
        volume: 1.0
    });
});

// Функция для воспроизведения звука при поступлении заказа // Админпанель
function playNotification() {
    ion.sound.play("notification");
}
