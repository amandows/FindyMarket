function showOrders(tbodyId, clickedButton) {
    // Скрываем все tbody
    document.getElementById('tbody').style.display = 'none';
    document.getElementById('tbody-completed').style.display = 'none';
    document.getElementById('tbody-cancelled').style.display = 'none';
    var title = document.querySelector('.title')

    // Показываем только выбранный tbody
    document.getElementById(tbodyId).style.display = 'table-row-group';

    // Удаляем класс 'active' у всех кнопок
    var buttons = document.querySelectorAll('.orders-btn button');
    buttons.forEach(function(button) {
        button.classList.remove('active');
    });

    // Добавляем класс 'active' к нажатой кнопке
    clickedButton.classList.add('active');
}

// При загрузке страницы показываем только новые заказы и делаем первую кнопку активной
document.addEventListener('DOMContentLoaded', function() {
    showOrders('tbody', document.querySelector('.new-orders'));
});