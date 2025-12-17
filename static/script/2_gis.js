window.addEventListener("load", function () {
    document.getElementById("preloader").style.display = "none";
});
document.addEventListener("DOMContentLoaded", function () {
    const endPointBtn = document.querySelector(".end_point_btn");
    const locationPoints = document.querySelector(".location_points");
    const logoContainer = document.querySelector(".logo_container");
    const geoLocationA = document.querySelector('.geolocation_a')
    const sliderBtn = document.querySelector('.slider_btn')
    const endPoint = document.querySelector(".end_point");
    const orderTaxi = document.querySelector(".order_taxi");
    const myLocationBtn = document.querySelector('.my_location_btn')
    const minHeight = 40; // Минимальная высота в процентах
    const maxHeight = 75; // Максимальная высота в процентах
    const thresholdHeight = 60; // Порог высоты для переключения
    const viewMapBtn1 = document.querySelector('.map_1');
    const viewMapBtn2 = document.querySelector('.map_2');
    const destination = document.querySelector('.destination')
    const destinationBtn = document.querySelector('.ok_destination')
    const destinationText = document.querySelector('.destination_text')
    const inputA = document.querySelector(".search_location1");
    const inputB = document.querySelector(".search_location2");
    const locationMarker = document.querySelector('.start_marker')
    const startMarkerImg = document.querySelector('.start_marker_img')
    const finishMarkerImg = document.querySelector('.finish_marker_img')
    const startTextContent = document.querySelector('.start_text_content')
    const startPrice = document.querySelector('.start_price')
    const destinationLat = document.querySelector('.destination_lat')
    const destinationLon = document.querySelector('.destination_lon')
    const destinationPoint = document.querySelector('.destination_point')
    const taxiGo = document.querySelector('.taxi_go')
    const locationOneGo = document.querySelector('.location_one_go')
    const locationTwoGo = document.querySelector('.location_two_go')
    const backBtn = document.querySelector('.back_btn')
    const backBtn2 = document.querySelector('.back_btn2')
    const apiKey = "a369efd1-1b1d-432f-8eb4-99b5fea78699";
    const econom = document.getElementById('price_econom')
    const comfort = document.getElementById('price_comfort')
    const comfortPlus = document.getElementById('price_comfort_plus')
    const bussiness = document.getElementById('price_bussiness')
    const scooter = document.getElementById('price_scooter')
    const oneTonn = document.getElementById('price_one_tonn')
    const twoTonn = document.getElementById('price_two_tonn')
    const distanceText = document.querySelector('.distance')
    const durationText = document.querySelector('.duration')
    const searchLocation1animation = document.querySelector('.search_location1_animation')
    let defaultCenter = [72.746835, 41.654299]; // fallback если геолокация не даст данные
    let startMoveMarker = null; // Переменная для хранения текущего маркера
    let finishMoveMarker = null; // Переменная для хранения текущего маркера
    let searchWave = null;
    let taxiDrivers = null;
    let currentRoute = null;

    const taxiDriversCoor = [
        { "id": 1, "name": "Алексей", "latitude": 41.6312, "longitude": 72.6685 },
        { "id": 2, "name": "Дмитрий", "latitude": 41.6305, "longitude": 72.6690 },
        { "id": 3, "name": "Сергей", "latitude": 41.6298, "longitude": 72.6718 },
        { "id": 4, "name": "Иван", "latitude": 41.6303, "longitude": 72.6732 },
        { "id": 5, "name": "Владимир", "latitude": 41.6319, "longitude": 72.6740 },
        { "id": 6, "name": "Николай", "latitude": 41.6330, "longitude": 72.6727 },
        { "id": 7, "name": "Павел", "latitude": 41.63121534, "longitude": 72.6716521 }
    ];


    const taxiRates = {
        econom: {
            name: "Эконом",
            baseFare: 40, // Посадка в сомах
            perKm: 6.5,   // Стоимость за 1 км
        },
        comfort: {
            name: "Комфорт",
            baseFare: 50,
            perKm: 7.5,
        },
        comfort_plus: {
            name: "Комфорт+",
            baseFare: 60,
            perKm: 8.5,
        },
        business: {
            name: "Бизнес",
            baseFare: 75,
            perKm: 10,
        },
        scooter: {
            name: "Быстро",
            baseFare: 20, // Посадка в сомах
            perKm: 5.0,   // Стоимость за 1 км
        },
        oneTonn: {
            name: "До 1 тонн",
            baseFare: 50,
            perKm: 10.5,
        },
        twoTonn: {
            name: "До 2х тонн",
            baseFare: 150,
            perKm: 14,
        },
    };




    const map = new mapgl.Map('map_container', {
        key: apiKey,
        center: defaultCenter,
        style: 'cf079934-7e60-4cfe-ba4f-b7c8116baeb6',
        zoom: 18,
    });

    // Пытаемся получить реальную геолокацию
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                console.log("Ваши координаты:", userLat, userLng);

                map.setCenter([userLng, userLat]); // ВАЖНО: сначала lng потом lat!
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

    const directions = new mapgl.Directions(map, {
        directionsApiKey: apiKey,
    });

    function getCenter(lon, lat, zoom) {
        const center = [lon, lat];
        map.setCenter(center);
        map.setZoom(zoom);
    }

    function calculateFare(category, distance, duration) {
        if (taxiRates[category]) {
            const { baseFare, perKm, name } = taxiRates[category];
            const totalFare = (baseFare + (perKm * distance) + ((perKm / 2) * duration)) * 1.6;
            return `${totalFare.toFixed(0)} сом`;
        } else {
            return "Категория не найдена";
        }
    }


    function getDirections(firstPoint, secondPoint) {
        const pointA = JSON.parse(localStorage.getItem('point_a'));
        const pointB = JSON.parse(localStorage.getItem('point_b'));

        if (pointA && pointB) {
            firstPoint = [pointA.lon, pointA.lat]; // Координаты первой точки
            secondPoint = [pointB.lon, pointB.lat]; // Координаты второй точки

            // Построение маршрута
            // getCenter(pointB.lon, pointB.lat)
            directions.carRoute({
                points: [firstPoint, secondPoint],
                transport: "driving",
                filters: ["dirt_road", "toll_road", "ferry"],
                output: "detailed"
            });
        } else {
            console.log("Не удалось получить координаты точек из localStorage.");
        }
    }

    function getDistance() {
        const pointA = JSON.parse(localStorage.getItem('point_a'));
        const pointB = JSON.parse(localStorage.getItem('point_b'));

        if (pointA && pointB) {
            const reqUrl = `https://routing.api.2gis.com/get_dist_matrix?key=${apiKey}&version=2.0`;

            // Формируем массив точек для запроса
            const points = [
                {
                    lat: pointA.lat,
                    lon: pointA.lon,
                },
                {
                    lat: pointB.lat,
                    lon: pointB.lon,
                },
            ];

            // Делаем POST-запрос для получения расстояния и времени
            fetch(reqUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    points,
                    sources: [0], // Первая точка - точка отправления
                    targets: [1], // Вторая точка - точка назначения
                    transport: 'driving', // Тип транспорта (авто)
                    start_time: new Date().toISOString(),
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data && data.routes && data.routes.length > 0) {
                        const routeInfo = data.routes[0];
                        const distance = (routeInfo.distance / 1000).toFixed(2); // Перевод в километры
                        const duration = Math.round(routeInfo.duration / 60); // Перевод в минуты

                        console.log(`Расстояние: ${distance} км`);
                        console.log(`Время в пути: ${duration} мин`);
                        localStorage.setItem("order_distance", distance);
                        localStorage.setItem("order_duration", duration);
                        console.log(calculateFare("econom", distance, duration) + 'cooooooom');
                        econom.textContent = calculateFare("econom", distance, duration);
                        comfort.textContent = calculateFare("comfort", distance, duration);
                        comfortPlus.textContent = calculateFare("comfort_plus", distance, duration)

                        scooter.textContent = calculateFare("scooter", distance, duration);
                        oneTonn.textContent = calculateFare("oneTonn", distance, duration);
                        twoTonn.textContent = calculateFare("twoTonn", distance, duration)


                        bussiness.textContent = calculateFare("business", distance, duration);
                        startTextContent.classList.add('active');
                        startPrice.textContent = calculateFare("econom", distance, duration);
                        distanceText.textContent = localStorage.getItem("order_distance");
                        durationText.textContent = localStorage.getItem("order_duration");
                    } else {
                        console.error('Не удалось получить данные о маршруте.');
                    }
                })
                .catch((err) => console.error('Ошибка запроса:', err));
        } else {
            console.error('Координаты точек A и B не найдены в localStorage.');
        }
    }


    function checkInputs() {
        // Проверяем, не пустые ли поля
        if (!inputA.value || !inputB.value) {
            console.log("Оба поля должны быть заполнены!");
            return;
        }

        // Получаем данные из localStorage
        const pointA = JSON.parse(localStorage.getItem('point_a'));
        const pointB = JSON.parse(localStorage.getItem('point_b'));

        // Проверяем, существуют ли данные и совпадают ли адреса
        if (pointA && pointB && pointA.full_address === inputA.value && pointB.full_address === inputB.value) {
            locationOneGo.value = inputA.value;
            locationTwoGo.value = inputB.value;
            taxiGo.style.cssText = 'display: flex;';
            orderTaxi.style.cssText = 'display: none;'
            locationMarker.style.cssText = 'display: none;'
            let firstPoint
            let secondPoint
            firstPoint = [pointA.lon, pointA.lat]; // Координаты первой точки
            secondPoint = [pointB.lon, pointB.lat]; // Координаты второй точки
            startMarkerHtml(pointA.lat, pointA.lon);
            finishMarkerHtml(pointB.lat, pointB.lon);
            getDirections(firstPoint, secondPoint)
            map.fitBounds(
                {
                    northEast: [pointA.lon, pointA.lat],
                    southWest: [pointB.lon, pointB.lat],
                },
                {
                    padding: { top: 60, left: 60, bottom: 230, right: 60 },
                },
            );
        } else {
            console.log("Адреса не совпадают!");
        }
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


    map.on('move', () => {
        destinationText.style.cssText = 'animation: pulseText 1.2s ease-in-out infinite;';
        destinationText.textContent = 'Подождите пожалуйста...'
        if (destinationPoint.value === 'a') {
            startTextContent.classList.remove('active');
            if (startMoveMarker) {
                startMoveMarker.destroy();
            } if (searchWave) {
                searchWave.destroy();
            } else {
                console.log('Не получилось удалить searchWave')
            }
        } else if (destinationPoint.value === 'b') {
            startTextContent.classList.remove('active');
            if (finishMoveMarker) {
                finishMoveMarker.destroy();
            } if (searchWave) {
                searchWave.destroy();
            } else {
                console.log('Не получилось удалить searchWave')
            }
        } else if (destinationPoint.value === 'amandows') {
            locationMarker.style.cssText = 'display: none;'
        }
    });

    // ********Событие при остановке карты*********//

    let debounceTimer; // Глобальный таймер для debounce

    map.on('moveend', () => {
        const center = map.getCenter(); // Получаем координаты центра карты
        const latitude = center[1].toFixed(8); // Широта
        const longitude = center[0].toFixed(8); // Долгота
        const destinationLat = document.querySelector('.destination_lat');
        const destinationLon = document.querySelector('.destination_lon');

        destinationLat.value = latitude;
        destinationLon.value = longitude;

        console.log(`Координаты центра: широта ${latitude}, долгота ${longitude}`);

        // Удаляем предыдущий таймер, если он существует
        clearTimeout(debounceTimer);



        if (destinationPoint.value === 'a') {
            localStorage.setItem("point_a", JSON.stringify({
                full_address: destinationText.textContent,
                lon: Number(destinationLon.value),
                lat: Number(destinationLat.value),
            }));
        } else if (destinationPoint.value === 'b') {
            localStorage.setItem("point_b", JSON.stringify({
                full_address: destinationText.textContent,
                lon: Number(destinationLon.value),
                lat: Number(destinationLat.value),
            }));
        } else {
            console.log("Не пытайся взломать");
            return;
        }

        // Устанавливаем новый таймер на 1 секунду
        debounceTimer = setTimeout(() => {
            getFullName(latitude, longitude);
            getDistance();
        }, 500);
    });


    ////*******  Маркеры MapGL ********/////////

    function startMarkerHtml(latitude, longitude) {
        if (startMoveMarker) {
            startMoveMarker.destroy();
        }
        startMoveMarker = new mapgl.HtmlMarker(map, {
            coordinates: [longitude, latitude],
            html: `<div class="start_marker_map">
                        <div class="content">
                            <div class="img_container">
                                <img src="/static/icons/passenger3.png" alt="">
                            </div>
                            <div class="line"></div>
                        </div>
                    </div>`,
            anchor: [0.5, 1] // Центрирование метки
        });
    }

    function finishMarkerHtml(latitude, longitude) {
        if (finishMoveMarker) {
            finishMoveMarker.destroy();
        }
        finishMoveMarker = new mapgl.HtmlMarker(map, {
            coordinates: [longitude, latitude],
            html: `<div class="finish_marker_map">
                        <div class="content">
                            <div class="img_container">
                                <img src="/static/icons/finish.png" alt="">
                            </div>
                            <div class="line"></div>
                        </div>
                    </div>`,
            anchor: [0.5, 1] // Центрирование метки
        });
    }

    function searchWaveMArker(latitude, longitude) {
        if (searchWave) {
            searchWave.destroy();
        }
        searchWave = new mapgl.HtmlMarker(map, {
            coordinates: [longitude, latitude],
            html: `<div class="search-wave"></div>`,
            anchor: [0.5, 1] // Центрирование метки
        });
    }

    function taxiDriverMarker(latitude, longitude, rotation) {
        new mapgl.HtmlMarker(map, {
            coordinates: [longitude, latitude],
            html: `<div class="taxi_drivers" >
                        <img src="/static/icons/pngwing.png" alt=" "style="transform: rotate(${rotation}deg);">
                    </div>`,
            anchor: [0.5, 0.5] // Центрирование метки
        });
    }

    function placeTaxiDriversMarkers() {
        let rotations = [0, 90, 180, 270]; // Возможные углы поворота
        taxiDriversCoor.forEach((driver, index) => {
            let rotation = rotations[index % rotations.length]; // Берем угол по циклу
            taxiDriverMarker(driver.latitude, driver.longitude, rotation);
        });
    }

    const city = "Кара-Куль";
    const streetsContainer = document.querySelector(".old_point");

    // Функция для поиска улиц через API 2ГИС в INPUT
    async function fetchStreets(query) {
        const url = `https://catalog.api.2gis.com/3.0/items/geocode?q=${encodeURIComponent(city)}, ${encodeURIComponent(query)}&fields=items.full_address,items.point&key=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Ошибка при обращении к API 2ГИС");
            }

            const data = await response.json();
            return data.result.items || [];
        } catch (error) {
            console.error("Ошибка при поиске улиц:", error);
            return [];
        }
    }

    // Обновление списка улиц
    async function updateStreetsList(query) {
        if (query.length < 4) {
            streetsContainer.innerHTML = "<p>Введите минимум 4 символов</p>";
            return;
        }

        streetsContainer.innerHTML = "<p>Поиск...</p>";

        const streets = await fetchStreets(query);

        if (streets.length === 0) {
            streetsContainer.innerHTML = "<p>Улицы не найдены</p>";
            return;
        }

        // Отображаем найденные улицы
        streetsContainer.innerHTML = streets
            .map((street) => {
                const currentInput = inputA === document.activeElement ? inputA : inputB; // Определяем, с какого инпута был запрос
                return `
                <button class="street-item" 
                    data-lat="${street.point?.lat || ''}" 
                    data-lon="${street.point?.lon || ''}" 
                    data-full-address="${street.full_name}"
                    data-input-id="${currentInput.classList.contains('search_location1') ? 'search_location1' : 'search_location2'}">
                    <div class="location_icon">
                        <img src="/static/icons/location.png" alt="">
                    </div>
                    <div class="text">
                        <p>${street.full_name}</p>
                    </div>
                    <p class="time_to_point">9 мин</p>
                </button>
            `;
            })
            .join("");

        // Добавляем обработчики клика для выбора улицы
        document.querySelectorAll(".street-item").forEach((item) => {

            item.addEventListener("click", () => {
                const lat = Number(item.dataset.lat);
                const lon = Number(item.dataset.lon);
                const fullAddress = item.dataset.fullAddress;
                const inputId = item.dataset.inputId;  // Получаем id инпута
                const center = [lon, lat];


                // Проверяем, с какого инпута был вызван этот элемент
                if (inputId === "search_location1") {
                    localStorage.setItem("point_a", JSON.stringify({
                        full_address: fullAddress,
                        lon: Number(lon),
                        lat: Number(lat)
                    }));

                    // Обновляем значение в input
                    inputA.value = fullAddress;
                    console.log(`Поле "Откуда поедем?": ${inputA.value}`);
                    map.setCenter(center);
                    map.setZoom(18);
                    startMarkerHtml(lat, lon)
                    checkInputs()
                    getDistance();
                } else if (inputId === "search_location2") {
                    localStorage.setItem("point_b", JSON.stringify({
                        full_address: fullAddress,
                        lon: Number(lon),
                        lat: Number(lat)
                    }));

                    // Обновляем значение в input
                    inputB.value = fullAddress;
                    console.log(`Поле "Куда поедем?": ${inputB.value}`);
                    map.setCenter(center);
                    map.setZoom(18);
                    finishMarkerHtml(lat, lon)
                    checkInputs()
                    getDistance();
                }

                // Очищаем список после выбора
                streetsContainer.innerHTML = "";

                // Выводим данные в консоль
                console.log(`Выбрана улица: ${fullAddress}, Координаты: ${lat}, ${lon}`);
            });
        });

    }

    // Обработка ввода текста
    function handleInput(event) {
        clearTimeout(debounceTimer); // Очищаем предыдущий таймер
        const query = event.target.value.trim();

        debounceTimer = setTimeout(async () => {
            await updateStreetsList(query);
        }, 1000); // 1000 мс = 1 секунда
    }

    inputA.addEventListener("input", handleInput);
    inputB.addEventListener("input", handleInput);





    //фунциия для получения геолокации и запись в point_a
    const status = document.getElementById('status');
    let point_a = {};

    async function success(pos) {
        const center = [pos.coords.longitude, pos.coords.latitude];
        const centerMap = map.getCenter(); // Получаем координаты центра карты
        const latitude = center[1].toFixed(8); // Широта
        const longitude = center[0].toFixed(8); // Долгота
        status.textContent = '';
        searchLocation1animation.style.cssText = 'display: none;';
        inputA.style.cssText = 'display: block;';
        startMarkerHtml(pos.coords.latitude, pos.coords.longitude)
        // Центрировать карту на новой точке
        map.setCenter(center);
        map.setZoom(18);

        try {
            const response = await fetch(
                `https://catalog.api.2gis.com/3.0/items?q=${latitude},${longitude}&fields=items.full_address&key=${apiKey}`
            );
            const data = await response.json();

            if (data && data.result && data.result.items && data.result.items.length > 0) {
                const full_name = data.result.items[0].full_name;
                point_a = {
                    full_address: full_name,
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                };

                // Сохранить point_a в localStorage
                localStorage.setItem('point_a', JSON.stringify(point_a));

                // Обновить значение в поле ввода
                document.querySelector('.search_location1').value = full_name;

                console.log('Point A:', point_a);
            } else {
                status.textContent = 'Не удалось получить адрес.';
            }
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
            status.textContent = 'Произошла ошибка при определении адреса.';
        }
    }

    function error() {
        status.textContent = 'Unable to retrieve your location';
        searchLocation1animation.style.cssText = 'display: none;';
        inputA.style.cssText = 'display: block;';
    }

    function geoFindMe() {
        if (!navigator.geolocation) {
            status.textContent = 'Geolocation is not supported by your browser';
        } else {
            status.textContent = 'Locating…';
            navigator.geolocation.getCurrentPosition(success, error);
            searchLocation1animation.style.cssText = 'display: block;';
            inputA.style.cssText = 'display: none;';
            contentUp();
        }
    }

    // Привязать обработчик события к кнопке
    document.getElementById('my_location_btn').addEventListener('click', geoFindMe);
    document.getElementById('geolocation_a').addEventListener('click', geoFindMe);



    // Функция для вставки адрессов из истории локация при фокусе на инпуты
    function setupFocusHandlers() {
        // Получаем элементы с классами search_location1 и search_location2
        const searchLocation1 = document.querySelector('.search_location1');
        const searchLocation2 = document.querySelector('.search_location2');

        // Проверяем, что элементы существуют
        if (searchLocation1) {
            searchLocation1.addEventListener('focus', () => {
                displayOldPoints('old_point_a');
                geoLocationA.style.display = "flex";
            });
        }

        if (searchLocation2) {
            searchLocation2.addEventListener('focus', () => {
                displayOldPoints('old_point_b');
                // geoLocationA.style.display = "none";
            });
        }
    }

    // Вызов функции для установки обработчиков
    setupFocusHandlers();




    // Функция для вставки адрессов из локалсторадж
    function displayOldPoints(pointType) {
        // Получаем данные из localStorage
        const oldPoints = JSON.parse(localStorage.getItem(pointType));

        // Проверяем наличие данных
        if (!oldPoints || oldPoints.length === 0) {
            console.log('Нет данных для отображения');
            return;
        }

        // Контейнер, в который будем добавлять элементы
        const container = document.querySelector('.old_point'); // Убедитесь, что такой контейнер есть в HTML

        // Очищаем контейнер перед добавлением новых элементов
        container.innerHTML = '';

        // Генерируем элементы для каждого адреса
        oldPoints.forEach((point, index) => {
            const pointDiv = document.createElement('div');
            pointDiv.classList.add('point_one');

            pointDiv.innerHTML = `
            <div class="location_icon">
                <img src="/static/icons/back-arrow.png" alt="icon">
            </div>
            <div class="text">
                <p>${point.full_address}</p>
            </div>
            <p class="time_to_point">${index + 1}0 мин</p>
        `;

            // Добавляем элемент в контейнер
            container.appendChild(pointDiv);
        });
    }




    function contentUp() {
        locationPoints.style.display = "flex";
        geoLocationA.style.display = "flex";
        logoContainer.style.display = "none";
        endPointBtn.style.display = "none";
        orderTaxi.style.cssText = `height: ${maxHeight}%`;
        myLocationBtn.style.display = "none";
        taxiGo.style.cssText = 'display: none;';
        destination.style.cssText = 'display: none;';
    }
    function contentDown() {
        orderTaxi.style.height = `${minHeight}%`;
        locationPoints.style.display = "none";
        geoLocationA.style.display = "none";
        logoContainer.style.display = "flex";
        endPointBtn.style.display = "flex";
        myLocationBtn.style.display = "block";
        taxiGo.style.cssText = 'display: none;';
    }

    let startY = 0;
    let currentHeight = minHeight;

    endPointBtn.addEventListener("click", function () {
        contentUp()
    });

    // Обработка начала свайпа
    endPoint.addEventListener("touchstart", function (event) {
        startY = event.touches[0].clientY;
    });

    // Обработка движения свайпа
    endPoint.addEventListener("touchmove", function (event) {
        const endY = event.touches[0].clientY;
        const diffY = startY - endY; // Разница в движении вверх или вниз

        // Изменяем высоту пропорционально движению
        let newHeight = currentHeight + diffY * 0.2; // Скорость изменения высоты (умножить на коэффициент)
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight)); // Ограничиваем в пределах 40% - 85%

        // Устанавливаем новую высоту
        orderTaxi.style.height = `${newHeight}%`;
    });

    // Фиксируем новую высоту после окончания свайпа
    endPoint.addEventListener("touchend", function () {
        // Получаем текущую высоту
        currentHeight = parseFloat(orderTaxi.style.height);

        // Проверяем порог и устанавливаем значение
        if (currentHeight > thresholdHeight) {
            contentUp();
            currentHeight = maxHeight; // Обновляем текущую высоту
        } else {
            contentDown();
            currentHeight = minHeight; // Обновляем текущую высоту
        }
    });


    function destinationStyle() {
        destination.style.cssText = "display: flex; ";
        orderTaxi.style.cssText = "display: none;"
        locationMarker.style.cssText = 'opacity: 100%;'
        locationMarker.classList.add('marker_animate')
    }
    function destinationBtnStyle() {
        destinationPoint.value = 'amandows';
        destination.style.cssText = "display: none; ";
        orderTaxi.style.cssText = "display: flex;"
        orderTaxi.style.height = `${maxHeight}%`;
    }
    viewMapBtn2.addEventListener("click", function () {
        destinationPoint.value = 'b'
        const pointB = JSON.parse(localStorage.getItem('point_b'));
        destinationStyle()
        if (pointB) {
            getCenter(pointB.lon, pointB.lat, 18)
        }
        locationMarker.style.cssText = 'opacity: 100%;';
        startMarkerImg.style.cssText = 'display: none;'
        finishMarkerImg.style.cssText = 'display: block;'
        directions.clear()
    })

    viewMapBtn1.addEventListener("click", function () {
        destinationPoint.value = 'a'
        const pointA = JSON.parse(localStorage.getItem('point_a'));
        destinationStyle()
        if (pointA) {
            getCenter(pointA.lon, pointA.lat, 18)
        }
        locationMarker.style.cssText = 'opacity: 100%;';
        startMarkerImg.style.cssText = 'display: block;'
        finishMarkerImg.style.cssText = 'display: none;'
        directions.clear()
    })

    destinationBtn.addEventListener("click", function () {
        locationMarker.style.cssText = 'opacity: 0%;'
        if (destinationText.textContent != '' & destinationPoint.value == 'a') {
            inputA.value = destinationText.textContent;
            destinationBtnStyle()
            locationMarker.style.cssText = 'display: none;'
            localStorage.setItem("point_a", JSON.stringify({
                full_address: destinationText.textContent,
                lon: Number(destinationLon.value),
                lat: Number(destinationLat.value),
            }));
            const pointA = JSON.parse(localStorage.getItem('point_a'));
            startMarkerHtml(pointA.lat, pointA.lon);
            checkInputs();
        }
        if (destinationText.textContent != '' & destinationPoint.value == 'b') {
            inputB.value = destinationText.textContent;
            destinationBtnStyle()
            locationMarker.style.cssText = 'display: none;'
            localStorage.setItem("point_b", JSON.stringify({
                full_address: destinationText.textContent,
                lon: Number(destinationLon.value),
                lat: Number(destinationLat.value),
            }));
            const pointB = JSON.parse(localStorage.getItem('point_b'));
            finishMarkerHtml(pointB.lat, pointB.lon);
            checkInputs();
        }
    });

    function handleLocationClick(event) {
        event.preventDefault(); // Предотвращаем действие по умолчанию
        if (taxiDrivers) {
            taxiDrivers.destroy();
        }
        // Вызываем contentUp()
        contentUp();
        locationMarker.style.cssText = 'opacity: 0;';
        startMarkerImg.style.cssText = 'display: none;'
        finishMarkerImg.style.cssText = 'display: none;'
        directions.clear()
        startMoveMarker.destroy();
        finishMoveMarker.destroy();
        searchWave.destroy();
        taxiOrderCancel()

        if (event.target.classList.contains("location_one_go")) {
            document.querySelector(".search_location1").focus();
            taxiGo.style.display = "none";
        } else if (event.target.classList.contains("location_two_go")) {
            document.querySelector(".search_location2").focus();
            taxiGo.style.display = "none";
        } else if (event.target.classList === "back_btn") {
            destinationPoint.value = "amandows";
            taxiGo.style.display = "none";
            console.log(destinationPoint.value);
        } else if (event.target.classList.contains("back_btn2")) {
            destinationPoint.value = "amandows";
            taxiGo.style.display = "none";
            console.log(destinationPoint.value);
        }
    }

    // Добавляем обработчик событий для обеих кнопок
    document.querySelector(".location_one_go").addEventListener("click", handleLocationClick);
    document.querySelector(".location_two_go").addEventListener("click", handleLocationClick);
    backBtn.addEventListener("click", handleLocationClick);
    backBtn2.addEventListener("click", handleLocationClick);

    const taxiSetup = document.querySelector(".taxi_setup")
    const searchTaxiDriver = document.querySelector(".search_taxi_driver")
    const orderTaxiGoBtn = document.querySelector(".order_taxi_go")
    const orderTaxiGoCancelBtn = document.querySelector(".order_taxi_cancel")

    function removeTaxiDriversMarkers() {
    taxiDriverMarkers.forEach(marker => {
        marker.destroy();
    });

    taxiDriverMarkers = [];
}




    function taxiOrderGo() {
        taxiSetup.style.cssText = 'opacity: 0;';
        searchTaxiDriver.style.cssText = 'opacity: 1;'
        orderTaxiGoCancelBtn.style.cssText = 'display: block;'
        orderTaxiGoBtn.style.cssText = 'display: none;'
    }
    function taxiOrderCancel() {
        taxiSetup.style.cssText = 'opacity: 1;';
        searchTaxiDriver.style.cssText = 'opacity: 0;'
        orderTaxiGoCancelBtn.style.cssText = 'display: none;'
        orderTaxiGoBtn.style.cssText = 'display: block;'
    }


    document.querySelector(".order_taxi_go").addEventListener("click", function () {
        // Удаляем значения из localStorage
        // localStorage.removeItem("point_a");
        // localStorage.removeItem("point_b");
        const pointA = JSON.parse(localStorage.getItem('point_a'));
        console.log(pointA.lon + pointA.lat + " ETO POINT A")
        searchWaveMArker(pointA.lat, pointA.lon);
        getCenter(pointA.lon, pointA.lat, 15.5)
        // placeTaxiDriversMarkers()
        taxiOrderGo()
        // console.log("point_a и point_b удалены из localStorage"); // Проверка в консоли
    });

    orderTaxiGoCancelBtn.addEventListener("click", function () {
        searchWave.destroy();
        taxiOrderCancel()
        // removeTaxiDriversMarkers()
        // console.log("point_a и point_b удалены из localStorage"); // Проверка в консоли
    });

});

