
// функция для обновления страницы
window.addEventListener("load", function () {
    document.getElementById("preloader1").style.display = "none";
});

/////////...........прелоадер показывался только при переходе

document.addEventListener("DOMContentLoaded", function () {
    // Прячем прелоадер, если он активен
    const preloader = document.getElementById("preloader");
    if (preloader) {
        preloader.style.display = "none";
    }

    // Список хостов/URL-начал, для которых НЕ показываем прелоадер
    const excludedHosts = [
        "app.mbank.kg",
        "api.dengi.o.kg",
        "pay.payqr.kg",
        "qr.ab.kg"
    ];
    const excludedStarts = [
        "https://app.mbank.kg/",
        "https://api.dengi.o.kg/",
        "https://pay.payqr.kg",
        "https://qr.ab.kg"
    ];

    function isExcludedHref(href, element) {
        if (!href) return false;

        // Пропускаем якоря и javascript
        if (href.startsWith("#") || href.startsWith("javascript:")) return true;

        // Пропускаем кнопки заказов
        if (element.classList.contains("btn-success") || element.classList.contains("btn-failed")) return true;

        // Проверка по началу ссылки
        for (const start of excludedStarts) {
            if (href.startsWith(start)) return true;
        }

        // Проверка по hostname
        try {
            const url = new URL(href, location.href);
            if (excludedHosts.includes(url.hostname)) return true;
        } catch (e) {
            // если не парсится, считаем обычной ссылкой
        }

        return false;
    }

    document.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", function (event) {
            const href = link.getAttribute("href");

            if (!href || isExcludedHref(href, link)) return;

            if (preloader) {
                preloader.style.display = "flex";
            }
        });
    });

    window.addEventListener("pageshow", function () {
        if (preloader) {
            preloader.style.display = "none";
        }
    });
});



function showOrderPreloader() {
    const preloader = document.getElementById("preloader_order");
    if (preloader) preloader.style.display = "flex";
}

function hideOrderPreloader() {
    const preloader = document.getElementById("preloader_order");
    if (preloader) preloader.style.display = "none";
}



function reloadPage() {
    location.reload();
}

/////////////////// *** Функции модального окна при оформлении заказа *** ////////////////////

function openModal() {
    document.getElementById("successModal").style.display = "flex";
}

const closeBtnModalOrder = document.querySelector(".close-btn")
const closeModalOrder = document.getElementById("successModal")
closeBtnModalOrder.addEventListener("click", (event) => {
    closeModalOrder.style.display = "none";
    submitRating()
    location.reload();
});


updateCartBtnClass()

/////////////////// *** Функции оценки заведения *** ////////////////////


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie("csrftoken");


let selectedRating = 0;

document.addEventListener("DOMContentLoaded", function () {
    const stars = document.querySelectorAll("#ratingStars span");

    stars.forEach((star, index) => {
        star.addEventListener("click", function () {
            selectedRating = parseInt(this.dataset.value);

            // снимаем подсветку со всех
            stars.forEach(s => s.classList.remove("active"));

            // подсвечиваем до выбранной включительно
            for (let i = 0; i < selectedRating; i++) {
                stars[i].classList.add("active");
            }
        });

        // Наведение для визуального эффекта (не обязательно, но красиво)
        star.addEventListener("mouseover", function () {
            stars.forEach(s => s.classList.remove("hover"));
            for (let i = 0; i <= index; i++) {
                stars[i].classList.add("hover");
            }
        });

        star.addEventListener("mouseleave", function () {
            stars.forEach(s => s.classList.remove("hover"));
        });
    });
});



function submitRating() {
    if (selectedRating === 0) {
        alert("Пожалуйста, выберите оценку ⭐");
        return;
    }

    const userId = localStorage.getItem("rating_user_id");

    fetch("/submit-rating/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        },
        body: JSON.stringify({
            rating: selectedRating,
            user_id: userId
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Оценка сохранена:", data);
        document.getElementById("successModal").style.display = "none";
    })
    .catch(err => console.error("Ошибка:", err));
}




/////.......функция, которая будет отслеживать корзину и менять класс на кнопке футера cartBtn в зависимости от того, пустая корзина или нет..../////
function updateCartBtnClass() {
    const cartBtn = document.querySelector('.cards-btn');
    if (!cartBtn) return;

    const carts = localStorage.getItem('cart');

    if (!carts || carts === '{}' || carts === 'null') {
        // корзина пуста
        cartBtn.classList.remove('cards-btn-add');
    } else {
        // корзина не пуста
        cartBtn.classList.add('cards-btn-add');
        console.log(carts.length)
    }

}


/////////////////// *** Подзагрузка изображения контента при скролле *** ////////////////////

scrollY()

function scrollY() {
    const lazyImages = document.querySelectorAll('img[data-src]')
    const windowHeight = document.documentElement.clientHeight;

    let lazyImagesPositions = []
    if (lazyImages.length > 0) {
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                lazyImagesPositions.push(img.getBoundingClientRect().top + window.pageYOffset)
                lazyScrollCheck()
            }
        })
    }
    window.addEventListener('scroll', lazyScroll)

    function lazyScroll() {
        if (document.querySelectorAll('img[data-src]').length > 0) {
            lazyScrollCheck()
        }
    }

    function lazyScrollCheck() {
        let imgIndex = lazyImagesPositions.findIndex(
            item => window.pageYOffset > item - windowHeight
        )
        if (imgIndex >= 0) {
            if (lazyImages[imgIndex].dataset.src) {
                lazyImages[imgIndex].src = lazyImages[imgIndex].dataset.src;
                lazyImages[imgIndex].removeAttribute('data-src');
            }
            delete lazyImagesPositions[imgIndex];
        }
    }
}





