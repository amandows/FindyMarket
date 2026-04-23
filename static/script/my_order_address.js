document.addEventListener("DOMContentLoaded", function () {
    const destinationBtn = document.querySelector('.ok_destination')
    const destinationText = document.querySelector('.destination_text')
    const locationMarker = document.querySelector('.start_marker')
    const apiKey = "a58ba029-221e-4c0b-91b5-91296ba6286f";
    let defaultCenter = [72.746835, 41.654299]; // fallback если геолокация не даст данные
    const okDestinationBtn = document.querySelector('.ok_destination');
    const destinationTextElement = document.querySelector('.destination_text');
    const destinationLatInput = document.querySelector('.destination_lat');
    const destinationLonInput = document.querySelector('.destination_lon');


    const getAdressBtn = document.querySelector('#get-address-btn');
    let map = null; // Глобальная переменная для карты
    let directions = null;

    getAdressBtn.addEventListener("click", (event) => {
        event.preventDefault();

        // 1. Сначала показываем контейнер
        const container = document.querySelector(".my_order_address");
        // container.style.display = "block"; // Используйте block или flex вместо fixed в стиле
        container.style.cssText = "display: fixed;"; // Если нужно именно фиксированное позиционирование
        // container.style.zIndex = "1000";

        // 2. Инициализируем карту, если она еще не создана
        if (!map) {
            initMap();
        } else {
            // Если карта уже была создана, обновляем её размер, так как контейнер стал видимым
            map.invalidateSize();
        }

        // 3. Запрашиваем GPS (ваша нативная функция)
        requestGpsCheck();
    });

    function initMap() {
        // Создаем карту
        map = new mapgl.Map('map_container', {
            key: apiKey,
            center: defaultCenter,
            style: 'cf079934-7e60-4cfe-ba4f-b7c8116baeb6',
            zoom: 18,
        });

        directions = new mapgl.Directions(map, {
            directionsApiKey: apiKey,
        });

        // Пытаемся получить геолокацию
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    map.setCenter([userLng, userLat]);
                    // Сразу получаем адрес для текущей точки
                    getFullName(userLat, userLng);
                },
                (error) => console.warn("Геолокация отключена"),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }

        // Навешиваем события
        map.on('move', () => {
            const destinationText = document.querySelector('.destination_text');
            destinationText.style.animation = 'pulseText 1.2s ease-in-out infinite';
            destinationText.textContent = 'Подождите пожалуйста...';
            const destinationBtn = document.querySelector('#destination-btn'); // Убедитесь в ID кнопки
            if (destinationBtn) {
                destinationBtn.disabled = true;
                destinationBtn.textContent = "Подождите...";
            }
        });

        let debounceTimer;
        map.on('moveend', () => {
            const center = map.getCenter();
            const latitude = center[1].toFixed(8);
            const longitude = center[0].toFixed(8);

            document.querySelector('.destination_lat').value = latitude;
            document.querySelector('.destination_lon').value = longitude;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                getFullName(latitude, longitude);
            }, 500);
        });
    }

    function getCenter(lon, lat, zoom) {
        const center = [lon, lat];
        map.setCenter(center);
        map.setZoom(zoom);
    }


    // Функция для получения полного адреса
    function getFullName(lat, lon) {
        const resultName = document.querySelector('.destination_text')
        const geocoderUrl = `https://catalog.api.2gis.com/3.0/items?q=${lat},${lon}&fields=items.full_address&key=${apiKey}`;
        fetch(geocoderUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ошибка: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("Ответ API:", data); // Для отладки
                destinationBtn.disabled = false;
                destinationBtn.textContent = "Готово";
                if (data.result && data.result.items.length > 0) {
                    // Извлечение full_name из первого объекта
                    const address = data.result.items[0].full_name || "Адрес не найден.";
                    console.log(`Адрес центра карты: ${address}`);
                    locationMarker.classList.add('marker_animate')
                    resultName.textContent = address;
                    destinationText.style.cssText = 'animation: none;';
                } else {
                    console.log("Адрес не найден.");
                }
            })
            .catch((error) => {
                console.error("Ошибка при получении адреса:", error);
            });
    }


    // Назначаем обработчик клика
    okDestinationBtn.addEventListener('click', () => {
        // 1. Берем значения из инпутов, которые мы записали ранее
        const address = destinationTextElement.textContent;
        const latValue = destinationLatInput.value; // здесь лежит широта
        const lonValue = destinationLonInput.value; // здесь лежит долгота

        // Проверка на готовность данных
        if (!latValue || !lonValue || address === 'Подождите пожалуйста...') {
            console.warn("Координаты еще не определены");
            return;
        }

        // 2. Формируем объект
        const pointB = {
            address: address,
            lat: parseFloat(latValue), // Используем latValue, так как мы его объявили выше
            lon: parseFloat(lonValue),
            timestamp: new Date().getTime()
        };

        // 3. Сохраняем
        localStorage.setItem('point_b_order', JSON.stringify(pointB));

        console.log("Точка Б сохранена:", pointB);

        // 4. Закрываем карту
        document.querySelector(".my_order_address").style.display = "none";
        document.querySelector("#address").value = address
        closeMapModal()
    });

    // Функция для закрытия модального окна карты
    function closeMapModal() {
        const mapContainer = document.querySelector(".my_order_address");
        mapContainer.style.display = "none";

        // Также обновляем текст на главном экране, если там есть превью адреса
        const mainPageDestText = document.querySelector("#main-destination-preview");
        if (mainPageDestText) {
            mainPageDestText.innerText = destinationTextElement.textContent;
        }
    }


    function requestGpsCheck() {
        console.log("CHECK_GPS");
    }

    const addressInput = document.querySelector('#address');
    const searchAddressContainer = document.querySelector('.search_address_container');
    let debounceTimer;

    const city = "Кара-Куль";

    // 1. Поиск через API
    async function fetchStreets(query) {
        const url = `https://catalog.api.2gis.com/3.0/items/geocode?q=${encodeURIComponent(city)}, ${encodeURIComponent(query)}&fields=items.full_address,items.point&key=${apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Ошибка API");
            const data = await response.json();
            return data.result.items || [];
        } catch (error) {
            console.error("Ошибка при поиске:", error);
            return [];
        }
    }

    // 2. Обновление списка результатов
    async function updateAddressList(query) {
        if (query.length < 4) {
            searchAddressContainer.innerHTML = "<p style='padding:10px;'>Введите минимум 4 символа</p>";
            return;
        }

        searchAddressContainer.innerHTML = "<p style='padding:10px;'>Поиск...</p>";
        const streets = await fetchStreets(query);

        if (streets.length === 0) {
            searchAddressContainer.innerHTML = "<p style='padding:10px;'>Ничего не найдено</p>";
            return;
        }

        searchAddressContainer.innerHTML = streets.map((street) => `
        <button class="street-item" 
            data-lat="${street.point?.lat || ''}" 
            data-lon="${street.point?.lon || ''}" 
            data-full-address="${street.full_name}">
            <div class="location_icon">
                <img src="/static/icons/location.png" alt="">
            </div>
            <div class="text">
                <p>${street.full_name}</p>
            </div>
        </button>
    `).join("");

        // Добавляем клик на каждый элемент списка
        document.querySelectorAll(".street-item").forEach((item) => {
            item.addEventListener("click", () => {
                const lat = Number(item.dataset.lat);
                const lon = Number(item.dataset.lon);
                const fullAddress = item.dataset.fullAddress;

                // Сохраняем данные (Точка Б)
                localStorage.setItem("point_b_order", JSON.stringify({
                    address: fullAddress,
                    lon: lon,
                    lat: lat,
                    timestamp: new Date().getTime()
                }));

                // Обновляем UI
                addressInput.value = fullAddress;

                // Активируем кнопку "Готово"
                if (okDestinationBtn) {
                    okDestinationBtn.disabled = false;
                    okDestinationBtn.style.opacity = "1";
                }

                // Центрируем карту
                if (typeof map !== 'undefined' && map !== null) {
                    map.setCenter([lon, lat]);
                    map.setZoom(18);
                }

                // Закрываем список
                searchAddressContainer.classList.remove('active');
                searchAddressContainer.innerHTML = "";
            });
        });
    }

    // 3. Обработчик ввода
    function handleAddressInput(event) {
        clearTimeout(debounceTimer);
        const query = event.target.value.trim();

        if (query === "Ваш адрес" || query === "") {
            searchAddressContainer.innerHTML = "";
            return;
        }

        debounceTimer = setTimeout(async () => {
            await updateAddressList(query);
        }, 800);
    }

    // --- СОБЫТИЯ ИНПУТА ---

    // Фокус: убираем заглушку и показываем контейнер
    addressInput.addEventListener("focus", (e) => {
        if (e.target.value === "Ваш адрес") {
            e.target.value = "";
        }
        searchAddressContainer.style.cssText = "display: flex;"
    });

    // Ввод текста
    addressInput.addEventListener("input", handleAddressInput);

    // Потеря фокуса: скрываем с задержкой, чтобы успел сработать клик по списку
    addressInput.addEventListener("blur", () => {
        setTimeout(() => {
            searchAddressContainer.style.cssText = "display: none;"
        }, 250);
    });
});


