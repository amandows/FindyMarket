// document.addEventListener("DOMContentLoaded", function () {
//     const ctxCurrent = document.getElementById('ordersChartCurrent').getContext('2d');
//     const ctxLast = document.getElementById('ordersChartLast').getContext('2d');
//     const ctxAll = document.getElementById('ordersChartAll').getContext('2d'); // Новый контекст для общего графика

//     const calendar = {
//         monthDays: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
//     };

//     // AJAX-запрос для получения данных
//     fetch('/user-orders-json/')
//         .then(response => response.json())
//         .then(data => {
//             const now = new Date();
//             const currentYear = now.getFullYear();
//             const currentMonth = now.getMonth() + 1; // Месяцы от 0 до 11

//             const currentMonthData = Array.from({ length: calendar.monthDays[currentMonth - 1] }, () => 0);
//             const lastMonthData = Array.from({ length: calendar.monthDays[currentMonth - 2] }, () => 0);
//             const allTimeData = Array.from({ length: 12 }, () => 0); // Массив для общего графика по месяцам

//             data.forEach(item => {
//                 const { year, month, day, count } = item;
//                 if (year === currentYear && month === currentMonth) {
//                     currentMonthData[day - 1] += count;
//                 } else if (year === currentYear && month === currentMonth - 1) {
//                     lastMonthData[day - 1] += count;
//                 }
//                 // Суммируем данные для общего графика
//                 if (year === currentYear) {
//                     allTimeData[month - 1] += count; // Суммируем по месяцам
//                 }
//             });

//             // Создание графика для текущего месяца
//             new Chart(ctxCurrent, {
//                 type: 'bar',
//                 data: {
//                     labels: Array.from({ length: currentMonthData.length }, (v, k) => k + 1),
//                     datasets: [{
//                         label: 'Количество успешных заказов за текущий месяц',
//                         data: currentMonthData,
//                         backgroundColor: 'rgba(54, 162, 235, 0.8)',
//                         borderColor: 'rgba(54, 162, 235, 1)',
//                         borderWidth: 3
//                     }]
//                 },
//                 options: {
//                     scales: {
//                         y: {
//                             beginAtZero: true
//                         }
//                     }
//                 }
//             });

//             // Создание графика для прошлого месяца
//             new Chart(ctxLast, {
//                 type: 'bar',
//                 data: {
//                     labels: Array.from({ length: lastMonthData.length }, (v, k) => k + 1),
//                     datasets: [{
//                         label: 'Количество успешных заказов за прошлый месяц',
//                         data: lastMonthData,
//                         backgroundColor: 'rgba(255, 99, 132, 0.8)',
//                         borderColor: 'rgba(255, 99, 132, 1)',
//                         borderWidth: 3
//                     }]
//                 },
//                 options: {
//                     scales: {
//                         y: {
//                             beginAtZero: true
//                         }
//                     }
//                 }
//             });

//             // Создание общего графика
//             new Chart(ctxAll, {
//                 type: 'bar',
//                 data: {
//                     labels: Array.from({ length: 12 }, (v, k) => k + 1), // Месяцы от 1 до 12
//                     datasets: [{
//                         label: 'Общее количество успешных заказов по месяцам',
//                         data: allTimeData,
//                         backgroundColor: 'rgba(75, 192, 192, 0.8)',
//                         borderColor: 'rgba(75, 192, 192, 1)',
//                         borderWidth: 3
//                     }]
//                 },
//                 options: {
//                     scales: {
//                         y: {
//                             beginAtZero: true
//                         }
//                     }
//                 }
//             });
//         })
//         .catch(error => {
//             console.error('Ошибка при получении данных:', error);
//         });
// });

// document.addEventListener("DOMContentLoaded", function () {
//     // Получаем все кнопки месяца
//     const monthButtons = document.querySelectorAll('.monthBtn');

//     // Обработчик для кнопок выбора месяца
//     monthButtons.forEach(button => {
//         button.addEventListener('click', function () {
//             // Убираем класс active у всех кнопок
//             monthButtons.forEach(btn => btn.classList.remove('active'));

//             // Добавляем класс active к текущей кнопке
//             this.classList.add('active');
//         });
//     });
// });

document.addEventListener("DOMContentLoaded", function () {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    // Получаем контекст для графика
    const ctx = document.getElementById('ordersChart').getContext('2d');
    
    // Массив для хранения графиков
    let chart = null;
    
    // Получаем элементы для выбора года и месяца
    const yearSelect = document.getElementById('yearSelect');
    const monthButtons = document.querySelectorAll('.monthBtn');
    
    // Функция для обновления графика по выбранному месяцу
    function updateChart(year, month) {
        fetch(`/user-orders-json/?year=${year}&month=${month + 1}`)
            .then(response => response.json())
            .then(data => {
                console.log('Received data:', data);  // Выводим данные для отладки

                if (Array.isArray(data.orders)) {
                    const successfulOrdersData = Array.from({ length: 31 }, () => 0);
                    const cancelledOrdersData = Array.from({ length: 31 }, () => 0);

                    // Суммируем количество заказов
                    data.orders.forEach(item => {
                        const { day, count, status } = item;
                        if (status === 'completed') {
                            successfulOrdersData[day - 1] += count;
                        } else if (status === 'cancelled') {
                            cancelledOrdersData[day - 1] += count;
                        }
                    });

                    // Получаем total_amount отдельно из data
                    let totalAmount = parseFloat(data.total_amount);
                    const totalSuccessfulOrders = successfulOrdersData.reduce((acc, current) => acc + current, 0);
                    const totalCancelledOrders = cancelledOrdersData.reduce((acc, current) => acc + current, 0);

                    // Если chart существует, удаляем его перед созданием нового
                    if (chart) {
                        chart.destroy();
                    }

                    // Создание графика
                    chart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: Array.from({ length: 31 }, (_, i) => i + 1), // Метки дней месяца
                            datasets: [
                                {
                                    label: `${totalSuccessfulOrders} успешных заказов за ${months[month]} на сумму ${totalAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} сом`,
                                    data: successfulOrdersData,
                                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 3
                                },
                                {
                                    label: `${totalCancelledOrders} отмененных заказов за ${months[month]}`,
                                    data: cancelledOrdersData,
                                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 3
                                }
                            ]
                        },
                        options: {
                            scales: { y: { beginAtZero: true } },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: function(tooltipItem) {
                                            if (tooltipItem.datasetIndex === 0 || tooltipItem.datasetIndex === 1) {
                                                return `Количество: ${tooltipItem.raw}`;
                                            }
                                            return tooltipItem.raw;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    console.error('Data is not an array:', data);
                }
            })
            .catch(error => {
                console.error('Ошибка при получении данных:', error);
            });
    }

    // Начальная загрузка данных для первого месяца (января) текущего года
    updateChart(yearSelect.value, 0);
    
    // Обработчик для изменения года
    yearSelect.addEventListener('change', function () {
        const selectedYear = this.value;
        const selectedMonth = document.querySelector('.monthBtn.active')?.dataset.month || 0; // Используем текущий выбранный месяц
        updateChart(selectedYear, selectedMonth);
    });
    
    // Обработчик для кнопок выбора месяца
    monthButtons.forEach(button => {
        button.addEventListener('click', function () {
            const selectedYear = yearSelect.value;
            const selectedMonth = parseInt(this.dataset.month);
            
            // Подсветка выбранной кнопки
            monthButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            updateChart(selectedYear, selectedMonth);
        });
    });
});