/////////////////// *** Фунция aside menu*** ////////////////////


const menuBtn = document.querySelector('.aside-btn');
const asideMenu = document.querySelector('.aside-menu');

if (menuBtn && asideMenu) {
    // Открытие/закрытие меню по кнопке
    menuBtn.addEventListener('click', () => {
        asideMenu.classList.toggle('aside-active');
        menuBtn.classList.toggle('aside-btn-active');
        history.pushState({ aside: true }, ""); // добавляем запись в историю
    });

    // Свайп влево для закрытия
    function addSwipeLeftListener(container) {
        let startX = 0;

        container.addEventListener("touchstart", (event) => {
            startX = event.touches[0].clientX;
        });

        container.addEventListener("touchmove", (event) => {
            let deltaX = event.touches[0].clientX - startX;

            if (deltaX < -60) { // свайп влево
                container.classList.remove("aside-active");
                menuBtn.classList.remove('aside-btn-active');
            }
        });
    }

    addSwipeLeftListener(asideMenu);

    // Обработка кнопки "назад" на телефоне
    window.addEventListener("popstate", (event) => {
        if (asideMenu.classList.contains("aside-active")) {
            asideMenu.classList.remove("aside-active");
            menuBtn.classList.remove('aside-btn-active');
            history.pushState({ aside: false }, ""); // чтобы следующий popstate срабатывал корректно
        }
    });
}

// Применяем функцию к asideMenu
addSwipeLeftListener(asideMenu);


// Выбор курьера или сам заберу корзина
document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".delivery_buttons");
    const deliverySelect = document.getElementById("delivery");
    const adressInput = document.getElementById("adress_input");

    buttons.forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation(); // Останавливаем всплытие события
            // Убираем 'active' у всех кнопок
            buttons.forEach(btn => btn.classList.remove("active"));

            // Добавляем 'active' только к выбранной кнопке
            this.classList.add("active");

            // Устанавливаем соответствующее значение в скрытом select
            if (this.classList.contains("type_courier")) {
                deliverySelect.value = "Доставка";
                adressInput.classList.add("adress_active")
            } else if (this.classList.contains("type_pickup")) {
                deliverySelect.value = "Самовывоз";
                adressInput.classList.remove("adress_active")
            }
        });
    });
});



// Выбор оплаты корзина
document.addEventListener("DOMContentLoaded", function () {
    const banksLink = document.querySelector(".banks_link");
    const fileGroup = document.querySelector(".file-group");
    const paymentButtons = document.querySelectorAll(".payment_buttons");
    const paymentSelect = document.getElementById("payment");
    const accordionTitle = document.querySelector(".accordion_title");
    const accordionInput = document.getElementById("acc1"); // чекбокс аккордеона

    paymentButtons.forEach(button => {
        button.addEventListener("click", function () {
            // Убираем 'active' у всех кнопок
            paymentButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            // Меняем состояние в зависимости от типа
            if (this.classList.contains("type_online")) {
                paymentSelect.value = "Онлайн";
                banksLink.classList.add("active");
                // fileGroup.classList.add("active");
                // banksLink.style.display = "flex";
                fileGroup.style.display = "block";
                accordionTitle.textContent = "Cпособ оплаты онлайн";
            } else {
                paymentSelect.value = "Наличными";
                banksLink.classList.remove("active");
                // fileGroup.classList.remove("active");
                // banksLink.style.display = "none";
                fileGroup.style.display = "none";
                accordionTitle.textContent = "Cпособ оплаты наличными";
            }

            // ✅ Закрываем аккордеон (снимаем галочку с чекбокса)
            if (accordionInput && accordionInput.checked) {
                setTimeout(() => { accordionInput.checked = false; }, 500);
                // accordionInput.checked = false;
            }
        });
    });
});








