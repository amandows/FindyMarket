
function reloadPage() {
    location.reload();
}


document.addEventListener("DOMContentLoaded", function () {

    let defaultCenter = [72.746835, 41.654299];
    const apiKey = "a58ba029-221e-4c0b-91b5-91296ba6286f";
    
    function requestGpsCheck() {
        console.log("CHECK_GPS");
    }

    requestGpsCheck();
    
    // 1. Объявляем переменные в области видимости DOMContentLoaded
    syncActiveOrderState()

    /////...... функция для вызова модального окна Ошибок ...///////

    function showErrorModal(message, title = "Ошибка") {
        const modal = document.getElementById("errorModal");
        const modalTitle = document.getElementById("modalTitle");
        const modalMessage = document.getElementById("modalMessage");
        const closeBtn = modal.querySelector(".close");

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        modal.style.display = "block";
        modal.classList.add("show");

        // Закрытие при клике на крестик
        closeBtn.onclick = function () {
            modal.classList.remove("show");
            setTimeout(() => {
                modal.style.display = "none";
            }, 300);
        }

        // Закрытие при клике вне модального окна
        window.onclick = function (event) {
            if (event.target === modal) {
                modal.classList.remove("show");
                setTimeout(() => {
                    modal.style.display = "none";
                }, 300);
            }
        }
    }

    let userMarker = null;

    // Создаем карту и СРАЗУ записываем её в переменную map
    const map = new mapgl.Map('map_container_driver', {
        key: apiKey,
        center: defaultCenter,
        style: 'cf079934-7e60-4cfe-ba4f-b7c8116baeb6',
        zoom: 18,
    });

    // 2. Вспомогательная функция для карты
    // Убрали проверку !window.map, так как карта доступна в замыкании
    function updateMapDisplay(lon, lat, zoom) {
        console.log("Обновляем карту:", lon, lat); // Для отладки в консоли

        map.setCenter([lon, lat]);
        if (zoom) map.setZoom(zoom);

        if (userMarker) {
            userMarker.destroy();
        }

        userMarker = new mapgl.HtmlMarker(map, {
            coordinates: [lon, lat],
            html: `<div class="user_marker">
                <div class="content">
                    <div class="img_container">
                        <img src="/static/icons/navigation.svg" alt="">
                    </div>
                </div>
            </div>`,
            anchor: [0.5, 1]
        });
    }

    async function syncLocation(showLoader = false) {
        const modal = document.getElementById('geo-loader-modal');
        const statusText = document.getElementById('geo-status-text');

        if (showLoader && modal) {
            modal.style.display = 'flex';
            statusText.innerText = "Запрос к GPS...";
        }

        if (!navigator.geolocation) {
            if (showLoader) modal.style.display = 'none';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // А) Вызываем обновление карты
                updateMapDisplay(lon, lat, 18);

                // Б) Отправка на бэкенд
                if (showLoader && statusText) statusText.innerText = "Обновление в базе...";

                try {
                    const response = await fetch('/api/driver/update-coordinates/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        body: JSON.stringify({ latitude: lat, longitude: lon })
                    });

                    if (response.ok && showLoader) {
                        statusText.innerText = "Координаты обновлены!";
                        setTimeout(() => { modal.style.display = 'none'; }, 800);
                    }
                } catch (e) {
                    console.error("Ошибка сервера:", e);
                    if (showLoader) modal.style.display = 'none';
                }
            },
            (error) => {
                console.error("Ошибка GPS:", error);
                if (showLoader) {
                    showErrorModal("Ошибка GPS: убедитесь, что геолокация включена", "⚠️ Предупреждение");
                    modal.style.display = 'none';
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    // Запуск при загрузке
    syncLocation(false);

    // Слушатель кнопки
    const updateBtn = document.querySelector(".update_my_location_btn");
    if (updateBtn) {
        updateBtn.addEventListener("click", () => syncLocation(true));
    }
    checkDriverStatusOnLoad();

    // Токен для POST запросов
    // const csrftoken = "{{ csrf_token }}";
    let pollingInterval;
    window.showingOrder = false;

    // Кнопка GO / Поиск
    const btn = document.getElementById("goBtn");

    btn.addEventListener("click", async () => {
        const wasActive = btn.classList.contains("active");
        const nextStatus = wasActive ? 'offline' : 'online';

        try {
            const response = await fetch('/api/driver/toggle-status/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (response.ok) {
                // Перезагружаем страницу только после того, как сервер подтвердил смену статуса
                window.location.reload();
            } else {
                console.error("Сервер вернул ошибку при смене статуса");
                showErrorModal("Не удалось сменить статус на сервере", "Предупреждение");
            }

        } catch (error) {
            console.error("Ошибка сети:", error);
            showErrorModal("Проверьте интернет-соединение.", "Пожалуйста");
        }
    });


    // Слушаем ОТМЕНУ заказа
    document.addEventListener('orderCancelledByClient', function (e) {
        console.log("Событие: Заказ отменен клиентом!", e.detail.orderId);

        // Вызываем нашу новую функцию закрытия
        closeModal();

        // Опционально: можно вывести уведомление водителю
        showErrorModal("Клиент отменил текущий заказ.", "Сообщение");
        return; 
    });


    // Слушаем событие из любого другого файла
    document.addEventListener('newOrderArrived', function (e) {
        console.log("Событие получено! ID заказа:", e.detail.orderId);

        // Теперь вызываем нашу функцию, она точно здесь доступна
        if (typeof checkCurrentOrder === 'function') {
            checkCurrentOrder();
        }
    });

    /**
 * Проверяет статус конкретного заказа из localStorage.
 * Если заказ отменен на сервере — закрывает модалку.
 */
    async function syncActiveOrderState() {
        const activeOrderId = localStorage.getItem('my_active_order');

        if (!activeOrderId) {
            console.log("Нет активного заказа в хранилище для проверки.");
            return;
        }

        try {
            const response = await fetch(`/api/driver/check-order/${activeOrderId}/`);

            // 🔴 Проверка на HTTP ошибки
            if (!response.ok) {
                console.warn("Ошибка ответа сервера:", response.status);
                return;
            }

            const data = await response.json();
            console.log("Синхронизация заказа:", data.status);

            // 🔴 Закрываем при любых "невалидных" статусах
            if (
                data.status == "canceled" ||
                data.status == "not_found" ||
                data.status == "not_yours"
            ) {
                console.warn(`Закрываем заказ (${data.status})`);

                closeModal();

                // 👉 можно сразу очистить localStorage
                localStorage.removeItem('my_active_order');

                return;
            }

            console.log("Заказ все еще актуален:", data.status);

        } catch (e) {
            console.error("Ошибка при синхронизации заказа:", e);
        }
    }

    // 1. Функция разовой проверки (при фокусе/разворачивании)
    async function checkCurrentOrder() {
        console.log("Вызов проверки заказа из taxi_del.js...");
        try {
            let response = await fetch('/api/driver/check/');
            let data = await response.json();
            if (data.has_order) {
                console.log("Нашелся активный заказ через проверку API");
                showOrderModal(data);
            }
        } catch (e) {
            console.error("Ошибка при проверке заказа:", e);
        }
    }

    // 2. Слушаем разворачивание приложения (когда фокус возвращается)
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
            console.log("Приложение активно, проверяем заказы...");
            checkCurrentOrder();
            syncActiveOrderState();
        }
    });


    let currentOrderId = null; // Глобальная переменная

    function showOrderModal(order) {
        currentOrderId = order.order_id;
        window.showingOrder = true;
        let isAccepted = false; // 🔥 ФЛАГ-ПРЕДОХРАНИТЕЛЬ

        const totalSeconds = 10;
        let elapsedPercent = 0;
        const btn = document.getElementById('accept-btn');

        btn.style.setProperty('--progress', '0%');

        let timer = setInterval(async () => {
            elapsedPercent += (100 / (totalSeconds * 10));
            btn.style.setProperty('--progress', `${elapsedPercent}%`);

            if (elapsedPercent >= 100) {
                clearInterval(timer);

                // ✅ ЕСЛИ УЖЕ ПРИНЯТ — НЕ SKIP
                if (!window.showingOrder || !currentOrderId) return;

                await autoSkip(currentOrderId);
            }
        }, 100);

        // Обновляем данные в модалке
        document.getElementById('order-address').innerText = order.pickup;
        document.getElementById('destination-address').innerText = order.destination;
        document.getElementById('order-price').innerText = order.price + " сом";
        document.getElementById('time').innerText = order.duration + "мин";
        document.getElementById('distance').innerText = order.distance + "км";
        document.getElementById('order-modal').style.display = 'flex';
        document.getElementById('driver-app').style.display = 'none';

        // Принятие заказа
        btn.onclick = async () => {
            clearInterval(timer);
            window.showingOrder = false;

            if (currentOrderId) {
                // Желательно дождаться ответа, прежде чем что-то делать дальше
                await acceptOrder(currentOrderId); 
            }
        };
    }

    async function autoSkip(orderId) {
        localStorage.removeItem('my_active_order');
        if (!orderId || orderId === "null") {
            console.error("Ошибка: Попытка отправить SKIP для пустого ID");
            closeModal();
            return;
        }
        if (!window.showingOrder) {
            console.log("Skip отменен — заказ уже принят");
            return;
        }
        try {
            const response = await fetch(`/api/order/${orderId}/skip/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 404) {
                console.error("Сервер вернул 404. Проверь urls.py и существование заказа.");
            }
        } catch (e) {
            console.error("Ошибка при пропуске заказа:", e);
        }
        closeModal();
        showErrorModal(
            "Вы не приняли заказ. Ваша активность будет снижена.",
            "⚠️ Предупреждение"
        );
        return; 
    }

    async function acceptOrder(orderId) {
        try {
            const token = typeof csrftoken !== 'undefined' ? csrftoken : getCookie('csrftoken');

            let res = await fetch(`/api/order/${orderId}/accept/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': token,
                    'Content-Type': 'application/json'
                }
            });

            let result = await res.json();

            if (result.success) {
                // Если сервер сразу прислал данные заказа (с телефоном и т.д.)
                if (result.order) {
                    if (result.order.status === "canceled") {
                        closeModal()
                    }
                    showDriverActiveOrder(result.order);
                } else {
                    // Если сервер прислал только success: true, тогда идем за данными в отдельное API
                    await fetchAndShowActiveOrder();
                }
            } else {
                showErrorModal(`${result.message} Ошибка принятия заказа`, "Пожалуйста");
                closeModal();
            }
        } catch (e) {
            console.error("Ошибка:", e);
            showErrorModal("Сбой сети", "⚠️ Предупреждение");
        }
    }


    function closeModal() {
        document.getElementById('order-modal').style.display = 'none';
        document.getElementById('driver-app').style.display = 'flex';
        window.showingOrder = false;
        currentOrderId = null; // Сбрасываем ID
        localStorage.removeItem('active_driver_order');
    }

    // Теперь функция "Отмена" будет работать правильно
    async function closeModalManually() {
        console.log("DEBUG: Нажата кнопка Пропустить. Текущий ID:", currentOrderId);

        if (currentOrderId && currentOrderId !== "null") {
            await autoSkip(currentOrderId);
        } else {
            console.warn("DEBUG: Попытка пропустить заказ с ID null. Просто закрываем окно.");
            closeModal();
        }
    }


    async function checkDriverStatusOnLoad() {
        try {
            let response = await fetch('/api/driver/init-data/');
            let data = await response.json();
            console.log(data)

            if (data.status) {
                // Обновляем текст и статистику
                document.getElementById('drv-rating').innerText = data.rating;
                document.getElementById('drv-balance').innerText = `${data.balance} сом`;
                document.getElementById('drv-trips').innerText = `Сегодня: ${data.today_trips}`;
                document.getElementById('drv-car-details').innerText = data.car;
                document.getElementById('drv-car-class').innerText = `${data.role} / ${data.car_class}`;
                document.getElementById('my_city').innerText = data.city;


                const btn = document.getElementById("goBtn");
                const label = document.getElementById("status-label");
                const statusIcon = document.querySelector('.status_icon ')

                if (data.status === 'online') {
                    // Если водитель уже онлайн в базе, активируем кнопку визуально
                    btn.classList.add("active");
                    btn.querySelector(".label").textContent = "Поиск";
                    label.textContent = "Активный";
                    label.style.cssText = 'background: #1c851c;'
                    statusIcon.style.cssText = 'background: url("/static/icons/wi-fi.png") bottom/cover no-repeat;'
                } else if (data.status === 'busy') {
                    btn.classList.remove("active");
                    label.textContent = "Вы на заказе";
                    label.style.cssText = 'background: #b18817;'
                    // Здесь можно добавить старт опроса статуса текущего заказа
                } else {
                    label.textContent = "Оффлайн";
                    statusIcon.style.cssText = 'background: url("/static/icons/wifi-off.png") center/cover no-repeat;'
                    label.style.cssText = 'background: #aa1616;'
                }
            }
        } catch (e) {
            console.error("Ошибка инициализации данных водителя:", e);
        }
    }

    // Изменим вашу функцию клика, чтобы она отправляла статус на сервер
    btn.addEventListener("click", async () => {
        const isActive = btn.classList.contains("active");
        const newStatus = isActive ? 'offline' : 'online'; // Меняем на противоположный

        // Сообщаем серверу о смене статуса
        try {
            let res = await fetch('/api/driver/toggle-status/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                btn.classList.toggle("active");
                if (btn.classList.contains("active")) {
                    btn.querySelector(".label").textContent = "Поиск";
                    document.getElementById("status-label").textContent = "Вы в поиске...";
                } else {
                    btn.querySelector(".label").textContent = "Go";
                    document.getElementById("status-label").textContent = "Вы оффлайн";
                    clearInterval(pollingInterval);
                }
            }
        } catch (e) {
            showErrorModal("Не удалось изменить статус. Проверьте интернет", "⚠️ Предупреждение");
        }
    });


    // 1. Сначала константы
    const LS_DRIVER_ORDER_KEY = 'active_driver_order';

    // 2. Вспомогательные функции
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // 1. Новая функция получения полных данных
    async function fetchAndShowActiveOrder() {
        try {
            const response = await fetch('/api/driver/active-order/');

            // Если статус 404 или 500, не пытаемся парсить JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ошибка сервера:", errorText);
                return;
            }

            const data = await response.json();
            if (data.success) {
                showDriverActiveOrder(data.order);
            }
        } catch (e) {
            console.error("Ошибка парсинга или сети:", e);
        }
    }


    // 2. Обновленная функция отрисовки (вставляет все данные)
    function showDriverActiveOrder(order) {
        // Сохраняем в LS для надежности
        localStorage.setItem(LS_DRIVER_ORDER_KEY, JSON.stringify(order));

        // А) Текстовые данные
        document.getElementById('driver-status-label').innerText = `Заказ принят / ${order.price} сом`;
        document.getElementById('driver-order-address').innerText = order.pickup;
        document.getElementById('driver-destination-address').innerText = order.destination;
        document.getElementById('driver-comment_text').innerText = order.comment || "Нет комментария";

        // Б) Видимость блоков
        document.querySelector('.taxi_accept_order').style.display = 'flex';
        document.getElementById('driver-app').style.display = 'none';
        document.getElementById('order-modal').style.display = 'none';

        // В) ЛОГИКА ТЕЛЕФОНА И WHATSAPP
        if (order.customer_phone) {
            const phone = order.customer_phone.replace(/\D/g, ''); // Чистим номер

            // Кнопка позвонить
            document.querySelector(".customer_call").onclick = () => {
                window.location.href = `tel:+996${phone}`;
            };

            // Кнопка WhatsApp
            document.querySelector(".customer_whatsapp").onclick = () => {
                // В WebView лучше переходить напрямую, чтобы сработал перехват URL
                window.location.href = `https://wa.me/${phone}`;
            };
        }

        // Г) Навигация (2GIS)
        document.querySelector(".customer_pickup_address").onclick = () => {
            window.open(`https://2gis.ru/routeSearch/rsType/car/from/-/to/${order.pickup_longitude},${order.pickup_latitude}`, '_blank');
        };
        // Г) Навигация (2GIS)
        document.querySelector(".customer_destination_address").onclick = () => {
            window.open(`https://2gis.ru/routeSearch/rsType/car/from/-/to/${order.destination_longitude},${order.destination_latitude}`, '_blank');
        };

        // Кнопка: Маршрут до клиента
        const routeToClientBtn = document.getElementById('btn-go-to-pickup');
        if (routeToClientBtn) {
            routeToClientBtn.onclick = (e) => handleButtonClick(e.currentTarget, async () => {
                window.open(`https://2gis.ru/routeSearch/rsType/car/from/-/to/${order.pickup_longitude},${order.pickup_latitude}`, '_blank');
                await updateStatusAndCleanup(order.order_id, 'on_way');
            });
        }

        // Кнопка: Поехали (К точке Б)
        const btnStartTrip = document.getElementById('btn-start-trip');
        if (btnStartTrip) {
            btnStartTrip.onclick = (e) => handleButtonClick(e.currentTarget, async () => {
                window.open(`https://2gis.ru/routeSearch/rsType/car/from/-/to/${order.destination_longitude},${order.destination_latitude}`, '_blank');
                await updateStatusAndCleanup(order.order_id, 'in_progress');
            });
        }

        // Кнопка: На месте
        document.getElementById('btn-on-site').onclick = (e) => handleButtonClick(e.currentTarget, async () => {
            await updateStatusAndCleanup(order.order_id, 'arrived');
        });

        // Кнопка: Завершить
        document.getElementById('btn-complete-order').onclick = (e) => handleButtonClick(e.currentTarget, async () => {
            // 1. Завершаем заказ, но запрещаем функции делать reload() автоматически
            const success = await updateStatusAndCleanup(order.order_id, 'completed', false);
                
            if (success) {
                // 2. Теперь спокойно включаем Online
                await setDriverOnlineUI();
                
                // 3. Теперь можно либо обновить UI без перезагрузки, либо перезагрузить вручную
                console.log("Заказ завершен, статус Online включен");
                location.reload(); 
            }
        });
        // Кнопка: Отмена (тут конфирм сам по себе является защитой, но анимация не помешает)
        document.getElementById('btn-cancel-order').onclick = (e) => {
            if (confirm("Отменить заказ?")) {
                handleButtonClick(e.currentTarget, async () => {
                    await updateStatusAndCleanup(order.order_id, 'canceled');
                });
            }
        };
        refreshDriverUI(order.status);
    }

    // 4. Обновление кнопок
    function refreshDriverUI(status) {
        const btnWay = document.getElementById('btn-go-to-pickup');
        const btnArrived = document.getElementById('btn-on-site');
        const btnStart = document.getElementById('btn-start-trip');
        const btnComplete = document.getElementById('btn-complete-order');
        const btnCancel = document.getElementById('btn-cancel-order');
        const label = document.getElementById('status-label');

        const allBtns = [btnWay, btnArrived, btnStart, btnComplete, btnCancel];
        allBtns.forEach(b => { if (b) b.style.display = 'none'; });

        if (status === 'accepted' || status === 'pending') {
            if (btnWay) btnWay.style.display = 'flex';
            if (btnCancel) btnCancel.style.display = 'flex';
        } else if (status === 'on_way') {
            if (btnArrived) btnArrived.style.display = 'flex';
            if (btnCancel) btnCancel.style.display = 'flex';
            label.innerText = "Вы едете к клиенту";
        } else if (status === 'arrived') {
            if (btnStart) btnStart.style.display = 'flex';
            if (btnCancel) btnCancel.style.display = 'flex';
            label.innerText = "Вы на месте (ждете)";
        } else if (status === 'in_progress') {
            if (btnComplete) btnComplete.style.display = 'flex';
            if (btnCancel) btnCancel.style.display = 'none';
            label.innerText = "Поездка в процессе";
        }
    }

    // 5. Работа с API
    async function updateStatusAndCleanup(orderId, newStatus, shouldReload = true) {
        try {
            const response = await fetch(`/api/orders/${orderId}/update_status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                if (['completed', 'canceled'].includes(newStatus)) {
                    localStorage.removeItem(LS_DRIVER_ORDER_KEY);
                    // Если нам НЕ нужно перезагружать страницу сразу (например, чтобы успеть обновить UI)
                    if (shouldReload) {
                        location.reload();
                    }
                } else {
                    // ... логика обновления без перезагрузки ...
                    refreshDriverUI(newStatus);
                }
                return true; // Возвращаем успех
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    }

    async function setDriverOnlineUI() {
        const btn = document.getElementById('trigger-push-btn'); // Ваша кнопка "Go"
        const statusLabel = document.getElementById("status-label");

        try {
            let res = await fetch('/api/driver/toggle-status/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRF(), // Убедитесь, что функция getCSRF доступна
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'online' })
            });

            if (res.ok) {
                // Визуально активируем кнопку поиска
                if (btn) {
                    btn.classList.add("active");
                    const label = btn.querySelector(".label");
                    if (label) label.textContent = "Поиск";
                }
                // Обновляем текстовый статус
                if (statusLabel) {
                    statusLabel.textContent = "Вы в поиске...";
                }
                console.log("Водитель автоматически переведен в ONLINE");
            }
        } catch (e) {
            console.error("Ошибка при авто-переключении статуса:", e);
        }
    }

    // 6. Проверка при загрузке
    function checkActiveOrderOnLoad() {
        const savedOrder = localStorage.getItem(LS_DRIVER_ORDER_KEY);
        if (savedOrder) {
            try {
                showDriverActiveOrder(JSON.parse(savedOrder));
            } catch (e) {
                localStorage.removeItem(LS_DRIVER_ORDER_KEY);
            }
        }
    }

    async function handleButtonClick(btnElement, asyncFunc) {
        if (btnElement.disabled) return; // Защита, если кнопка уже нажата

        // 1. Блокируем кнопку и добавляем эффект
        btnElement.disabled = true;
        btnElement.classList.add('btn-loading');

        try {
            // 2. Выполняем основное действие (запрос к API или открытие карты)
            await asyncFunc();
        } catch (e) {
            console.error("Ошибка при выполнении действия:", e);
            // Если ошибка — возвращаем кнопку в рабочее состояние
            btnElement.disabled = false;
            btnElement.classList.remove('btn-loading');
        }
        // Если всё успешно, refreshDriverUI сам скроет/удалит кнопку, 
        // поэтому снимать disabled тут не обязательно.
    }

    // --- КРИТИЧЕСКИЙ МОМЕНТ: ЗАПУСК В САМОМ КОНЦЕ ---
    checkActiveOrderOnLoad();
});


