importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDZkTrPVYDi4xw1QC3CxgSwvLypUUWEFvg",
    authDomain: "findymarket.firebaseapp.com",
    databaseURL: "https://findymarket.firebaseio.com",
    projectId: 'findymarket',
    storageBucket: 'findymarket.appspot.com',
    messagingSenderId: "502625114209",
    appId: "1:502625114209:web:ae9a04d7604b7362c4b220",
    measurementId: "G-18RT40CK0E"
});

const messaging = firebase.messaging();

// Обработка сообщений в фоновом режиме
messaging.onBackgroundMessage((payload) => {
    // Удаляем или комментируем console.log(payload)
    
    const bodyText = payload.notification?.body || payload.data?.body || "Обновление заказа";

    // Передаем только строку body на страницу
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'PUSH_RECEIVED',
                text: bodyText
            });
        });
    });
});

// Добавьте это в начало или замените существующий обработчик
messaging.onBackgroundMessage((payload) => {
    console.log('SW: Received message', payload);

    const bodyText = payload.data?.body || payload.notification?.body || "Обновление заказа";

    // 1. Рассылаем сообщение всем вкладкам (чтобы сработал navigator.serviceWorker.onmessage)
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'PUSH_RECEIVED',
                text: bodyText,
                image: '/static/icons/1024x500.png',
            });
        });
    });

    // 2. Если вы хотите, чтобы ДАЖЕ при открытой вкладке всплывало СИСТЕМНОЕ уведомление (баннер сверху):
    // Внимание: Chrome может блокировать баннер при активной вкладке, но это поможет в WebView
    const notificationTitle = payload.data?.title || "Findy Market";
    const notificationOptions = {
        body: bodyText,
        image: '/static/icons/1024x500.png', // Укажите ваш путь к иконке
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Добавляем общий слушатель push событий (страховка для активного режима)
self.addEventListener('push', function(event) {
    if (event.data) {
        console.log('Push event received', event.data.json());
        // Здесь можно продублировать логику отправки postMessage
    }
});

// Получение токена
messaging.getToken({ vapidKey: "BPnPE1b8pwh5LesoRwLcdNL4144DdYfPQ25a3d8r77q8gE1b-Ljtlfv-UsupEv_dJWj-S1firTlLtpWhKtmlInQ" })
.then((fcmToken) => {
    console.log("FCM Token (web):", fcmToken);
    if (typeof AndroidBridge !== "undefined") {
        AndroidBridge.sendTokenToAndroid(fcmToken);
    }
})
.catch((err) => {
    console.error("Error getting FCM token:", err);
});