// Сохраняем ссылки на кнопки и контейнеры
let searchContainer = document.querySelector(".search-container");
let userContainer = document.querySelector(".user-container");
let cartsContainer = document.querySelector(".carts");

let searchBtn = document.querySelector(".search-btn");
let userBtn = document.querySelector(".user-btn");
let cartsBtn = document.querySelector(".cards-btn");

// Функция для закрытия всех активных контейнеров
function closeAll() {
    searchContainer?.classList.remove("search-active");
    userContainer?.classList.remove("user-active");
    cartsContainer?.classList.remove("carts-active");

    searchBtn?.classList.remove("search-btn-active");
    userBtn?.classList.remove("user-btn-active");
    cartsBtn?.classList.remove("cards-btn-active");
}

// Обработчик кнопок футера
document.querySelectorAll(".search-btn, .user-btn, .cards-btn").forEach((button) => {
    button.addEventListener("click", () => {
        if (button.classList.contains("search-btn")) {
            searchContainer?.classList.toggle("search-active");
            searchBtn?.classList.toggle("search-btn-active");
            userContainer?.classList.remove("user-active");
            cartsContainer?.classList.remove("carts-active");
            userBtn?.classList.remove("user-btn-active");
            cartsBtn?.classList.remove("cards-btn-active");
        } else if (button.classList.contains("user-btn")) {
            userContainer?.classList.toggle("user-active");
            userBtn?.classList.toggle("user-btn-active");
            searchContainer?.classList.remove("search-active");
            cartsContainer?.classList.remove("carts-active");
            searchBtn?.classList.remove("search-btn-active");
            cartsBtn?.classList.remove("cards-btn-active");
        } else if (button.classList.contains("cards-btn")) {
            cartsContainer?.classList.toggle("carts-active");
            cartsBtn?.classList.toggle("cards-btn-active");
            searchContainer?.classList.remove("search-active");
            userContainer?.classList.remove("user-active");
            searchBtn?.classList.remove("search-btn-active");
            userBtn?.classList.remove("user-btn-active");
        }

        // Добавляем запись в историю, чтобы кнопка назад срабатывала на popstate
        history.pushState({ active: true }, "");
    });
});

// Обработчик кнопки "назад" на телефоне
window.addEventListener("popstate", (event) => {
    // Если есть активные контейнеры, просто закрываем их
    if (searchContainer?.classList.contains("search-active") ||
        userContainer?.classList.contains("user-active") ||
        cartsContainer?.classList.contains("carts-active")) {
        closeAll();

        // Создаем "новое состояние", чтобы повторное нажатие назад снова вызвало popstate
        history.pushState({ active: false }, "");
    } else {
        // Если ничего не активно, браузер вернется на предыдущую страницу
        history.back();
    }
});



// -------- Сохраняем единую ссылку оплаты в localStorage --------
function addBankLinksToLocalStorage() {

    let payLink = document.querySelector('.bank_link').textContent.trim() || '';
    console.log(payLink)

    if (payLink && payLink !== 'None' && payLink !== 'null') {
        localStorage.setItem('bank_pay_link', payLink);
        console.log('Pay ссылка сохранена:', payLink);
    } else {
        localStorage.removeItem('bank_pay_link');
        console.log('Pay ссылка удалена');
    }
}



////////----- функция, которая достает 4 ссылки банков из localStorage ------//////////

function loadBankLinksFromLocalStorage() {
    const carts = localStorage.getItem('cart');
    const isValid = (link) => link && link !== 'None' && link !== 'null' && link.trim() !== '';

    const bankButtons = document.querySelectorAll('.bank-btn');

    // Ссылка одна для всех
    const payLink = localStorage.getItem('bank_pay_link');

    // Если корзина пуста — блокируем кнопки
    if (!carts || carts === '{}' || carts === '[]' || !isValid(payLink)) {

        bankButtons.forEach(btn => {
            btn.style.filter = 'grayscale(1)';
            btn.style.pointerEvents = 'none';
        });

        console.log('Корзина пуста — банки отключены');
        return;
    }

    // Если всё ок — активируем
    bankButtons.forEach(btn => {
        btn.style.filter = 'none';
        btn.style.pointerEvents = 'auto';

        btn.onclick = function () {
            const packageName = this.dataset.package;
            console.log("OPEN_APP:" + packageName + "|" + payLink);
        };
    });

    console.log('Банки активированы с единой ссылкой:', payLink);
}






/////////////////// *** Функция внутри страницы корзины *** ////////////////////

