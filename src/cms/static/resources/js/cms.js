$(function () {
    $(document).on('click', '[data-delete-action]', function () {
        $('#deleteForm').attr('action', $(this).data('delete-action'));
        $('#deleteTitle').text($(this).data('confirm-title') || 'Bạn có chắc chắn muốn xóa không?');
        $('#deleteName').text($(this).data('delete-name') || '');
        $('#deleteModal').modal('show');
    });

    $('[title]').tooltip({ trigger: 'hover' });

    var $info = $('#info');
    if ($info.length) {
        $(document).Toasts('create', {
            class: $info.data('type') === 'success' ? 'toast-success' : 'toast-error',
            body: '<i class="fas ' + ($info.data('type') === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle') + '"></i><span>' +
                $('<div>').text($info.attr('data-content')).html() + '</span>',
            position: 'topRight',
            close: false,
            autohide: true,
            delay: 5000
        });
    }

    setUpPermissionsPicker();
});

function setUpPermissionsPicker() {
    var $available = $('#availableList');
    var $assigned = $('#assignedList');
    if (!$available.length) return;

    ['availableList', 'assignedList'].forEach(function (id) {
        Sortable.create(document.getElementById(id), { group: 'permissions', animation: 150 });
    });

    $(document).on('click', '.js-permissions', function () {
        var d = $(this).data();
        var assignedIds = String(d.assigned || '').split(',').filter(Boolean);
        $('#permissionsForm').attr('action', d.action);
        $('#permissionsRoleName').text(d.name);
        $('.js-dual-search').val('');
        $available.empty();
        $assigned.empty();
        $('#permissionPool li').each(function () {
            var id = String($(this).data('id'));
            var $item = $('<li class="list-group-item list-group-item-action py-2"></li>')
                .attr('data-id', id)
                .text($(this).text());
            (assignedIds.indexOf(id) >= 0 ? $assigned : $available).append($item);
        });
        $('#permissionsModal').modal('show');
    });

    $(document).on('dblclick', '#availableList li, #assignedList li', function () {
        var $target = $(this).parent().is($available) ? $assigned : $available;
        $target.append($(this).show());
    });

    $(document).on('input', '.js-dual-search', function () {
        var keyword = $(this).val().toLowerCase();
        $($(this).data('target')).children().each(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(keyword) >= 0);
        });
    });

    $('#permissionsForm').on('submit', function () {
        var $inputs = $('#assignedInputs').empty();
        $assigned.children().each(function () {
            $('<input type="hidden" name="permissionIds[]">')
                .val($(this).attr('data-id'))
                .appendTo($inputs);
        });
    });
}
