<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 26/08/2026
// DESCRIPTION : Dashboard show view for the dashboard
/**
 * Shared dashboard show view.
 * Expects: $cfg, $items, $year, $defaultFrom, $defaultTo
 * Sets: $extraScripts (picked up by layout)
 */

$mode = $cfg['mode'];
$items = $items ?? [];
$dataSource = $dataSource ?? 'static';
$sapError = $sapError ?? null;
$sapRows = (int) ($sapRows ?? 0);
$currencySymbol = $currencySymbol ?? '$';
$sapLive = $dataSource === 'sap';

// START OUTPUT BUFFERING
ob_start();

// START SCRIPT
?>
<script>
(function () {
    const MODE = <?= json_encode($mode) ?>;
    const SAP_LIVE = <?= $sapLive ? 'true' : 'false' ?>;
    const DATA = {
        year: <?= (int) $year ?>,
        monthly: <?= json_encode($cfg['monthly']) ?>,
        products: <?= json_encode($items) ?>,
        currencySymbol: <?= json_encode($currencySymbol) ?>
    };
    const KPI_MONEY = <?= json_encode(array_column($cfg['kpis'], 'money')) ?>;
    const KPI_SUFFIX = <?= json_encode(array_map(function ($k) { return $k['suffix'] ?? ''; }, $cfg['kpis'])) ?>;
    const MD_COLORS = ['#0369a1', '#7c3aed', '#047857', '#d97706', '#db2777', '#0f766e'];
    const chartAnim = {
        duration: 1100,
        easing: 'easeOutQuart',
        delay(ctx) {
            let delay = 0;
            if (ctx.type === 'data' && ctx.mode === 'default') {
                delay = ctx.dataIndex * 60 + (ctx.datasetIndex || 0) * 80;
            }
            return delay;
        }
    };

    Chart.defaults.color = '#6b7280';
    Chart.defaults.borderColor = '#e5e7eb';

    let revenueChart, categoryChart, productsBarChart, ordersChart;
    let counterTimers = {};
    let filterTimer = null;

    function fmtMoney(n) {
        return DATA.currencySymbol + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function fmtNum(n) { return Math.round(n).toLocaleString(); }

    function parseDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function monthInRange(monthIndex, from, to) {
        const monthStart = new Date(DATA.year, monthIndex - 1, 1);
        const monthEnd = new Date(DATA.year, monthIndex, 0);
        return monthStart <= to && monthEnd >= from;
    }

    function formatPeriodLabel(from, to) {
        const opts = { month: 'short', day: 'numeric', year: 'numeric' };
        return from.toLocaleDateString('en-US', opts) + ' – ' + to.toLocaleDateString('en-US', opts);
    }

    function daysBetween(from, to) {
        return Math.round((to - from) / 86400000) + 1;
    }

    function monthRecord(monthIndex) {
        return DATA.monthly.find(m => parseDate(m.date).getMonth() + 1 === monthIndex) || null;
    }

    /** Build chart labels/values — daily when range is short, else monthly. */
    function buildChartSeries(from, to, filteredMonthly) {
        const span = daysBetween(from, to);
        // Enough months → keep monthly trend
        if (filteredMonthly.length >= 3 && span > 45) {
            return {
                labels: filteredMonthly.map(m => m.month),
                values: filteredMonthly.map(m => m.value),
                counts: filteredMonthly.map(m => m.count),
                grain: 'month'
            };
        }

        const labels = [];
        const values = [];
        const counts = [];
        const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

        while (cursor <= end) {
            const mi = cursor.getMonth() + 1;
            const day = cursor.getDate();
            const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
            const rec = monthRecord(mi);
            const monthVal = rec ? rec.value : 0;
            const monthCnt = rec ? rec.count : 0;
            // Deterministic daily split with mild weekday/weekend shape
            const weekday = cursor.getDay();
            const weekendBoost = (weekday === 0 || weekday === 6) ? 1.18 : 1;
            const wave = 0.82 + 0.28 * Math.sin((day / daysInMonth) * Math.PI * 2);
            const dailyVal = (monthVal / daysInMonth) * wave * weekendBoost;
            const dailyCnt = (monthCnt / daysInMonth) * wave * weekendBoost;

            if (span <= 14) {
                labels.push(cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            } else {
                labels.push(String(day));
            }
            values.push(Math.round(dailyVal * 100) / 100);
            counts.push(Math.max(1, Math.round(dailyCnt)));
            cursor.setDate(cursor.getDate() + 1);
        }

        return { labels, values, counts, grain: 'day' };
    }

    function scaleUnitsForRange(monthUnits, from, to, monthIndex) {
        if (!monthUnits) return 0;
        const monthStart = new Date(DATA.year, monthIndex - 1, 1);
        const monthEnd = new Date(DATA.year, monthIndex, 0);
        if (monthStart > to || monthEnd < from) return 0;
        const overlapStart = from > monthStart ? from : monthStart;
        const overlapEnd = to < monthEnd ? to : monthEnd;
        const overlapDays = daysBetween(overlapStart, overlapEnd);
        const daysInMonth = monthEnd.getDate();
        return monthUnits * (overlapDays / daysInMonth);
    }

    function getFilteredData(fromStr, toStr) {
        const from = parseDate(fromStr);
        const to = parseDate(toStr);
        if (from > to) return null;

        const filteredMonthly = DATA.monthly.filter(m => {
            const d = parseDate(m.date);
            const mi = d.getMonth() + 1;
            return monthInRange(mi, from, to);
        });

        const productStats = DATA.products.map(p => {
            let units = 0;
            for (let m = 1; m <= 12; m++) {
                units += scaleUnitsForRange(p.monthly_units[m] || 0, from, to, m);
            }
            units = Math.round(units);
            return { ...p, units_sold: units, revenue: units * p.price };
        });

        if (MODE !== 'inventory') productStats.sort((a, b) => b.revenue - a.revenue);
        else productStats.sort((a, b) => a.stock - b.stock);

        const categoryRevenue = {};
        productStats.forEach(p => {
            const val = MODE === 'inventory' ? p.stock * p.price : p.revenue;
            categoryRevenue[p.category] = (categoryRevenue[p.category] || 0) + val;
        });

        const chartSeries = buildChartSeries(from, to, filteredMonthly);
        const totalValue = chartSeries.values.reduce((s, v) => s + v, 0);
        const totalCount = chartSeries.counts.reduce((s, v) => s + v, 0);
        const totalUnits = productStats.reduce((s, p) => s + p.units_sold, 0);
        const stockValue = productStats.reduce((s, p) => s + p.stock * p.price, 0);
        const stockUnits = productStats.reduce((s, p) => s + p.stock, 0);
        const lowStock = productStats.filter(p => (p.reorder ? p.stock < p.reorder : p.stock < 40)).length;
        const overStock = productStats.filter(p => p.stock > 100).length;
        const warehouses = new Set(productStats.map(p => p.category)).size;
        const returnRate = MODE === 'sales'
            ? (totalUnits > 0 ? (productStats.reduce((s, p) => s + (p.return_units || 0), 0) / totalUnits) * 100 : 0)
            : 0;
        const totalCost = productStats.reduce((s, p) => s + (p.cost || 0), 0);
        const grossMargin = MODE === 'sales'
            ? (totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0)
            : 0;
        const fillRate = MODE === 'inventory' ? Math.min(99.5, 94 + (stockUnits % 10) * 0.4) : 0;
        const wastePct = MODE === 'material' ? Math.min(9.5, 4.5 + (totalUnits % 7) * 0.35) : 0;
        const sustainPct = MODE === 'material' ? Math.min(72, 55 + (totalCount % 8) * 1.5) : 0;
        const efficiency = MODE === 'production' ? Math.min(96, 82 + (totalUnits % 9) * 1.2) : 0;
        const onTimeProd = MODE === 'production' ? Math.min(98, 86 + (totalCount % 7) * 1.1) : 0;
        const defectRate = MODE === 'quality' ? Math.min(6.8, 2.1 + (totalUnits % 6) * 0.45) : 0;
        const passRate = MODE === 'quality' ? Math.min(98.5, 91 + (totalCount % 8) * 0.7) : 0;
        const conversion = MODE === 'retail' ? Math.min(28, 14 + (totalCount % 9) * 1.1) : 0;
        const sellThrough = MODE === 'retail' ? Math.min(78, 52 + (totalUnits % 10) * 1.8) : 0;
        const otif = MODE === 'orders' ? Math.min(97, 88 + (totalCount % 6) * 1.2) : 0;
        const openRate = MODE === 'orders' ? Math.min(32, 12 + (totalUnits % 8) * 1.5) : 0;
        const onTimeDel = MODE === 'procurement' ? Math.min(96, 84 + (totalCount % 7) * 1.3) : 0;
        const savingsPct = MODE === 'procurement' ? Math.min(9.5, 3.5 + (totalValue % 800) / 150) : 0;
        const organicMix = MODE === 'sustainability' ? Math.min(72, 52 + (totalCount % 8) * 1.8) : 0;
        const wasteDiverted = MODE === 'sustainability' ? Math.min(82, 58 + (totalUnits % 9) * 1.6) : 0;

        return {
            from, to, filteredMonthly, chartSeries, productStats, categoryRevenue,
            totalValue, totalCount, totalUnits, stockValue, stockUnits, lowStock, overStock, warehouses,
            avgValue: totalCount > 0 ? totalValue / totalCount : 0,
            returnRate, grossMargin, fillRate, wastePct, sustainPct,
            efficiency, onTimeProd, defectRate, passRate, conversion, sellThrough,
            otif, openRate, onTimeDel, savingsPct, organicMix, wasteDiverted
        };
    }

    function formatKpi(value, isMoney, suffix) {
        if (isMoney) return fmtMoney(value);
        const n = suffix === '%' ? value.toFixed(1) : fmtNum(value);
        return suffix ? n + suffix : n;
    }

    function animateCounter(el, endValue, isMoney, suffix = '', duration = 700) {
        if (!el) return;
        const id = el.id;
        if (counterTimers[id]) cancelAnimationFrame(counterTimers[id]);
        const startValue = Number(el.dataset.lastValue) || 0;
        el.dataset.lastValue = String(endValue);
        el.classList.add('counting');
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (endValue - startValue) * eased;
            el.textContent = formatKpi(current, isMoney, suffix);
            if (progress < 1) counterTimers[id] = requestAnimationFrame(tick);
            else {
                el.textContent = formatKpi(endValue, isMoney, suffix);
                el.classList.remove('counting');
            }
        }
        counterTimers[id] = requestAnimationFrame(tick);
    }

    function updateKPIs(data) {
        document.querySelectorAll('.kpi-card').forEach(c => {
            c.classList.add('updating');
            setTimeout(() => c.classList.remove('updating'), 500);
        });

        let values;
        let notes;
        const days = daysBetween(data.from, data.to);
        const dayNote = `Across ${days} day${days !== 1 ? 's' : ''}`;

        if (MODE === 'inventory') {
            values = [data.stockValue, data.stockUnits, data.lowStock, data.warehouses, data.overStock, data.fillRate];
            notes = [
                'Current on-hand value',
                'Units in warehouses',
                'Below reorder level',
                'Active locations',
                'Above 100 units',
                'Orders fulfilled on time'
            ];
        } else if (MODE === 'material') {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.wastePct, data.sustainPct];
            notes = [
                dayNote,
                `${data.productStats.length} material lines`,
                'Purchase orders',
                'Average per PO',
                'Cutting & sewing loss',
                'Certified sustainable'
            ];
        } else if (MODE === 'production') {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.efficiency, data.onTimeProd];
            notes = [
                dayNote,
                `${data.productStats.length} production lines`,
                'Work orders released',
                'Average per WO',
                'Vs standard minutes',
                'WO completed on schedule'
            ];
        } else if (MODE === 'quality') {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.defectRate, data.passRate];
            notes = [
                dayNote,
                `${data.productStats.length} styles checked`,
                'Lots inspected',
                'Average lot value',
                'Rejects vs inspected',
                'Lots cleared first pass'
            ];
        } else if (MODE === 'retail') {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.conversion, data.sellThrough];
            notes = [
                dayNote,
                `${data.productStats.length} active SKUs`,
                'Store transactions',
                'Average per ticket',
                'Visitors who bought',
                'Sold vs received'
            ];
        } else if (MODE === 'orders') {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.otif, data.openRate];
            notes = [
                dayNote,
                `${data.productStats.length} ordered SKUs`,
                'Orders in period',
                'Average per order',
                'On-time in-full',
                'Still open / total'
            ];
        } else if (MODE === 'procurement') {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.onTimeDel, data.savingsPct];
            notes = [
                dayNote,
                `${data.productStats.length} PO lines`,
                'Purchase orders',
                'Average per PO',
                'Supplier deliveries',
                'Vs list price'
            ];
        } else if (MODE === 'sustainability') {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.organicMix, data.wasteDiverted];
            notes = [
                dayNote,
                `${data.productStats.length} certified lines`,
                'Initiatives tracked',
                'Average initiative spend',
                'Of fabric spend',
                'Scrap from landfill'
            ];
        } else {
            values = [data.totalValue, data.totalUnits, data.totalCount, data.avgValue, data.returnRate, data.grossMargin];
            notes = [
                dayNote,
                `${data.productStats.length} style / material lines`,
                'Distinct sales orders',
                'Average net amount per order',
                'Return quantity vs sold',
                'Net amount minus cost amount'
            ];
        }

        notes.forEach((text, i) => {
            const noteEl = document.getElementById('kpi' + (i + 1) + 'Note');
            if (noteEl) noteEl.textContent = text;
        });

        values.forEach((val, i) => {
            animateCounter(document.getElementById('kpi' + (i + 1)), val, KPI_MONEY[i], KPI_SUFFIX[i] || '');
        });
    }

    function updateTable(data) {
        const tbody = document.getElementById('productTableBody');
        let rows = data.productStats;
        if (MODE !== 'inventory') rows = rows.filter(p => p.units_sold > 0);
        rows = rows.slice(0, 12);

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No data for the selected date range.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map((p, i) => {
            const stockClass = (p.reorder ? p.stock < p.reorder : p.stock < 40) ? 'stock-low' : 'stock-ok';
            const col3 = MODE === 'inventory' ? fmtNum(p.reorder || 0) : fmtNum(p.units_sold);
            const col4 = MODE === 'inventory' ? fmtMoney(p.stock * p.price) : fmtMoney(p.revenue);
            const col6 = SAP_LIVE && MODE === 'sales'
                ? escapeHtml(p.material || p.order_no || '—')
                : fmtNum(p.stock);
            const col6Class = SAP_LIVE && MODE === 'sales' ? '' : stockClass;
            return `<tr class="row-animate" style="animation-delay:${i * 0.06}s">
                <td class="product-name">${escapeHtml(p.name)}</td>
                <td><span class="category-tag">${escapeHtml(p.category)}</span></td>
                <td>${fmtMoney(p.price)}</td>
                <td>${col3}</td>
                <td class="revenue-cell">${col4}</td>
                <td class="${col6Class}">${col6}</td>
            </tr>`;
        }).join('');
    }

    function escapeHtml(str) {
        const el = document.createElement('span');
        el.textContent = str;
        return el.innerHTML;
    }

    function updateCharts(data) {
        const labels = data.chartSeries.labels;
        const values = data.chartSeries.values;
        const counts = data.chartSeries.counts;
        const catLabels = Object.keys(data.categoryRevenue);
        const catValues = Object.values(data.categoryRevenue);

        let barItems;
        if (MODE === 'inventory') {
            barItems = [...data.productStats].sort((a, b) => a.stock - b.stock).slice(0, 6);
        } else {
            barItems = [...data.productStats].filter(p => p.units_sold > 0).sort((a, b) => b.units_sold - a.units_sold).slice(0, 6);
        }

        document.querySelectorAll('.chart-wrap').forEach(w => w.classList.add('loading'));

        revenueChart.data.labels = labels;
        revenueChart.data.datasets[0].data = values;
        revenueChart.data.datasets[0].pointRadius = labels.length > 20 ? 0 : 5;
        revenueChart.data.datasets[0].pointHoverRadius = labels.length > 20 ? 5 : 8;
        revenueChart.update('active');

        categoryChart.data.labels = catLabels;
        categoryChart.data.datasets[0].data = catValues;
        categoryChart.update('active');

        productsBarChart.data.labels = barItems.map(p => p.name);
        productsBarChart.data.datasets[0].data = barItems.map(p => MODE === 'inventory' ? p.stock : p.units_sold);
        productsBarChart.update('active');

        ordersChart.data.labels = labels;
        ordersChart.data.datasets[0].data = counts;
        ordersChart.data.datasets[0].borderRadius = labels.length > 20 ? 2 : 8;
        ordersChart.update('active');

        setTimeout(() => document.querySelectorAll('.chart-wrap').forEach(w => w.classList.remove('loading')), 760);
    }

    function showLoadingBar() {
        const bar = document.getElementById('loadingBar');
        bar.classList.remove('done');
        bar.classList.add('active');
    }
    function hideLoadingBar() {
        document.getElementById('loadingBar').classList.add('done');
        setTimeout(() => document.getElementById('loadingBar').classList.remove('active', 'done'), 350);
    }
    function pulseChartCards() {
        document.querySelectorAll('.card').forEach(c => {
            c.classList.remove('chart-refresh');
            void c.offsetWidth;
            c.classList.add('chart-refresh');
            setTimeout(() => c.classList.remove('chart-refresh'), 400);
        });
    }

    function runDateFilter(fromStr, toStr) {
        const from = fromStr || document.getElementById('dateFrom')?.value;
        const to = toStr || document.getElementById('dateTo')?.value;
        const data = getFilteredData(from, to);
        if (!data) { alert('Start date must be before end date.'); return; }

        showLoadingBar();

        const badge = document.getElementById('periodLabel');
        if (badge) {
            badge.innerHTML = `<span class="material-icons-round">date_range</span>${formatPeriodLabel(data.from, data.to)}`;
            badge.classList.remove('updated');
            void badge.offsetWidth;
            badge.classList.add('updated');
        }

        updateKPIs(data);
        updateTable(data);
        updateCharts(data);
        pulseChartCards();
        hideLoadingBar();
    }

    const TREND = '#0284c7';
    const STYLES = '#d97706';
    const CHANNEL = '#0d9488';

    revenueChart = new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Value',
                data: [],
                borderColor: TREND,
                backgroundColor: 'rgba(2, 132, 199, 0.16)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#fff',
                pointBorderColor: TREND,
                pointBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: chartAnim,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => DATA.currencySymbol + v.toLocaleString() }, grid: { color: 'rgba(0,0,0,0.04)' } },
                x: { grid: { display: false } }
            }
        }
    });

    categoryChart = new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: MD_COLORS,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 12,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '64%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutQuart'
            },
            plugins: { legend: { position: 'bottom', labels: { padding: 14, boxWidth: 12 } } }
        }
    });

    productsBarChart = new Chart(document.getElementById('productsBarChart'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: MODE === 'inventory' ? 'Stock' : 'Units',
                data: [],
                backgroundColor: 'rgba(217, 119, 6, 0.85)',
                borderColor: STYLES,
                borderWidth: 1,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            animation: chartAnim,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, y: { grid: { display: false } } }
        }
    });

    ordersChart = new Chart(document.getElementById('ordersChart'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Count',
                data: [],
                backgroundColor: 'rgba(13, 148, 136, 0.85)',
                borderColor: CHANNEL,
                borderWidth: 1,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: chartAnim,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
                x: { grid: { display: false } }
            }
        }
    });

    window.addEventListener('evolv:periodchange', (e) => {
        const { from, to } = e.detail || {};
        if (!from || !to) return;
        const df = document.getElementById('dateFrom');
        const dt = document.getElementById('dateTo');
        if (df) df.value = from;
        if (dt) dt.value = to;
        clearTimeout(filterTimer);
        filterTimer = setTimeout(() => runDateFilter(from, to), 50);
    });

    // Initial load (header also emits this_month)
    const now = new Date();
    const initFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const initToDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const initTo = `${initToDate.getFullYear()}-${String(initToDate.getMonth() + 1).padStart(2, '0')}-${String(initToDate.getDate()).padStart(2, '0')}`;
    const df = document.getElementById('dateFrom');
    const dt = document.getElementById('dateTo');
    if (df) df.value = initFrom;
    if (dt) dt.value = initTo;
    runDateFilter(initFrom, initTo);
})();
</script>
<?php
$extraScripts = ob_get_clean();
?>
        <input type="hidden" id="dateFrom" value="<?= e($defaultFrom) ?>">
        <input type="hidden" id="dateTo" value="<?= e($defaultTo) ?>">

        <?php if ($sapLive): ?>
        <?php elseif ($sapError): ?>
        <div class="sap-banner warn anim-up">
            <span class="material-icons-round">cloud_off</span>
            <div>
                <strong>SAP connection unavailable</strong>
                <span><?= e($sapError) ?> Showing sample dashboard data.</span>
            </div>
        </div>
        <?php endif; ?>

        <div class="kapis-dash-banner" style="--dash-color: <?= e($cfg['primary'] ?? '#1b5e4b') ?>">
            <span class="material-icons-round"><?= e($cfg['nav_icon'] ?? 'dashboard') ?></span>
            <div>
                <strong><?= e($cfg['title'] ?? 'Dashboard') ?></strong>
                <p><?= e($cfg['subtitle'] ?? '') ?></p>
            </div>
        </div>

        <div class="kpi-grid">
            <?php
            $toneCycle = ['sky', 'mint', 'amber', 'violet', 'rose', 'teal'];
            $toneMap = ['blue' => 'sky', 'green' => 'mint', 'orange' => 'amber', 'purple' => 'violet'];
            foreach ($cfg['kpis'] as $i => $kpi):
                $tone = $toneMap[$kpi['color'] ?? ''] ?? $toneCycle[$i % count($toneCycle)];
            ?>
            <div class="kpi-card proj-card tone-<?= e($tone) ?> fade-up" role="button" tabindex="0" data-kpi="<?= e($kpi['key']) ?>">
                <div class="kpi-icon">
                    <span class="material-icons-round"><?= htmlspecialchars($kpi['icon']) ?></span>
                </div>
                <div class="kpi-info">
                    <div class="label"><?= htmlspecialchars($kpi['label']) ?></div>
                    <div class="value" id="<?= htmlspecialchars($kpi['key']) ?>">—</div>
                    <div class="change" id="<?= htmlspecialchars($kpi['key']) ?>Note"></div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <?php if (!empty($cfg['highlights'])): ?>
        <div class="highlights-grid">
            <?php foreach ($cfg['highlights'] as $h): ?>
            <div class="highlight-card fade-up">
                <span class="material-icons-round"><?= htmlspecialchars($h['icon']) ?></span>
                <div>
                    <strong><?= htmlspecialchars($h['title']) ?></strong>
                    <p><?= htmlspecialchars($h['text']) ?></p>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <?php if (!empty($cfg['alerts']) || !empty($cfg['channels'])): ?>
        <div class="info-split">
            <?php if (!empty($cfg['alerts'])): ?>
            <div class="card proj-panel fade-up">
                <div class="card-header">
                    <span class="material-icons-round">notifications_active</span>
                    <h2>Alerts & Insights</h2>
                </div>
                <ul class="alert-list">
                    <?php foreach ($cfg['alerts'] as $a): ?>
                    <li class="alert-item <?= htmlspecialchars($a['type']) ?>">
                        <span class="material-icons-round"><?= $a['type'] === 'warn' ? 'warning' : ($a['type'] === 'ok' ? 'check_circle' : 'info') ?></span>
                        <?= htmlspecialchars($a['text']) ?>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>

            <?php if (!empty($cfg['channels'])): ?>
            <div class="card proj-panel fade-up">
                <div class="card-header">
                    <span class="material-icons-round">pie_chart</span>
                    <h2>Share Breakdown</h2>
                </div>
                <div class="channel-list">
                    <?php foreach ($cfg['channels'] as $ch): ?>
                    <div class="channel-row">
                        <div class="channel-meta">
                            <span><?= htmlspecialchars($ch['name']) ?></span>
                            <strong><?= (int) $ch['share'] ?>%</strong>
                        </div>
                        <div class="channel-bar"><span style="width:<?= (int) $ch['share'] ?>%"></span></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <div class="charts-grid">
            <div class="card chart-panel tone-sky fade-up">
                <div class="chart-panel-head">
                    <span class="chart-panel-icon"><span class="material-icons-round"><?= htmlspecialchars($cfg['charts']['main']['icon']) ?></span></span>
                    <div>
                        <h2><?= htmlspecialchars($cfg['charts']['main']['title']) ?></h2>
                        <p>Period performance</p>
                    </div>
                </div>
                <div class="chart-wrap tall"><canvas id="revenueChart"></canvas></div>
            </div>
            <div class="card chart-panel tone-violet fade-up">
                <div class="chart-panel-head">
                    <span class="chart-panel-icon"><span class="material-icons-round"><?= htmlspecialchars($cfg['charts']['pie']['icon']) ?></span></span>
                    <div>
                        <h2><?= htmlspecialchars($cfg['charts']['pie']['title']) ?></h2>
                        <p>Share breakdown</p>
                    </div>
                </div>
                <div class="chart-wrap tall"><canvas id="categoryChart"></canvas></div>
            </div>
        </div>

        <div class="charts-row">
            <div class="card chart-panel tone-amber fade-up">
                <div class="chart-panel-head">
                    <span class="chart-panel-icon"><span class="material-icons-round"><?= htmlspecialchars($cfg['charts']['bar']['icon']) ?></span></span>
                    <div>
                        <h2><?= htmlspecialchars($cfg['charts']['bar']['title']) ?></h2>
                        <p>Top contributors</p>
                    </div>
                </div>
                <div class="chart-wrap"><canvas id="productsBarChart"></canvas></div>
            </div>
            <div class="card chart-panel tone-mint fade-up">
                <div class="chart-panel-head">
                    <span class="chart-panel-icon"><span class="material-icons-round"><?= htmlspecialchars($cfg['charts']['orders']['icon']) ?></span></span>
                    <div>
                        <h2><?= htmlspecialchars($cfg['charts']['orders']['title']) ?></h2>
                        <p>Volume by period</p>
                    </div>
                </div>
                <div class="chart-wrap"><canvas id="ordersChart"></canvas></div>
            </div>
        </div>

        <div class="card proj-panel fade-up">
            <div class="card-header">
                <span class="material-icons-round"><?= htmlspecialchars($cfg['table']['icon']) ?></span>
                <h2><?= htmlspecialchars($cfg['table']['title']) ?></h2>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <?php foreach ($cfg['table']['headers'] as $h): ?>
                                <th><?= htmlspecialchars($h) ?></th>
                            <?php endforeach; ?>
                        </tr>
                    </thead>
                    <tbody id="productTableBody"></tbody>
                </table>
            </div>
        </div>

        <?php if (!empty($cfg['recent'])): ?>
        <div class="card proj-panel fade-up">
            <div class="card-header">
                <span class="material-icons-round"><?= htmlspecialchars($cfg['recent']['icon']) ?></span>
                <h2><?= htmlspecialchars($cfg['recent']['title']) ?></h2>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <?php foreach ($cfg['recent']['headers'] as $h): ?>
                                <th><?= htmlspecialchars($h) ?></th>
                            <?php endforeach; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($cfg['recent']['rows'] as $i => $row): ?>
                        <tr class="row-animate" style="animation-delay:<?= $i * 0.05 ?>s">
                            <?php foreach ($row as $cell): ?>
                                <td><?= htmlspecialchars($cell) ?></td>
                            <?php endforeach; ?>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>