document.addEventListener("DOMContentLoaded", function () {
    var cartButton = document.querySelector('.cards-btn');
    var cartsContainer = document.querySelector('.carts');
    var productsContainer = cartsContainer.querySelector('.cart-products');



    //// Слушатель события для кнопки "Корзина"
    cartButton.addEventListener('click', () => {
        loadCartItems(); // Загружаем товары из корзины
        updateTotalPrice(); // Обновляем общую сумму
        loadBankLinksFromLocalStorage() // Выгружаем ссылки банкингов
    });


    // Функция загрузки товаров из localStorage в корзину
    function loadCartItems() {
        productsContainer.innerHTML = ''; // Очищаем контейнер перед загрузкой

        // Получаем корзину из localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || {};

        // Добавляем товары из корзины в HTML
        Object.keys(cart).forEach(function (foodId) {
            var foodHTML = cart[foodId];

            // Создаем временный элемент для парсинга foodHTML
            var tempElement = document.createElement('div');
            tempElement.innerHTML = foodHTML.trim();

            // Находим внутренний элемент .food
            var foodElement = tempElement.querySelector('.food');
            foodElement.setAttribute('id', foodId);

            // Находим кнопку "Удалить" и заменяем на "В Корзину"
            var button = foodElement.querySelector('.button.box');
            // button.textContent = 'Удалить';
            // button.style.backgroundColor = 'red'; // Убираем стили, если нужно
            button.style.cssText = 'background: #f1f1f1ff url("/static/icons/remove.png") center/clamp(10px, 4.0vw, 30px) no-repeat;';

            // Добавляем слушатель события для кнопки "Удалить"
            button.addEventListener('click', function () {
                // Вызываем функцию удаления товара из корзины
                deleteItemFromCart(foodId);
                // После удаления обновляем отображение корзины
                loadCartItems();
                // Обновляем общую сумму
                updateTotalPrice();
            });

            // Добавляем товар в контейнер продуктов
            productsContainer.appendChild(foodElement);
        });
    }

    // Функция удаления товара из корзины
    function deleteItemFromCart(foodId) {
        let cart = JSON.parse(localStorage.getItem('cart')) || {};
        delete cart[foodId];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBtnClass();
    }

    // Функция обновления общей суммы
    function updateTotalPrice() {
        let cart = JSON.parse(localStorage.getItem('cart')) || {};
        let totalPrice = 0;

        Object.values(cart).forEach(itemHtml => {
            let tempElement = document.createElement('div');
            tempElement.innerHTML = itemHtml;
            let price = parseFloat(tempElement.querySelector('.price').value);
            let quantity = parseInt(tempElement.querySelector('.coll').value);
            totalPrice += price * quantity;
        });

        if (totalPrice == 0) {
            document.querySelector('.all-price p').textContent = `Корзина пуста!`;
        } else {
            document.querySelector('.all-price p').textContent = `Общая сумма: ${totalPrice} сом`;
        }
    }

    // Обновляем отображение корзины при загрузке страницы
    loadCartItems();
    updateTotalPrice();
});





/////////////////// *** Фунция корзины localstorage из главной страницы*** ////////////////////
function saveUserIdToLocal() {
    const userId = document.querySelector(".user_id_raitingk").textContent.trim();
    localStorage.setItem("rating_user_id", userId);
}

