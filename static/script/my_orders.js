// CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Инициализация аккордеонов
function initOrderAccordions() {
    const inputs = document.querySelectorAll(".order_accordion input[type='checkbox']");
    inputs.forEach(input => {
        input.onchange = null; // сброс предыдущих обработчиков
        const arrow = input.parentElement.querySelector(".arrow");
        const content = input.parentElement.querySelector(".order_accordion-content");

        input.addEventListener("change", function () {
            if (this.checked) {
                arrow.style.transform = "rotate(180deg)";
                content.style.maxHeight = "clamp(60px, 100vw, 800px)";
                content.style.padding = "0 0";
            } else {
                arrow.style.transform = "rotate(0deg)";
                content.style.maxHeight = "0";
                content.style.padding = "0";
            }
        });
    });
}















// Обработчики кнопок "Приехал / Не приехал"
document.addEventListener('DOMContentLoaded', () => {

    function updateOrdersPage() {
        fetch(window.location.href, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
        })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newOrders = doc.querySelector('.orders-page');
            const ordersContainer = document.querySelector('.orders-page');
            if (ordersContainer && newOrders) {
                ordersContainer.innerHTML = newOrders.innerHTML;

                // После обновления нужно заново повесить обработчики кнопок
                initOrderAccordions(); // <-- повторно активируем аккордеоны
                attachOrderButtons();
            }
        })
        .catch(error => console.error('Ошибка при обновлении заказов:', error));
    }

    function attachOrderButtons() {
        document.querySelectorAll('.order-actions a').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const url = this.href;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                })
                .then(response => response.json())
                .then(data => {
                    // После успешного изменения статуса — обновляем весь блок заказов
                    updateOrdersPage();
                })
                .catch(error => console.error('Ошибка:', error));
            });
        });
    }

    attachOrderButtons(); // Изначальное навешивание кнопок
});













function updateOrderStatuses() {
    fetch("/my-orders-ajax/")
        .then(response => response.json()) // JSON: [{id, status, delivery_result, created_at}, ...]
        .then(data => {
            data.orders.forEach(order => {
                const item = document.querySelector(`.order_accordion-item[data-order-id="${order.id}"]`);
                if (!item) return;

                const headerTitle = item.querySelector(".order_accordion_title");
                if (!headerTitle) return;

                if (order.delivery_result === "success") {
                    headerTitle.textContent = "Завершен";
                } else if (order.delivery_result === "failed") {
                    headerTitle.textContent = "Заказ не приехал";
                } else {
                    if (order.status === "in_progress") {
                        headerTitle.textContent = "В обработке";
                    } else if (order.status === "completed") {
                        headerTitle.textContent = "Заказ в пути";
                    } else if (order.status === "cancelled") {
                        headerTitle.textContent = "Отменен отправителем";
                    }
                }
            });
        })
        .catch(err => console.error("Ошибка при обновлении статусов:", err));
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initOrderAccordions();
    updateOrderStatuses(); // сразу показать актуальные статусы
    setInterval(updateOrderStatuses, 60000); // автообновление каждые 60 секунд
});
