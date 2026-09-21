/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 07/09/2026
 * DESCRIPTION : Material hub — colorful live ZI_MaterialAPI_HUB UI
 */
(function () {
    const cfg = window.MATERIAL_PAGE || {};
    const PALETTE = ['#0f766e', '#c2410c', '#b45309', '#047857', '#0284c7', '#ca8a04', '#be123c', '#0d9488'];

    let currentPage = 1;
    let pageSize = cfg.pageSize || 25;
    let currentFrom = '';
    let currentTo = '';
    let loading = false;
    let lastPayload = null;
    let counterTimers = {};
    let loaderTimer = null;
    let loaderStarted = 0;
    let trendChart, plantChart, topChart, groupChart, statusChart;

    const hub = document.getElementById('materialHub');
    const loaderNote = document.getElementById('materialLoaderNote');
    const tbody = document.getElementById('materialTableBody');
    const rangeInfo = document.getElementById('materialRangeInfo');
    const prevBtn = document.getElementById('materialPrev');
    const nextBtn = document.getElementById('materialNext');
    const searchInput = document.getElementById('materialSearch');
    const pageSizeSelect = document.getElementById('materialPageSize');
    const drawer = document.getElementById('materialDetailDrawer');
    const backdrop = document.getElementById('materialDetailBackdrop');
    const detailTitle = document.getElementById('materialDetailTitle');
    const detailBody = document.getElementById('materialDetailBody');
    const closeBtn = document.getElementById('materialDetailClose');

    if (backdrop && backdrop.parentElement !== document.body) {
        document.body.appendChild(backdrop);
    }
    if (drawer && drawer.parentElement !== document.body) {
        document.body.appendChild(drawer);
    }

    /*
     * Format number method
     */
    function fmtNum(n) {
        return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
    }

    /*
     * Escape HTML method
     */
    function escapeHtml(str) {
        const el = document.createElement('span');
        el.textContent = String(str ?? '');
        return el.innerHTML;
    }

    /*
     * Color set method
     */
    function colorSet(n) {
        return Array.from({ length: n }, (_, i) => PALETTE[i % PALETTE.length]);
    }

    /*
     * Show loader method
     */
    function showLoader(active) {
        const loader = document.getElementById('materialLoader');
        if (hub) hub.classList.toggle('is-loading', active);
        document.documentElement.classList.toggle('sales-is-loading', active);
        document.body.classList.toggle('sales-is-loading', active);
        document.body.classList.toggle('sales-launch-loading', active);
        const splash = document.getElementById('kapisSplash');
        if (active && splash) {
            splash.classList.add('is-done');
            splash.setAttribute('hidden', '');
        }
        if (loader) {
            loader.classList.toggle('is-on', active);
            loader.classList.toggle('sales-loader--launch', active);
            if (active && loader.parentElement !== document.documentElement) {
                document.documentElement.appendChild(loader);
            }
        }
        if (loaderTimer) {
            clearInterval(loaderTimer);
            loaderTimer = null;
        }
        if (!active) return;
        loaderStarted = Date.now();
        if (loaderNote) loaderNote.textContent = 'Loading material master…';
        loaderTimer = setInterval(() => {
            const secs = Math.round((Date.now() - loaderStarted) / 1000);
            if (!loaderNote) return;
            loaderNote.textContent = secs < 3
                ? 'Loading material master…'
                : `Fetching ZI_MaterialAPI_HUB… ${secs}s`;
        }, 400);
    }

    /*
     * Animate value method
     */
    function animateValue(el, endValue, formatter, duration = 700) {
        if (!el) return;
        const id = el.id;
        if (counterTimers[id]) cancelAnimationFrame(counterTimers[id]);
        const startValue = Number(el.dataset.lastValue) || 0;
        el.dataset.lastValue = String(endValue);
        const startTime = performance.now();
        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (endValue - startValue) * eased;
            el.textContent = formatter(current);
            if (progress < 1) counterTimers[id] = requestAnimationFrame(tick);
            else el.textContent = formatter(endValue);
        }
        counterTimers[id] = requestAnimationFrame(tick);
    }

    /*
     * Status class method
     */
    function statusClass(status) {
        const s = String(status || '').toLowerCase();
        if (s.includes('delete')) return 'is-warn';
        if (s.includes('active') || s === 'dl') return 'is-open';
        return 'is-done';
    }

    /*
     * Update KPIs method
     */
    function updateKpis(summary) {
        if (!summary) return;
        animateValue(document.getElementById('mkProducts'), summary.products || 0, v => fmtNum(v));
        animateValue(document.getElementById('mkPlants'), summary.plants || 0, v => fmtNum(v));
        animateValue(document.getElementById('mkTypes'), summary.product_types || 0, v => fmtNum(v));
        animateValue(document.getElementById('mkGroups'), summary.product_groups || 0, v => fmtNum(v));
        animateValue(document.getElementById('mkBrands'), summary.brands || 0, v => fmtNum(v));
        animateValue(document.getElementById('mkBatch'), summary.batch_rate || 0, v => v.toFixed(1) + '%');
        const note = document.getElementById('mkProductsNote');
        if (note) note.textContent = `${fmtNum(summary.lines || 0)} plant lines`;
        const plantNote = document.getElementById('mkPlantsNote');
        if (plantNote) plantNote.textContent = `${fmtNum(summary.locations || 0)} storage locations`;
    }

    /*
     * Update range method
     */
    function updateRange(data) {
        const total = Number(data?.total || 0);
        const page = Number(data?.page || 1);
        const per = Number(data?.per_page || pageSize);
        const start = total === 0 ? 0 : ((page - 1) * per) + 1;
        const end = Math.min(page * per, total);
        if (rangeInfo) {
            rangeInfo.textContent = total === 0
                ? 'Showing 0 of 0 — ZI_MaterialAPI_HUB'
                : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} — ZI_MaterialAPI_HUB`;
        }
        if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
        if (nextBtn) nextBtn.disabled = !data || page >= Number(data.pages || 1) || total === 0;
    }

    /*
     * Make chart method
     */
    function makeChart(canvasId, type, data, options) {
        const el = document.getElementById(canvasId);
        if (!el || typeof Chart === 'undefined') return null;
        return new Chart(el, { type, data, options });
    }

    /*
     * Chart count options method
     */
    function chartCountOpts() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900, easing: 'easeOutQuart' },
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(28,25,23,0.06)' } },
                x: { grid: { display: false } },
            },
        };
    }

    /*
     * Initialize charts method
     */
    function initCharts() {
        trendChart = makeChart('mkTrendChart', 'line', {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#b45309',
                backgroundColor: 'rgba(180,83,9,0.18)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#b45309',
                pointBorderWidth: 2,
            }],
        }, chartCountOpts());

        plantChart = makeChart('mkPlantChart', 'doughnut', {
            labels: [],
            datasets: [{ data: [], backgroundColor: PALETTE, borderWidth: 3, borderColor: '#fff', hoverOffset: 10 }],
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } } },
        });

        topChart = makeChart('mkTopChart', 'bar', {
            labels: [],
            datasets: [{ data: [], backgroundColor: PALETTE, borderRadius: 8 }],
        }, chartCountOpts());

        groupChart = makeChart('mkGroupChart', 'doughnut', {
            labels: [],
            datasets: [{ data: [], backgroundColor: PALETTE, borderWidth: 3, borderColor: '#fff' }],
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
        });

        statusChart = makeChart('mkStatusChart', 'doughnut', {
            labels: [],
            datasets: [{ data: [], backgroundColor: PALETTE, borderWidth: 3, borderColor: '#fff' }],
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
        });
    }

    /*
     * Set doughnut method
     */
    function setDoughnut(chart, series) {
        if (!chart) return;
        const labels = series?.labels || [];
        const values = series?.values || [];
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.data.datasets[0].backgroundColor = colorSet(labels.length || 1);
        chart.update();
    }

    /*
     * Render board method
     */
    function renderBoard(el, series) {
        if (!el) return;
        const labels = series?.labels || [];
        const values = (series?.values || []).map(Number);
        if (!labels.length) {
            el.innerHTML = '<div class="mat-empty">No data in period</div>';
            return;
        }
        const max = Math.max(...values, 1);
        el.innerHTML = labels.slice(0, 6).map((label, i) => {
            const val = values[i] || 0;
            const pct = Math.max(6, Math.round((val / max) * 100));
            return `
                <div class="mat-rank-row">
                    <b>${i + 1}</b>
                    <span title="${escapeHtml(label)}">${escapeHtml(label)}</span>
                    <em>${fmtNum(val)}</em>
                    <div class="mat-rank-bar"><i style="width:${pct}%"></i></div>
                </div>
            `;
        }).join('');
    }

    /*
     * Update charts method
     */
    function updateCharts(charts) {
        const trend = charts?.trend || {};
        const plants = charts?.plants || charts?.mix || {};
        const tops = charts?.groups || charts?.top_styles || {};
        const types = charts?.types || {};
        const brands = charts?.brands || {};

        if (trendChart) {
            const labels = trend.labels || [];
            trendChart.data.labels = labels;
            trendChart.data.datasets[0].data = trend.values || [];
            trendChart.data.datasets[0].pointRadius = labels.length > 20 ? 0 : 4;
            trendChart.update();
        }

        setDoughnut(plantChart, plants);
        setDoughnut(groupChart, types);
        setDoughnut(statusChart, brands);

        if (topChart) {
            const labels = (tops.labels || []).slice(0, 8);
            topChart.data.labels = labels;
            topChart.data.datasets[0].data = (tops.values || []).slice(0, 8);
            topChart.data.datasets[0].backgroundColor = colorSet(labels.length || 1);
            topChart.update();
        }

        renderBoard(document.getElementById('matPlantBoard'), plants);
        renderBoard(document.getElementById('matMaterialBoard'), tops);
        renderBoard(document.getElementById('matDivisionBoard'), brands);
    }

    /*
     * Group rows method
     */
    function groupRows(title, rows) {
        return `
            <div class="sales-detail-group">
                <h4>${escapeHtml(title)}</h4>
                ${rows.map(([label, value]) => `
                    <div class="sales-detail-row">
                        <span>${escapeHtml(label)}</span>
                        <strong>${escapeHtml(value)}</strong>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /*
     * Open detail method
     */
    function openDetail(record) {
        if (!record || !drawer) return;
        if (detailTitle) {
            detailTitle.textContent = `${record.product || 'Product'} · ${record.plant || '—'}`;
        }
        if (detailBody) {
            detailBody.innerHTML = `
                <div class="sales-detail-hero mat-detail-hero">
                    <div><em>Product</em><b>${escapeHtml(record.product || '—')}</b></div>
                    <div><em>Plant</em><b>${escapeHtml(record.plant || '—')}</b></div>
                    <div><em>Brand</em><b>${escapeHtml(record.brand || '—')}</b></div>
                </div>
                ${groupRows('Product', [
                    ['Product name', record.product_name || '—'],
                    ['Product type', record.product_type || '—'],
                    ['Product group', record.product_group || '—'],
                    ['Product category', record.product_category || '—'],
                    ['External ID', record.product_external || '—'],
                ])}
                ${groupRows('Plant & storage', [
                    ['Plant', record.plant || '—'],
                    ['Storage location', record.storage_location || '—'],
                    ['Storage bin', record.storage_bin || '—'],
                    ['Division', (record.division_label || record.division || '—')],
                    ['Base unit', record.base_unit || '—'],
                ])}
                ${groupRows('Attributes', [
                    ['Brand', record.brand || '—'],
                    ['Gross weight', `${fmtNum(record.gross_weight)} ${record.weight_unit || ''}`.trim()],
                    ['Net weight', `${fmtNum(record.net_weight)} ${record.weight_unit || ''}`.trim()],
                    ['Batch managed', record.batch_managed ? 'Yes' : 'No'],
                    ['Country of origin', record.country_of_origin || '—'],
                ])}
                ${groupRows('Status & dates', [
                    ['Status', record.status || '—'],
                    ['Maintenance status', record.maintenance_status || '—'],
                    ['Sales status', record.sales_status || '—'],
                    ['Creation date', record.date || '—'],
                    ['Last change', record.changed_date || '—'],
                    ['Valid from', record.valid_from || '—'],
                    ['Valid to', record.valid_to || '—'],
                    ['Marked for deletion', record.is_deleted ? 'Yes' : 'No'],
                ])}
            `;
        }

        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        if (backdrop) backdrop.hidden = false;
        document.body.classList.add('sales-detail-open');
    }

    /*
     * Close detail method
     */
    function closeDetail() {
        drawer?.classList.remove('open');
        drawer?.setAttribute('aria-hidden', 'true');
        if (backdrop) backdrop.hidden = true;
        document.body.classList.remove('sales-detail-open');
        tbody?.querySelectorAll('tr.is-selected').forEach((row) => row.classList.remove('is-selected'));
    }

    function renderRows(records) {
        if (!tbody) return;
        if (!records.length) {
            const html = (typeof window.kapisEmptyHtml === 'function')
                ? window.kapisEmptyHtml('No data found', 'No material master lines in this period.')
                : '<div class="empty-state mat-empty">No material master lines in this period</div>';
            tbody.innerHTML = `<tr><td colspan="10" class="empty-state mat-empty">${html}</td></tr>`;
            return;
        }
        tbody.innerHTML = records.map((r, idx) => `
            <tr data-row-index="${idx}" tabindex="0" role="button" aria-label="Open product ${escapeHtml(r.product || '')}">
                <td>
                    <span class="style-name">${escapeHtml(r.product)}</span>
                    <span class="style-meta">${escapeHtml(r.product_name || '')}</span>
                </td>
                <td>${escapeHtml(r.product_type || '—')}</td>
                <td>${escapeHtml(r.product_group || '—')}</td>
                <td><span class="mat-plant-tag">${escapeHtml(r.plant || '—')}</span></td>
                <td>${escapeHtml(r.storage_location || '—')}</td>
                <td>${escapeHtml(r.brand || '—')}</td>
                <td>${escapeHtml(r.division_label || r.division || '—')}</td>
                <td>${escapeHtml(r.base_unit || '—')}</td>
                <td>${escapeHtml(r.date || '—')}</td>
                <td><span class="mat-status ${statusClass(r.status)}">${escapeHtml(r.status || '—')}</span></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('tr[data-row-index]').forEach((row) => {
            const open = () => {
                const idx = Number(row.dataset.rowIndex);
                const record = records[idx];
                if (!record) return;
                tbody.querySelectorAll('tr.is-selected').forEach((r) => r.classList.remove('is-selected'));
                row.classList.add('is-selected');
                openDetail(record);
            };
            row.addEventListener('click', open);
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
        });
    }

    async function fetchPage(page = 1) {
        if (loading || !cfg.apiUrl) return;
        loading = true;
        showLoader(true, !lastPayload);
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="empty-state">Loading…</td></tr>';

        const params = new URLSearchParams({
            page: String(page),
            per_page: String(pageSize),
            q: searchInput?.value?.trim() || '',
            from: currentFrom,
            to: currentTo,
            _: String(Date.now()),
        });

        try {
            const fetcher = window.kapisFetch || fetch;
            const res = await fetcher(`${cfg.apiUrl}?${params.toString()}`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
                credentials: 'same-origin',
            });
            const raw = await res.text();
            let data;
            try {
                data = JSON.parse(raw);
            } catch (_) {
                throw new Error(/^\s*</.test(raw)
                    ? 'Material API returned HTML instead of JSON.'
                    : 'Material API returned invalid JSON.');
            }
            if (!res.ok || data.error) {
                throw new Error(data.error || `Failed to load (${res.status})`);
            }
            lastPayload = data;
            currentPage = data.page;
            renderRows(data.records || []);
            updateKpis(data.summary);
            updateCharts(data.charts || {});
            updateRange(data);
        } catch (err) {
            if (tbody) {
                const html = (typeof window.kapisEmptyHtml === 'function')
                    ? window.kapisEmptyHtml('No data found', err.message || 'Unable to load materials from SAP.')
                    : `<div class="empty-state">${escapeHtml(err.message)}</div>`;
                tbody.innerHTML = `<tr><td colspan="10" class="empty-state">${html}</td></tr>`;
            }
            updateRange({ total: 0, page: 1, per_page: pageSize, pages: 1 });
            if (loaderNote) loaderNote.textContent = err.message;
        } finally {
            loading = false;
            showLoader(false);
        }
    }

    function bindUi() {
        prevBtn?.addEventListener('click', () => {
            if (currentPage > 1) fetchPage(currentPage - 1);
        });
        nextBtn?.addEventListener('click', () => {
            if (lastPayload && currentPage < lastPayload.pages) fetchPage(currentPage + 1);
        });
        closeBtn?.addEventListener('click', closeDetail);
        backdrop?.addEventListener('click', closeDetail);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDetail();
        });

        let searchTimer;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => fetchPage(1), 300);
        });
        pageSizeSelect?.addEventListener('change', () => {
            pageSize = parseInt(pageSizeSelect.value, 10) || 25;
            fetchPage(1);
        });

        window.addEventListener('evolv:periodchange', (e) => {
            const { from, to } = e.detail || {};
            if (!from || !to) return;
            if (from === currentFrom && to === currentTo && lastPayload) return;
            currentFrom = from;
            currentTo = to;
            fetchPage(1);
        });
    }

    function boot() {
        bindUi();
        initCharts();
        document.body.classList.add('sales-launch-loading');
        showLoader(true, true);

        const now = new Date();
        currentFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const initToDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        currentTo = `${initToDate.getFullYear()}-${String(initToDate.getMonth() + 1).padStart(2, '0')}-${String(initToDate.getDate()).padStart(2, '0')}`;
        fetchPage(1);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