function toggleCart(button, foodId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    let foodElement = document.getElementById(foodId);
    let foodUserName = foodElement.querySelector('.user-name').textContent.trim(); // Получаем имя пользователя



    // Проверяем, есть ли товар уже в корзине
    if (cart[foodId]) {
        delete cart[foodId];
        button.classList.remove('yellow');
        button.style.backgroundColor = ''; // Сбрасываем цвет на дефолтный
        // button.textContent = 'В Корзину';
    } else {
        // Проверяем, есть ли другие товары в корзине
        let otherUserInCart = Object.values(cart).some(item => {
            let tempElement = document.createElement('div');
            tempElement.innerHTML = item;
            let cartUserName = tempElement.querySelector('.user-name').textContent.trim();
            return cartUserName !== foodUserName; // Сравниваем имена пользователей
        });
        saveUserIdToLocal();

        if (otherUserInCart) {
            showErrorModal("Вы можете заказывать товары только у одного магазина одновременно.", "Предупреждение");
            return; // Прекращаем выполнение функции
        } else {
            console.log("////")
        }

        cart[foodId] = foodElement.outerHTML;
        button.classList.add('yellow');
        addBankLinksToLocalStorage() // Обновляем ссылки Банков на странице
        // button.style.backgroundColor = '#ffae00;'; // Устанавливаем желтый цвет
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartBtnClass();
}

function updateCartDisplay() {
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    let productsContainer = document.querySelector('.cart-products');
    let totalPrice = 0;

    productsContainer.innerHTML = ''; // Очищаем контейнер перед обновлением

    Object.values(cart).forEach(itemHtml => {
        let tempElement = document.createElement('div');
        tempElement.innerHTML = itemHtml;
        let price = parseFloat(tempElement.querySelector('.price').value);
        let quantity = parseInt(tempElement.querySelector('.coll').value);
        totalPrice += price * quantity;
        productsContainer.appendChild(tempElement.firstElementChild);
    });

    if (totalPrice == 0) {
        document.querySelector('.all-price p').textContent = `Корзина пуста!`;
    } else {
        document.querySelector('.all-price p').textContent = `Общая сумма: ${totalPrice} сом`;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    var buttons = document.querySelectorAll(".button.box");

    let cart = JSON.parse(localStorage.getItem('cart')) || {};

    buttons.forEach(function (button) {
        var foodId = button.getAttribute("data-food-id");

        if (cart[foodId]) {
            button.classList.add('yellow');
            // button.textContent = 'Отмена';
        }

        button.addEventListener("click", function () {
            toggleCart(button, foodId);
        });
    });

    // Обновляем отображение корзины при загрузке страницы
    updateCartDisplay();
});









///////...... Функции связанные с корзиной плюс....../////////

document.addEventListener("DOMContentLoaded", function () {
    let priceInputs = document.querySelectorAll('.price'); // Получаем все элементы с классом 'price'
    priceInputs.forEach(function (priceInput) {
        updateWidth(priceInput); // Обновляем ширину для каждого элемента при загрузке страницы
        priceInput.addEventListener('input', function () {
            updateWidth(this); // Обновляем ширину при изменении значения
        });
    });
});

function updateWidth(element) {
    let value = parseInt(element.value);
    let valueLength = value.toString().length;
    let widthPercentage = Math.min(5 + (valueLength - 1) * 5, 25); // Ограничиваем ширину до максимального значения 25%
    element.style.width = widthPercentage + '%';
}



///////...... Делегированный обработчик для всех кнопок + и - товаров....../////////

document.addEventListener("DOMContentLoaded", function () {
    // Делегированный обработчик для всех кнопок + и -
    document.addEventListener("click", function (event) {
        const target = event.target;

        if (target.classList.contains('plus') || target.classList.contains('minus')) {
            const foodElement = target.closest('.food, .cart-item'); // карточка еды или элемент корзины
            if (!foodElement) return;

            const foodId = foodElement.id;
            const input = foodElement.querySelector('.coll');
            if (!input) return;

            let currentValue = parseInt(input.value) || 1;

            if (target.classList.contains('plus')) {
                currentValue++;
                console.log(`➕ Нажата кнопка ПЛЮС для: ${foodId}, новое количество: ${currentValue}`);
            } else if (target.classList.contains('minus') && currentValue > 1) {
                currentValue--;
                console.log(`➖ Нажата кнопка МИНУС для: ${foodId}, новое количество: ${currentValue}`);
            }

            input.value = currentValue;
            input.setAttribute('value', currentValue);

            // Обновляем локалсторадж и корзину
            updateQuantity(foodId, currentValue);
            console.log(`🛒 [КОРЗИНА] Обновлено количество для ID=${foodId}`);
        }
    });

    // Обработчик ручного ввода
    document.querySelectorAll('.coll.input-disabled').forEach(input => {
        input.addEventListener('change', () => {
            const foodElement = input.closest('.food, .cart-item');
            if (!foodElement) return;

            const foodId = foodElement.id;
            let val = parseInt(input.value) || 1;

            input.value = val;
            input.setAttribute('value', val);

            console.log(`📝 Введено вручную для: ${foodId}, новое количество: ${val}`);
            updateQuantity(foodId, val);
        });
    });
});





//.... Функция обновления количества товара в localStorage....//////

function updateQuantity(foodId, newQuantity = null) {
    console.log("🟢 Обновляем количество для ID:", foodId, "newQuantity:", newQuantity);

    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const foodElement = document.getElementById(foodId);

    if (!foodElement) {
        console.warn("⚠️ Элемент с ID не найден:", foodId);
        return;
    }

    const input = foodElement.querySelector('.coll');
    if (!input) {
        console.warn("⚠️ Не найден input.coll у товара", foodId);
        return;
    }

    const quantity = (newQuantity !== null) ? parseInt(newQuantity, 10) : parseInt(input.value, 10);
    if (isNaN(quantity) || quantity < 0) {
        console.warn("⚠️ Некорректное значение quantity:", quantity);
        return;
    }

    console.log("📦 Будем записывать количество:", quantity);

    if (cart[foodId]) {
        const temp = document.createElement('div');
        temp.innerHTML = cart[foodId];

        const storedInput = temp.querySelector('.coll');
        if (storedInput) {
            storedInput.value = quantity;
            storedInput.setAttribute('value', quantity);
            console.log("✏️ В localStorage установлено value:", storedInput.value);
        }

        cart[foodId] = temp.innerHTML;
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log("💾 localStorage обновлён для ID:", foodId, "qty:", quantity);

        if (typeof updateCartDisplay === "function") updateCartDisplay();
    } else {
        console.log("❌ Товара с таким ID нет в корзине:", foodId);
    }
}



///////////////////////// *** Отправка заказа на сервер *** ///////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
    var createOrderButton = document.getElementById('create-order');

    createOrderButton.addEventListener('click', function () {
        createOrder();
    });

    function createOrder() {
        let cart = JSON.parse(localStorage.getItem('cart')) || {};
        let orderItems = [];
        Object.keys(cart).forEach(function (foodId) {
            var foodHTML = cart[foodId];
            var foodElement = document.createElement('div');
            foodElement.innerHTML = foodHTML.trim();
            var quantity = parseInt(foodElement.querySelector('.coll').value);
            orderItems.push({
                foodId: foodId,
                quantity: quantity
            });
        });

        // Получаем значения из формы
        let userName = document.querySelector('#user-name').value;
        let phoneNumber = document.querySelector('#phone-number').value;
        let address = document.querySelector('#address').value;
        let deliveryMethod = document.getElementById('delivery').value;
        let paymentMethod = document.getElementById('payment').value;
        let imageUpload = document.getElementById('image-upload');
        let orderCity = localStorage.getItem('selectedCity')
        const carts = localStorage.getItem('cart');

        // Проверка условий перед отправкой
        if (!carts || carts === '{}') {
            showErrorModal("Корзина пуста, выберите один или несколько товаров", "Ошибка");
            return;
        }

        if (userName == '' || userName.length <= 2 || userName.length >= 30) {
            showErrorModal("Ваше имя введен не коррекно.", "Предупреждение");
            return;
        }

        if (phoneNumber === '' || phoneNumber.length <= 8) {
            showErrorModal("Телефонный номер введен не коррекно.", "Предупреждение");
            return;
        }

        if (deliveryMethod === '') {
            showErrorModal("Выберите способ получения товара.", "Предупреждение");
            return;
        }

        if (deliveryMethod === 'Доставка' && !address) {
            showErrorModal("Пожалуйста, введите адрес для доставки курьером.", "Предупреждение");
            return;
        }

        if (deliveryMethod === 'Самовывоз') {
            address = 'Самовывоз';  // Устанавливаем "Самовывоз" в качестве адреса
            console.log("LLLLLLLLLLLL " + paymentMethod)
        }

        if (paymentMethod === '') {
            showErrorModal("Пожалуйста, выберите способ оплаты.", "Предупреждение");
            return;
        }

        if (paymentMethod === 'Онлайн' && imageUpload.files.length === 0) {
            showErrorModal("Пожалуйста, загрузите чек для онлайн оплаты.", "Предупреждение");
            return;
        }
        showOrderPreloader()

        // Генерация номера заказа
        var dataNow = new Date()
        var orderNumber = 'NUM-' + getRandomInt(100000000, 999999999);
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min);
        }
        var orderData = {
            orderNumber: orderNumber,
            orderItems: orderItems,
            phoneNumber: phoneNumber,
            address: address,
            deliveryMethod: deliveryMethod,
            paymentMethod: paymentMethod,
            userName: userName,
            orderCity: orderCity
        };

        // Отправка заказа на сервер
        sendOrderToServer(orderData);
    }

    function sendOrderToServer(orderData) {
        const csrfToken = getCookie('csrftoken');
        console.log('CSRF Token:', csrfToken);

        // Проверка наличия CSRF токена
        if (!csrfToken) {
            alert('CSRF токен отсутствует!');
            return;
        }

        // Создаем объект FormData
        let formData = new FormData();

        // Добавляем текстовые данные в FormData
        formData.append('userName', orderData.userName);
        formData.append('orderNumber', orderData.orderNumber);
        formData.append('phoneNumber', orderData.phoneNumber);
        formData.append('address', orderData.address);
        formData.append('deliveryMethod', orderData.deliveryMethod);
        formData.append('paymentMethod', orderData.paymentMethod);
        formData.append('orderCity', orderData.orderCity);

        // Добавляем данные с элементами заказа
        formData.append('orderItems', JSON.stringify(orderData.orderItems));

        // Добавляем файл, если он есть
        let imageUpload = document.getElementById('image-upload');
        if (imageUpload.files.length > 0) {
            formData.append('orderBankCheck', imageUpload.files[0]);
        }

        console.log('Отправляемые данные:', formData);

        // Отправка запроса
        fetch('/create-order/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,  // CSRF токен обязателен
            },
            body: formData  // отправляем FormData, а не JSON
        })
            .then(response => {
                return response.text().then(text => {
                    if (!response.ok) {
                        console.error(`HTTP error! status: ${response.status}, body: ${text}`);
                        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
                    }
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error('Ошибка при парсинге ответа сервера:', e);
                        throw new Error('Failed to parse JSON response');
                    }
                });
            })
            .then(data => {
                hideOrderPreloader(); // 🔥 Сразу скрываем прелоадер

                if (data.success) {
                    openModal();
                    localStorage.removeItem('cart');
                } else {
                    // Показываем конкретную ошибку от сервера
                    const errorText = data.error || "Ошибка при создании заказа.";
                    showErrorModal(errorText, "Предупреждение");
                    console.log('Ошибка сервера:', data);
                }
            })
            .catch(error => {
                hideOrderPreloader(); // 🔥 И при ошибке запроса тоже
                console.error('Ошибка при отправке данных:', error);
                showErrorModal(error.message, "Ошибка при отправке данных");
            });
    }

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
        console.log('Cookie:', name, cookieValue);
        return cookieValue;
    }
});




