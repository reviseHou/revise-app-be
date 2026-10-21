(function () {
    var data = JSON.parse(document.getElementById('chartData').textContent);
    var BLUE = '#0b6fb8';
    var STATUS = [
        { key: 'PENDING', label: 'Chờ duyệt', color: '#f2b84b' },
        { key: 'REJECTED', label: 'Bị từ chối', color: '#e05d5d' },
        { key: 'ACTIVE', label: 'Đang hiển thị', color: '#3aa76d' },
        { key: 'INACTIVE', label: 'Đã ẩn', color: '#9aa5b1' }
    ];
    var noGrid = { grid: { display: false } };
    var wholeNumbers = { beginAtZero: true, ticks: { precision: 0 } };

    Chart.defaults.font.family = 'inherit';
    Chart.defaults.maintainAspectRatio = false;

    function names(rows) { return rows.map(function (row) { return row.name; }); }
    function counts(rows) { return rows.map(function (row) { return row.count; }); }

    new Chart('statusChart', {
        type: 'doughnut',
        data: {
            labels: STATUS.map(function (s) { return s.label; }),
            datasets: [{
                data: STATUS.map(function (s) { return data.documentCountByStatus[s.key] || 0; }),
                backgroundColor: STATUS.map(function (s) { return s.color; })
            }]
        },
        options: { cutout: '62%', plugins: { legend: { position: 'bottom' } } }
    });

    new Chart('monthChart', {
        type: 'bar',
        data: {
            labels: names(data.documentCountByMonth),
            datasets: [{ data: counts(data.documentCountByMonth), backgroundColor: BLUE, borderRadius: 4 }]
        },
        options: { plugins: { legend: { display: false } }, scales: { x: noGrid, y: wholeNumbers } }
    });

    [['facultyChart', data.documentCountByFaculty], ['uploaderChart', data.topUploaders]].forEach(function (pair) {
        new Chart(pair[0], {
            type: 'bar',
            data: {
                labels: names(pair[1]),
                datasets: [{ data: counts(pair[1]), backgroundColor: BLUE, borderRadius: 4 }]
            },
            options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: wholeNumbers, y: noGrid } }
        });
    });
})();
