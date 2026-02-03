function showOrders(tbodyId, clickedButton) {
    // Скрываем все tbody
    document.getElementById('tbody').style.display = 'none';
    document.getElementById('tbody-completed').style.display = 'none';
    document.getElementById('tbody-cancelled').style.display = 'none';

    // Показываем только выбранный tbody
    document.getElementById(tbodyId).style.display = 'table-row-group';

    // Удаляем класс 'active' у всех кнопок
    var buttons = document.querySelectorAll('.orders-btn button');
    buttons.forEach(function(button) {
        button.classList.remove('active');
    });

    // Добавляем класс 'active' к нажатой кнопке
    clickedButton.classList.add('active');

    // 🔥 Управление пагинацией
    document.querySelectorAll('.table-pagination').forEach(function(pagination) {
        if (pagination.dataset.target === tbodyId) {
            pagination.style.display = 'flex'; // показываем только нужную пагинацию
        } else {
            pagination.style.display = 'none'; // скрываем остальные
        }
    });

    // Скролл вверх к таблице
    document.getElementById(tbodyId).scrollIntoView({ behavior: "smooth", block: "start" });
}

// При загрузке страницы показываем только новые заказы и делаем первую кнопку активной
document.addEventListener('DOMContentLoaded', function() {
    // Скрываем все пагинации сначала
    document.querySelectorAll('.table-pagination').forEach(function(pagination){
        pagination.style.display = 'none';
    });

    // Показываем новые заказы
    showOrders('tbody', document.querySelector('.new-orders'));
});