///////////////////////// *** Изображения вместо фона ЧЕК *** ///////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById('image-upload');
    const viewBtn = document.getElementById('view-image-btn');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeBtn = document.querySelector('.close-image');
    const fileLabel = document.querySelector('.file-label');

    let uploadedImageData = null; // Base64 изображения

    imageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                uploadedImageData = e.target.result;
                viewBtn.style.display = 'flex'; // показать иконку
            };
            reader.readAsDataURL(file);
            fileLabel.textContent = 'Чек оплаты загружен ✓';
            fileLabel.style.background = '#26ad3c';
            fileLabel.style.color = '#ffffffff';
        }
    });

    viewBtn.addEventListener('click', function () {
        if (uploadedImageData) {
            modalImg.src = uploadedImageData;
            modal.style.display = 'flex';
        }
    });

    closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});




//********************функция для добавления класса active к нажатой кнопке и удаления его с других кнопок: */

document.querySelectorAll('.category-institution-slider .buttons button').forEach(button => {
    button.addEventListener('click', () => {
        // Удаляем класс 'active' со всех кнопок
        document.querySelectorAll('.category-institution-slider .buttons button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Добавляем класс 'active' к нажатой кнопке
        button.classList.add('active');
    });
});


//////--------- Фнкция для отображения категорий товаров --------//////

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.category-button');
    const foods = document.querySelectorAll('.food');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.getAttribute('data-id');

            // Удаляем класс "active" у всех кнопок и добавляем к текущей
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');


            // Показываем или скрываем блюда
            foods.forEach(food => {
                if (categoryId === 'all' || food.getAttribute('data-category') === categoryId) {
                    food.style.display = 'flex';
                    scrollY()
                } else {
                    food.style.display = 'none';
                }
            });
        });
    });
});



