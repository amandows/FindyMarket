function reloadPage() {
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    const courierUser = localStorage.getItem('courier_user');
    const authModal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const courierInfo = document.getElementById('courier-info');

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value; // Получаем токен

    if (courierUser) {
        const user = JSON.parse(courierUser);
        document.getElementById('first-name').textContent = user.first_name;
        document.getElementById('last-name').textContent = user.last_name;
        document.getElementById('tel-number').textContent = user.tel_number;
        document.getElementById('car-model').textContent = user.car;
        document.getElementById('car-number').textContent = user.car_number;
        document.getElementById('courier-city').textContent = user.city; // Отображаем город
    } else {
        authModal.style.display = 'block';
    }

    document.getElementById('login-link').addEventListener('click', () => {
        loginForm.style.cssText = 'display: flex;';
        registerForm.style.display = 'none';
    });

    document.getElementById('register-link').addEventListener('click', () => {
        registerForm.style.cssText = 'display: flex;';
        loginForm.style.display = 'none';
    });

    const submitForm = async (form, url) => {
        const formData = new FormData(form);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,  // Добавляем токен в заголовок
            },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('courier_user', JSON.stringify(data));
            location.reload();
        } else {
            alert('Ошибка при отправке данных');
        }
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm(loginForm, '/register_or_login/');
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm(registerForm, '/register_or_login/');
    });
});


//////////////*******Ajax запрос для отображения заказов курьера *////////////////////
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value; // Получаем токен

document.addEventListener('DOMContentLoaded', () => {
    const courierUser = localStorage.getItem('courier_user');
    const ordersContainer = document.querySelector('.courier-orders'); // Находим контейнер для заказов

    if (courierUser) {
        const user = JSON.parse(courierUser);
        const city = user.city;

        // Функция для загрузки заказов
        const loadOrders = async () => {
            const response = await fetch(`/get_courier_orders/?city=${city}`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': csrftoken, // Добавляем токен в заголовок
                },
            });

            if (response.ok) {
                const orders = await response.json();
                ordersContainer.innerHTML = ''; // Очищаем содержимое перед обновлением

                if (orders.length > 0) {
                    orders.forEach(order => {
                        ordersContainer.innerHTML += `
                            <div class="courier-order">
                                <div class="messages">
                                    <img src="/static/icons/chat.png" alt="" class="messages-icon">
                                    <p class="messages-title">Новая доставка</p>
                                    <p class="order-number"><span>- </span>${order.order_number}</p>
                                </div>
                                <div class="order-content">
                                    <p class="admin">${order.user_name} <img src="/static/icons/map-pin.png" alt="" class="adress-icon"> <span>${order.order_adsress}</span></p>
                                    <div class="content">
                                        <p class="order_details">
                                            ${order.order_details}
                                        </p>
                                    </div>
                                </div>
                                <div class="buttons">
                                    <button class="get-order" onclick="pickupOrder(${order.id})">ЗАБРАТЬ ЗАКАЗ</button>
                                    <p>${order.created_at}</p>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    ordersContainer.innerHTML = `<p>Нет заказов для выполнения.</p>`;
                }
            } else {
                ordersContainer.innerHTML = `<p>Ошибка загрузки заказов.</p>`;
            }
        };

        // Вызов функции загрузки заказов
        loadOrders();

        // Обновляем заказы каждые 20 секунд
        setInterval(loadOrders, 20000);
    }
});






//////////////*******Кнопка забрать заказ *////////////////////
const pickupOrder = async (orderId) => {
    const courierUser = localStorage.getItem('courier_user');
    
    if (courierUser) {
        const user = JSON.parse(courierUser);
        let myOrders = JSON.parse(localStorage.getItem('myOrdersCourier')) || [];

        // Проверяем, не больше ли 3 заказов
        if (myOrders.length >= 3) {
            alert('Нельзя взять больше трех заказов.');
            return; // Отменяем выполнение
        }

        try {
            const response = await fetch(`/pickup_order/${orderId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    tel_number: user.tel_number,
                    car: user.car,
                    car_number: user.car_number,
                }),
            });

            const result = await response.json();
            console.log(response);

            if (response.ok) {
                myOrders.push(orderId); // Сохраняем новый заказ в localStorage
                localStorage.setItem('myOrdersCourier', JSON.stringify(myOrders));
                alert(result.message);
                reloadPage(); // Перезагрузка страницы
            } else {
                alert(result.error);
                reloadPage();
            }
        } catch (error) {
            alert('Ошибка сети: ' + error.message);
            reloadPage();
        }
    } else {
        alert('Пожалуйста, войдите в систему.');
        reloadPage();
    }
};


