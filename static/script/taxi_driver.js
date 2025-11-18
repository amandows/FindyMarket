const apiKey = "0d58621a-008f-467e-a9c3-3f27f7cd186e";
let defaultCenter = [72.746835, 41.654299]; // fallback если геолокация не даст данные
let userMarker = null;


document.addEventListener("DOMContentLoaded", function () {

    const map = new mapgl.Map('map_container', {
        key: apiKey,
        center: defaultCenter,
        style: 'cf079934-7e60-4cfe-ba4f-b7c8116baeb6',
        zoom: 18,
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                console.log("Ваши координаты:", userLat, userLng);

                // map.setCenter([userLng, userLat]); // ВАЖНО: сначала lng потом lat!
                getCenter(userLng, userLat, 18);
            },
            function (error) {
                console.warn("Геолокация отключена, используем координаты по умолчанию");
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.warn("Браузер не поддерживает геолокацию");
    }

    function getCenter(lon, lat, zoom) {
        const center = [lon, lat];
        map.setCenter(center);
        map.setZoom(zoom);
        // Удаляем старый маркер, если есть
        if (userMarker) {
            userMarker.destroy();
        }

        // Создаём новый маркер
        userMarker = new mapgl.HtmlMarker(map, {
            coordinates: [lon, lat],
            html: `<div class="user_marker">
                        <div class="content">
                            <div class="img_container">
                                <img src="/static/icons/navigation.svg" alt="">
                            </div>
                        </div>
                    </div>`,
            anchor: [0.5, 1] // Центрирование метки
        });
    }




    // --- Добавляем обработчик на кнопку мое местоположение---
    document.querySelector(".my_location").addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Ваш браузер не поддерживает геолокацию.");
            return;
        }

        const btn = document.querySelector(".my_location");
        btn.classList.add("loading");
        btn.querySelector("p").textContent = "Определяем...";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Центрируем карту
                getCenter(lon, lat, 18);

                btn.classList.remove("loading");
                btn.querySelector("p").textContent = "Обновить мое местоположение";
            },
            (error) => {
                console.error(error);
                alert("Не удалось определить местоположение.");
                btn.classList.remove("loading");
                btn.querySelector("p").textContent = "Ошибка геолокации";
            }
        );
    });
});








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



// простой переключатель состояния
const btn = document.getElementById("goBtn");
btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    btn.querySelector(".label").textContent =
        btn.classList.contains("active") ? "Ищем заказ..." : "На линию";
});