///****функция для выбора категории такси или доставки */
document.addEventListener("DOMContentLoaded", function () {
    const taxiCategories = document.querySelectorAll(".taxi_category");
    const deliveryCategories = document.querySelectorAll(".delivery_category");

    taxiCategories.forEach(category => {
        category.addEventListener("click", function () {
            // Удаляем класс active у всех категорий
            taxiCategories.forEach(item => item.classList.remove("active"));

            // Добавляем класс active к нажатой категории
            this.classList.add("active");
        });
    });

    deliveryCategories.forEach(category => {
        category.addEventListener("click", function () {
            // Удаляем класс active у всех категорий
            deliveryCategories.forEach(item => item.classList.remove("active"));

            // Добавляем класс active к нажатой категории
            this.classList.add("active");
        });
    });
});

/****функция для выбора такси или доставка */
document.addEventListener("DOMContentLoaded", function () {
    const taxiDelivery = document.querySelectorAll(".taxi_delivery");

    taxiDelivery.forEach(category => {
        category.addEventListener("click", function () {
            // Удаляем класс active у всех категорий
            taxiDelivery.forEach(item => item.classList.remove("active"));

            // Добавляем класс active к нажатой категории
            this.classList.add("active");
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const typeTaxi = document.getElementById('type_taxi');
    const typeDelivery = document.getElementById('type_delivery');
    const taxiCategories = document.querySelectorAll(".taxi_category");
    const deliveryCategories = document.querySelectorAll(".delivery_category");

    typeTaxi.addEventListener('click', function () {
        // Скрываем все категории доставки
        deliveryCategories.forEach(category => {
            category.style.display = 'none';
        });

        // Показываем все категории такси
        taxiCategories.forEach(category => {
            category.style.display = 'flex';
        });
    });

    typeDelivery.addEventListener('click', function () {
        // Показываем все категории доставки
        deliveryCategories.forEach(category => {
            category.style.display = 'flex';
        });

        // Скрываем все категории такси
        taxiCategories.forEach(category => {
            category.style.display = 'none';
        });
    });
});

