// Функция получения адреса по координатам
function getAddressFromCoordinates(latitude, longitude) {
    const apiKey = "c65cccec-a214-41b7-affc-24511bd3fcb1";
    const url = `https://catalog.api.2gis.com/3.0/items?q=${latitude},${longitude}&fields=items.full_address&key=${apiKey}`;

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("Ответ API:", data); // Для отладки
            if (data.result && data.result.items.length > 0) {
                // Извлечение `full_name` из первого объекта
                const address = data.result.items[0].full_name || "Адрес не найден.";
                console.log(`Ваш адрес: ${address}`);
                document.getElementById("address").value = address;
            } else {
                console.error("Не удалось получить адрес");
                document.getElementById("address-output").innerText = "Адрес не найден.";
            }
        })
        .catch((error) => {
            console.error("Ошибка при запросе API 2ГИС:", error);
            document.getElementById("address-output").innerText = "Ошибка получения адреса.";
        });
}


// Функция получения координат
function getGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                console.log(`Ваши координаты: ${latitude}, ${longitude}`);
                // Вызов функции для получения адреса
                getAddressFromCoordinates(latitude, longitude);
            },
            (error) => {
                console.error("Ошибка при получении геолокации:", error);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert("Геолокация отключена. Включите её в настройках браузера.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Информация о местоположении недоступна.");
                        break;
                    case error.TIMEOUT:
                        alert("Время ожидания истекло.");
                        break;
                    default:
                        alert("Произошла неизвестная ошибка.");
                }
            }
        );
    } else {
        alert("Ваш браузер не поддерживает геолокацию.");
    }
}


