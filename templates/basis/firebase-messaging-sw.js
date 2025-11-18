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
    const notificationTitle = payload.data.title;
    const { body, icon, image } = payload.data;

    const notificationOptions = {
        body: body,
        icon: icon,
        image: image
    }
    self.registration.showNotification(notificationTitle, notificationOptions);
});
