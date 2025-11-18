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

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Если уведомление пришло в payload.notification — FCM сам покажет его
    if (payload.notification) {
        return; // ничего не делаем, избегаем дубликатов
    }

    // Если уведомление пришло только в data — тогда показываем вручную
    const notificationTitle = payload.data.title || "Уведомление";
    const { body, icon, image } = payload.data;

    const notificationOptions = {
        body: body,
        icon: icon,
        image: image
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

messaging.getToken({ vapidKey: "BPnPE1b8pwh5LesoRwLcdNL4144DdYfPQ25a3d8r77q8gE1b-Ljtlfv-UsupEv_dJWj-S1firTlLtpWhKtmlInQ" })
.then((fcmToken) => {
    console.log("FCM Token (web):", fcmToken);
    // Передаем токен в Android
    if (typeof AndroidBridge !== "undefined") {
        AndroidBridge.sendTokenToAndroid(fcmToken);
    }
})
.catch((err) => {
    console.error("Error getting FCM token:", err);
});