//////////////*******Кнопка Меню три точки *////////////////////
let menuBtn = document.querySelector('.menu-btn')
let courierInfo = document.querySelector('.courier-info')

menuBtn.addEventListener('click', function () {
    console.log('Toggle')
    courierInfo.classList.toggle('active')
});





//////////////*******Кнопка Мои заказы и отображения их *////////////////////
let newOrders = document.querySelector('.new-orders')
let myOrders = document.querySelector('.my-courier-orders')
let courierOrders = document.querySelector('.courier-orders')
let newTitle = document.querySelector('.new-title')

document.querySelector('.my-orders').addEventListener('click', async () => {
    document.querySelector('.courier-orders').style.display = 'none';
    document.querySelector('.my-courier-orders').style.cssText = 'display: flex;';
    newTitle.textContent = 'Мои заказы'  // Скрываем заказы курьера

    const myOrders = JSON.parse(localStorage.getItem('myOrdersCourier')) || [];

    if (myOrders.length === 0) {
        document.querySelector('.my-courier-orders').innerHTML = '<p>Нет активных заказов.</p>';
        return;
    }

    try {
        const response = await fetch('/get_orders_by_ids/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order_ids: myOrders }),
        });

        const orders = await response.json();

        const orderContainer = document.querySelector('.my-courier-orders');
        orderContainer.innerHTML = ''; // Очищаем содержимое
        

        orders.forEach(order => {
            let payment;
            let paymentIcon;
            if(order.order_payment_status == 'Онлайн') {
                paymentIcon = 'online-payment-icon';
                payment = `
                    <span>Оплачено онлайн</span>
                `;
            } else {
                paymentIcon = 'payment-icon';
                payment = `
                    <span>Оплата: ${order.total_amount} сом</span>
                `;
            }
            orderContainer.innerHTML += `
                <div class="courier-order">
                    <div class="messages">
                        <img src="/static/icons/chat.png" alt="" class="messages-icon">
                        <p class="messages-title">Моя доставка</p>
                        <p class="order-number"><span>- </span>${order.order_number}</p>
                    </div>
                    <div class="order-content">
                        <p class="admin">${order.user_name} <span class="${paymentIcon}"></span> ${payment}</p>
                        <div class="content">
                            <p class="order_details">${order.order_details}</p>
                        </div>
                    </div>
                    <div class="buttons">
                        <div class="customer-info">
                            <p class="name"> <span class="name-span"></span> ${order.order_user_name}</p>
                            <button class="tel-number" value="${order.order_tel_number}" onclick="makeCall('${order.order_tel_number}')"> <span></span> ${order.order_tel_number}</button>
                        </div>
                        <div class="courier-status">
                            <p class="adress"> <span></span> ${order.order_adsress}</p>
                            <select onchange="updateOrderStatus(${order.id}, this.value)">
                                <option value="pick_up">Забираю заказ</option>
                                <option value="on_the_way">В пути</option>
                                <option value="delivered">Доставлено</option>
                                <option value="canceled">Отменено</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
});

// Функция для обновления статуса заказа
const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await fetch(`/courier_update_order_status/${orderId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        const result = await response.json();
        alert(result.message || 'Статус обновлён');

        // Удаляем заказ из myOrdersCourier, если статус 'delivered'
        if (status === 'delivered') {
            const myOrdersCourier = JSON.parse(localStorage.getItem('myOrdersCourier')) || [];
            const updatedOrders = myOrdersCourier.filter(id => id !== orderId);
            localStorage.setItem('myOrdersCourier', JSON.stringify(updatedOrders));
            reloadPage()
        }
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
    }
};

newOrders.addEventListener('click', async () => {
    myOrders.style.display = 'none';
    courierOrders.style.display = 'flex'
    newTitle.textContent = 'Новые заказы'
})


function makeCall(telNumber) {
    window.location.href = `tel:${telNumber}`;
}