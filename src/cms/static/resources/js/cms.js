$(function () {
    $('table.js-datatable').DataTable({
        pageLength: 10,
        language: {
            search: 'Tìm:',
            lengthMenu: 'Hiện _MENU_ dòng',
            info: 'Dòng _START_–_END_ / _TOTAL_',
            infoEmpty: 'Không có dữ liệu',
            zeroRecords: 'Không tìm thấy kết quả',
            paginate: { previous: '‹', next: '›' }
        }
    });

    $(document).on('click', '[data-confirm]', function (e) {
        if (!window.confirm($(this).data('confirm'))) {
            e.preventDefault();
        }
    });

    setTimeout(function () { $('.js-auto-close').alert('close'); }, 4000);

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