const getAdressBtn = document.querySelector('#get-address-btn')
// Назначаем обработчик клика на кнопку
getAdressBtn.addEventListener("click", (event) => {
    console.log('NOOOOOOOOOOOOOOOOOOOOOOOOO')
    event.preventDefault(); // Предотвращаем отправку формы
    getGeolocation();
});


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



//////..........Имитация динамического поиска........////////

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const foods = document.querySelectorAll(".food");

    if (!searchInput) return;

    searchInput.addEventListener("input", function () {
        const searchTerm = this.value.trim().toLowerCase();

        foods.forEach(food => {
            const foodName = food.querySelector(".food_name").textContent.toLowerCase();

            // Проверяем совпадения
            if (foodName.includes(searchTerm)) {
                food.style.display = "flex";
                food.classList.remove("no-match");
                scrollY()
            } else {
                food.style.display = "none";
                food.classList.add("no-match");
            }
        });

        // Если ничего не найдено — показать сообщение
        const anyVisible = Array.from(foods).some(f => f.style.display === "flex");
        let notFoundMsg = document.querySelector(".not-found");

        if (!anyVisible) {
            if (!notFoundMsg) {
                notFoundMsg = document.createElement("p");
                notFoundMsg.className = "not-found";
                notFoundMsg.textContent = "Ничего не найдено 😢";
                notFoundMsg.style.cssText = `
                    text-align: center;
                    margin-top: 20px;
                    font-size: 18px;
                    color: #999;
                `;
                searchInput.insertAdjacentElement("afterend", notFoundMsg);
            }
        } else if (notFoundMsg) {
            notFoundMsg.remove();
        }
    });
});


//////.......который добавляет класс .search__container-deactive при скролле вниз.....////

document.addEventListener("DOMContentLoaded", () => {
    const searchContainer = document.querySelector(".search__container");
    const searchInput = document.getElementById("searchInput");
    if (!searchContainer) return;

    let lastScrollTop = 0; // предыдущее положение скролла

    window.addEventListener("scroll", () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll > lastScrollTop && currentScroll > 20) {
            // скроллим вниз
            if (searchInput.value == '') {
                searchContainer.classList.add("search__container-deactive");
            }
        } else {
            // скроллим вверх
            searchContainer.classList.remove("search__container-deactive");
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // защита от отрицательных значений
    }, { passive: true });
});



/////-------Функ для имзменеия имени пользователя------//////
document.addEventListener("DOMContentLoaded", () => {
    const renameBtn = document.querySelector(".rename_user-btn");
    const renameForm = document.querySelector(".rename_form");
    const nameInfo = document.querySelector(".user_name-info");
    const saveBtn = document.querySelector(".rename_user-save");
    const input = document.querySelector(".rename_input");

    function closeRenameForm() {
        nameInfo.style.display = "block";
        renameBtn.style.display = "block";
        renameForm.style.display = "none";
    }

    renameBtn.addEventListener("click", () => {
        nameInfo.style.display = "none";
        renameBtn.style.display = "none";
        renameForm.style.display = "flex";
        input.focus();
    });

    renameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newName = input.value.trim();

        if (!newName) return;

        try {
            const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

            const response = await fetch("/update-username/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({ username: newName }),
            });

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            if (data.success) {
                nameInfo.textContent = newName;
            } else {
                alert("Не удалось обновить имя. Попробуйте позже.");
            }
        } catch (error) {
            console.error(error);
            alert("Не удалось обновить имя. Попробуйте позже.");
        }

        closeRenameForm();
    });

    // Закрытие при клике вне блока
    document.addEventListener("click", (e) => {
        const isClickInside = renameForm.contains(e.target) || renameBtn.contains(e.target);

        // Если форма открыта и кликнули вне неё — закрыть
        if (renameForm.style.display === "flex" && !isClickInside) {
            closeRenameForm();
        }
    });
});




/////-------Функ для изменения фото пользователя------//////
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.querySelector(".edit_input");
    const avatarImg = document.querySelector(".user-avatar");

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;

        // Показываем локальное превью сразу
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarImg.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Отправляем файл на сервер через fetch()
        const formData = new FormData();
        formData.append("avatar", file);

        fetch("/update-avatar/", {
            method: "POST",
            body: formData,
            headers: {
                "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.avatar_url) {
                    // Обновляем аватар с новым URL, добавляя временный параметр чтобы сбросить кеш
                    avatarImg.src = data.avatar_url + "?t=" + new Date().getTime();
                } else {
                    alert("Не удалось обновить аватар. Попробуйте позже.");
                }
            })
            .catch(() => alert("Не удалось обновить аватар. Попробуйте позже."));
    });
});






