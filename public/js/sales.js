/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 04/09/2026
 * DESCRIPTION : Sales hub — colorful charts, loader, and detail dashboards
 */
(function () {
    const cfg = window.SALES_PAGE || {};
    const symbol = cfg.currencySymbol || '$';
    const PALETTE = ['#6366f1', '#f43f5e', '#22d3ee', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#a855f7'];

    let currentPage = 1;
    let pageSize = cfg.pageSize || 25;
    let currentFrom = '';
    let currentTo = '';
    let loading = false;
    let lastPayload = null;
    let counterTimers = {};
    let loaderTimer = null;
    let loaderStarted = 0;

    let trendChart, divisionChart, stylesChart, channelChart, statusChart;

    const hub = document.getElementById('salesHub');
    const loaderNote = document.getElementById('salesLoaderNote');
    const tbody = document.getElementById('salesTableBody');
    const rangeInfo = document.getElementById('salesRangeInfo');
    const prevBtn = document.getElementById('salesPrev');
    const nextBtn = document.getElementById('salesNext');
    const searchInput = document.getElementById('salesSearch');
    const pageSizeSelect = document.getElementById('salesPageSize');
    const exportWrap = document.getElementById('salesExport');
    const exportBtn = document.getElementById('salesExportBtn');
    const exportMenu = document.getElementById('salesExportMenu');
    const drawer = document.getElementById('salesDetailDrawer');
    const backdrop = document.getElementById('salesDetailBackdrop');
    const detailTitle = document.getElementById('salesDetailTitle');
    const detailBody = document.getElementById('salesDetailBody');
    const closeBtn = document.getElementById('salesDetailClose');
    const periodBadge = document.getElementById('salesPeriodBadge');
    const liveCount = document.getElementById('salesLiveCount');

    if (backdrop && backdrop.parentElement !== document.body) {
        document.body.appendChild(backdrop);
    }
    if (drawer && drawer.parentElement !== document.body) {
        document.body.appendChild(drawer);
    }

    const chartAnim = {
        duration: 1100,
        easing: 'easeOutQuart',
        delay(ctx) {
            if (ctx.type === 'data' && ctx.mode === 'default') {
                return ctx.dataIndex * 45;
            }
            return 0;
        },
    };

    function fmtMoney(n) {
        return symbol + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fmtNum(n) {
        return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
    }

    function statusClass(status) {
        const s = String(status || '').toLowerCase();
        if (s.includes('complete') || s.includes('closed') || s.includes('done')) return 'is-done';
        if (s.includes('return') || s.includes('cancel') || s.includes('block')) return 'is-warn';
        return 'is-open';
    }

    function escapeHtml(str) {
        const el = document.createElement('span');
        el.textContent = String(str ?? '');
        return el.innerHTML;
    }

    function colorAt(i) {
        return PALETTE[i % PALETTE.length];
    }

    function colorSet(n) {
        return Array.from({ length: n }, (_, i) => colorAt(i));
    }

    function showSalesLoader(active, opts = {}) {
        if (!hub) return;
        const loader = document.getElementById('salesLoader');
        const launch = opts.launch !== false && (opts.launch === true || !lastPayload);
        hub.classList.toggle('is-loading', active);
        document.body.classList.toggle('sales-launch-loading', active && launch);
        if (loader) {
            loader.classList.toggle('sales-loader--launch', active && launch);
            // Keep launch overlay above the app chrome (header/nav).
            if (active && launch && loader.parentElement !== document.body) {
                document.body.appendChild(loader);
            } else if (!active && loader.parentElement === document.body && hub) {
                hub.insertBefore(loader, hub.firstChild);
            }
        }
        if (loaderTimer) {
            clearInterval(loaderTimer);
            loaderTimer = null;
        }
        if (!active) {
            return;
        }
        loaderStarted = Date.now();
        if (loaderNote) loaderNote.textContent = 'Loading sales data…';
        loaderTimer = setInterval(() => {
            const secs = Math.round((Date.now() - loaderStarted) / 1000);
            if (!loaderNote) return;
            if (secs < 3) {
                loaderNote.textContent = 'Loading sales data…';
            } else if (secs < 8) {
                loaderNote.textContent = 'Fetching SAP order lines…';
            } else {
                loaderNote.textContent = `Still loading… ${secs}s`;
            }
        }, 400);
    }

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
            if (progress < 1) {
                counterTimers[id] = requestAnimationFrame(tick);
            } else {
                el.textContent = formatter(endValue);
            }
        }
        counterTimers[id] = requestAnimationFrame(tick);
    }

    function applyFilter(value) {
        const term = String(value || '').replace(/^SO\s+/i, '').trim();
        if (!term || !searchInput) return;
        searchInput.value = term;
        fetchPage(1);
    }

    function clickFilter(chart) {
        return (evt, elements) => {
            if (!elements.length) return;
            const label = chart.data.labels[elements[0].index];
            applyFilter(label);
        };
    }

    function renderBoard(el, series, colors) {
        if (!el) return;
        const labels = series?.labels || [];
        const values = (series?.values || []).map(Number);
        const total = values.reduce((s, v) => s + v, 0);
        if (!labels.length || (labels[0] === 'No data' && !total)) {
            el.innerHTML = '<p class="empty-state">No data</p>';
            return;
        }
        el.innerHTML = labels.map((label, i) => {
            const value = values[i] || 0;
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            const color = colors[i] || colorAt(i);
            return `
                <button type="button" data-filter="${escapeHtml(label)}">
                    <i class="sales-rank-dot" style="background:${color}"></i>
                    <div>
                        <div class="sales-rank-meta">
                            <span>${escapeHtml(label)}</span>
                            <span>${fmtMoney(value)}</span>
                        </div>
                        <div class="sales-rank-bar"><i style="width:${pct}%;background:${color}"></i></div>
                    </div>
                    <b>${pct}%</b>
                </button>
            `;
        }).join('');
        el.querySelectorAll('[data-filter]').forEach((btn) => {
            btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
        });
    }

    function renderBoards(charts) {
        renderBoard(document.getElementById('plantBoard'), charts.plants || charts.mix, PALETTE);
        renderBoard(document.getElementById('divisionBoard'), charts.divisions, ['#db2777', '#6366f1', '#f59e0b', '#10b981']);
        renderBoard(document.getElementById('statusBoard'), charts.statuses, ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e']);
        renderBoard(document.getElementById('materialBoard'), charts.top_styles, ['#f59e0b', '#f43f5e', '#7c3aed', '#2563eb', '#10b981', '#22d3ee']);
    }

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

    function openDetail(record) {
        if (!record || !drawer) return;
        const margin = Number(record.net_amount || 0) - Number(record.cost || 0);

        detailTitle.textContent = `${record.sales_order} · Line ${record.line_item}`;
        detailBody.innerHTML = `
            <div class="sales-detail-hero">
                <div><em>Net amount</em><b>${escapeHtml(fmtMoney(record.net_amount))}</b></div>
                <div><em>Quantity</em><b>${escapeHtml(fmtNum(record.qty) + (record.unit ? ` ${record.unit}` : ''))}</b></div>
                <div><em>Plant</em><b>${escapeHtml(record.plant || '—')}</b></div>
            </div>
            ${groupRows('Product', [
                ['Material', record.material],
                ['Originally requested', record.style],
                ['Material group', record.material_group || '—'],
                ['Division', record.division + (record.division_code ? ` (${record.division_code})` : '')],
                ['Item category', record.item_category || '—'],
            ])}
            ${groupRows('Commercial', [
                ['Unit price', fmtMoney(record.unit_price)],
                ['Cost amount', fmtMoney(record.cost)],
                ['Gross profit', fmtMoney(margin)],
                ['Currency', record.currency || 'USD'],
                ['Customer / PO', record.customer_ref || '—'],
            ])}
            ${groupRows('Logistics', [
                ['Shipping point', record.shipping_point || '—'],
                ['Sales district', record.sales_district || '—'],
                ['Customer group', record.customer_group || '—'],
                ['Delivery status', record.delivery_status || '—'],
                ['Return item', record.is_return ? 'Yes' : 'No'],
            ])}
            ${groupRows('Dates & status', [
                ['Status', record.status || '—'],
                ['Creation date', record.date || '—'],
                ['Billing date', record.billing_date || '—'],
                ['Pricing date', record.pricing_date || '—'],
                ['Created by', record.created_by || '—'],
            ])}
        `;

        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        if (backdrop) backdrop.hidden = false;
        document.body.classList.add('sales-detail-open');
    }

    function closeDetail() {
        drawer?.classList.remove('open');
        drawer?.setAttribute('aria-hidden', 'true');
        if (backdrop) backdrop.hidden = true;
        document.body.classList.remove('sales-detail-open');
    }

    function updateKpis(summary) {
        if (!summary) return;
        animateValue(document.getElementById('skNet'), summary.net_sales, v => fmtMoney(v));
        animateValue(document.getElementById('skQty'), summary.total_qty || 0, v => fmtNum(v));
        animateValue(document.getElementById('skOrders'), summary.orders || 0, v => fmtNum(v));
        animateValue(document.getElementById('skAvg'), summary.avg_line || 0, v => fmtMoney(v));
        animateValue(document.getElementById('skReturn'), summary.return_rate || 0, v => v.toFixed(1) + '%');
        animateValue(document.getElementById('skMargin'), summary.gross_margin || 0, v => v.toFixed(1) + '%');
        if (liveCount) {
            liveCount.innerHTML = `<span class="material-icons-round">receipt_long</span> ${fmtNum(summary.lines || 0)} lines`;
        }
    }

    function updateRange(data) {
        const total = Number(data?.total || 0);
        const page = Number(data?.page || 1);
        const per = Number(data?.per_page || pageSize);
        const start = total === 0 ? 0 : ((page - 1) * per) + 1;
        const end = Math.min(page * per, total);
        if (rangeInfo) {
            rangeInfo.textContent = total === 0
                ? 'Showing 0 of 0'
                : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`;
        }
        prevBtn && (prevBtn.disabled = page <= 1 || total === 0);
        nextBtn && (nextBtn.disabled = !data || page >= Number(data.pages || 1) || total === 0);
    }

    window.kapisKpiDetails = function (key) {
        const summary = lastPayload?.summary || {};
        const charts = lastPayload?.charts || {};
        const mix = charts.mix || charts.plants || {};
        const period = currentFrom && currentTo ? `${currentFrom} → ${currentTo}` : 'Selected period';
        const common = [
            ['Period', period],
            ['Net Sales', fmtMoney(summary.net_sales)],
            ['Order Quantity', fmtNum(summary.total_qty)],
            ['Sales Orders', fmtNum(summary.orders)],
            ['Order Lines', fmtNum(summary.lines || lastPayload?.total || 0)],
            ['Avg Line Value', fmtMoney(summary.avg_line)],
            ['Return Rate', Number(summary.return_rate || 0).toFixed(1) + '%'],
            ['Gross Margin', Number(summary.gross_margin || 0).toFixed(1) + '%'],
            ['Top plant', mix.labels?.[0] || '—'],
            ['Top material', charts.top_styles?.labels?.[0] || '—'],
        ];
        const card = document.querySelector(`.kpi-card[data-kpi="${key}"]`);
        const title = card?.querySelector('.label')?.textContent?.trim() || 'KPI details';
        const value = card?.querySelector('.value')?.textContent?.trim() || '—';
        const note = card?.querySelector('.change')?.textContent?.trim() || '';
        const icon = card?.querySelector('.kpi-icon .material-icons-round')?.textContent?.trim() || 'insights';
        const tone = [...(card?.classList || [])].find((c) => c.startsWith('tone-'))?.replace('tone-', '') || 'sky';
        return { title, value, note, icon, tone, rows: common };
    };

    function initCharts() {
        if (typeof Chart === 'undefined') return;

        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = '#e2e8f0';
        Chart.defaults.font.family = 'DM Sans, sans-serif';

        trendChart = new Chart(document.getElementById('salesTrendChart'), {
            type: 'line',
            data: { labels: [], datasets: [{
                label: 'Net Sales',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: (ctx) => {
                    const { chart } = ctx;
                    const { ctx: c, chartArea } = chart;
                    if (!chartArea) return 'rgba(99,102,241,0.2)';
                    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g.addColorStop(0, 'rgba(99,102,241,0.55)');
                    g.addColorStop(0.55, 'rgba(34,211,238,0.22)');
                    g.addColorStop(1, 'rgba(244,63,94,0.04)');
                    return g;
                },
                fill: true,
                tension: 0.38,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: PALETTE,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: chartAnim,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: v => symbol + Number(v).toLocaleString() } },
                    x: { grid: { display: false } },
                },
            },
        });

        divisionChart = new Chart(document.getElementById('salesDivisionChart'), {
            type: 'polarArea',
            data: { labels: [], datasets: [{ data: [], backgroundColor: PALETTE, borderWidth: 2, borderColor: '#fff' }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { animateRotate: true, animateScale: true, duration: 1200 },
                onClick: function (evt, els) { clickFilter(this)(evt, els); },
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 10, boxWidth: 10 } },
                },
                scales: { r: { ticks: { display: false }, grid: { color: 'rgba(99,102,241,0.12)' } } },
            },
        });

        stylesChart = new Chart(document.getElementById('salesStylesChart'), {
            type: 'bar',
            data: { labels: [], datasets: [{
                label: 'Net Amount',
                data: [],
                backgroundColor: PALETTE,
                borderRadius: 8,
            }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                animation: chartAnim,
                onClick: function (evt, els) { clickFilter(this)(evt, els); },
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { callback: v => symbol + Number(v).toLocaleString() } }, y: { grid: { display: false } } },
            },
        });

        channelChart = new Chart(document.getElementById('salesChannelChart'), {
            type: 'bar',
            data: { labels: [], datasets: [{
                label: 'Net Amount',
                data: [],
                backgroundColor: PALETTE.slice().reverse(),
                borderRadius: 10,
            }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: chartAnim,
                onClick: function (evt, els) { clickFilter(this)(evt, els); },
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: v => symbol + Number(v).toLocaleString() } },
                    x: { grid: { display: false } },
                },
            },
        });

        statusChart = new Chart(document.getElementById('salesStatusChart'), {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'], borderWidth: 3, borderColor: '#fff', hoverOffset: 10 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '58%',
                onClick: function (evt, els) { clickFilter(this)(evt, els); },
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10 } } },
            },
        });
    }

    function updateCharts(charts) {
        if (!charts || typeof Chart === 'undefined') return;

        if (trendChart && charts.trend) {
            trendChart.data.labels = charts.trend.labels || [];
            trendChart.data.datasets[0].data = charts.trend.values || [];
            trendChart.data.datasets[0].pointRadius = (charts.trend.labels || []).length > 20 ? 0 : 5;
            trendChart.update('active');
        }

        const mix = charts.plants && charts.plants.labels?.length > 1 ? charts.plants : (charts.mix || charts.division);
        if (divisionChart && mix) {
            const mixTitle = document.getElementById('salesMixTitle');
            const mixSub = document.getElementById('salesMixSubtitle');
            if (mixTitle) mixTitle.textContent = mix.title || 'Plant Mix';
            if (mixSub) mixSub.textContent = mix.subtitle || 'Click a slice to filter';
            divisionChart.data.labels = mix.labels || [];
            divisionChart.data.datasets[0].data = mix.values || [];
            divisionChart.data.datasets[0].backgroundColor = colorSet((mix.labels || []).length);
            divisionChart.update('active');
        }

        if (stylesChart && charts.top_styles) {
            stylesChart.data.labels = charts.top_styles.labels || [];
            stylesChart.data.datasets[0].data = charts.top_styles.values || [];
            stylesChart.data.datasets[0].backgroundColor = colorSet((charts.top_styles.labels || []).length);
            stylesChart.update('active');
        }

        const bar = charts.bar || charts.channels;
        if (channelChart && bar) {
            const barTitle = document.getElementById('salesBarTitle');
            const barSub = document.getElementById('salesBarSubtitle');
            if (barTitle && bar.title) barTitle.textContent = bar.title;
            if (barSub) barSub.textContent = bar.subtitle || 'Click a bar to filter';
            channelChart.data.labels = bar.labels || [];
            channelChart.data.datasets[0].data = bar.values || [];
            channelChart.data.datasets[0].backgroundColor = colorSet((bar.labels || []).length).reverse();
            channelChart.update('active');
        }

        if (statusChart && charts.statuses) {
            statusChart.data.labels = charts.statuses.labels || [];
            statusChart.data.datasets[0].data = charts.statuses.values || [];
            statusChart.update('active');
        }

        renderBoards(charts);
    }

    function renderRows(records) {
        if (!tbody) return;
        if (!records.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No records match your filters.</td></tr>';
            return;
        }

        tbody.innerHTML = records.map((r, i) => `
            <tr class="sales-row row-animate" data-id="${escapeHtml(r.id)}" tabindex="0" role="button" style="animation-delay:${Math.min(i, 12) * 0.03}s">
                <td><span class="so-id">${escapeHtml(r.sales_order)}</span></td>
                <td><span class="line-no">${escapeHtml(r.line_item)}</span></td>
                <td class="col-style">
                    <span class="style-name">${escapeHtml(r.material)}</span>
                    ${r.material_group && r.material_group !== '—' ? `<span class="style-meta">${escapeHtml(r.material_group)}</span>` : ''}
                </td>
                <td><span class="category-tag">${escapeHtml(r.plant || '—')}</span></td>
                <td><span class="category-tag">${escapeHtml(r.division)}</span></td>
                <td class="col-date">${escapeHtml(r.date)}</td>
                <td class="col-num">${fmtNum(r.qty)}</td>
                <td class="col-num revenue-cell">${fmtMoney(r.net_amount)}</td>
                <td><span class="sales-status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span></td>
                <td class="col-go"><span class="material-icons-round">chevron_right</span></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.sales-row').forEach((row, i) => {
            const record = records[i];
            row.addEventListener('click', () => openDetail(record));
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDetail(record);
                }
            });
        });
    }

    function showLoadingBar(active) {
        const bar = document.getElementById('loadingBar');
        if (!bar) return;
        bar.classList.toggle('active', active);
        if (!active) bar.classList.add('done');
    }

    async function fetchPage(page = 1) {
        if (loading || !cfg.apiUrl) return;
        loading = true;
        showLoadingBar(true);
        showSalesLoader(true, { launch: !lastPayload });
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
            const res = await fetch(`${cfg.apiUrl}?${params.toString()}`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
                credentials: 'same-origin',
            });
            const raw = await res.text();
            let data;
            try {
                data = JSON.parse(raw);
            } catch (_) {
                const looksHtml = /^\s*</.test(raw) || /<!DOCTYPE/i.test(raw);
                throw new Error(
                    looksHtml
                        ? 'Sales API returned HTML instead of JSON. Check nginx /KPIS/ routing.'
                        : 'Sales API returned invalid JSON.'
                );
            }

            if (!res.ok || data.error) {
                throw new Error(data.error || `Failed to load sales data (${res.status})`);
            }

            lastPayload = data;
            currentPage = data.page;
            renderRows(data.records || []);
            updateKpis(data.summary);
            updateCharts(data.charts || {});
            updateRange(data);
        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="empty-state">${escapeHtml(err.message)}</td></tr>`;
            updateRange({ total: 0, page: 1, per_page: pageSize, pages: 1 });
            if (loaderNote) loaderNote.textContent = err.message;
        } finally {
            loading = false;
            showSalesLoader(false);
            setTimeout(() => showLoadingBar(false), 300);
        }
    }

    function csvEscape(value) {
        const text = String(value ?? '');
        if (/[",\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    function recordsToCsv(records) {
        const header = ['Sales Order', 'Line', 'Material', 'Plant', 'Division', 'Date', 'Qty', 'Net Amount', 'Status', 'Category'];
        const lines = [header.join(',')];
        (records || []).forEach((r) => {
            lines.push([
                r.sales_order, r.line_item, r.material, r.plant, r.division,
                r.date, r.qty, r.net_amount, r.status, r.item_category,
            ].map(csvEscape).join(','));
        });
        return lines.join('\r\n');
    }

    function downloadCsv(filename, content) {
        const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function queryParams(extra = {}) {
        return new URLSearchParams({
            page: String(currentPage),
            per_page: String(pageSize),
            q: searchInput?.value?.trim() || '',
            from: currentFrom,
            to: currentTo,
            ...extra,
        });
    }

    async function exportCsv(mode) {
        if (!cfg.apiUrl) return;
        if (mode === 'page') {
            downloadCsv('kapis-order-lines-page.csv', recordsToCsv(lastPayload?.records || []));
            return;
        }
        const params = queryParams({ export: 'csv', page: '1', per_page: '8000' });
        const res = await fetch(`${cfg.apiUrl}?${params.toString()}`);
        if (!res.ok) {
            throw new Error('Export failed');
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kapis-order-lines.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function closeExportMenu() {
        if (!exportMenu) return;
        exportMenu.hidden = true;
        exportBtn?.setAttribute('aria-expanded', 'false');
    }

    exportBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!exportMenu) return;
        const open = exportMenu.hidden;
        exportMenu.hidden = !open;
        exportBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    exportMenu?.querySelectorAll('[data-export]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            closeExportMenu();
            try {
                await exportCsv(btn.dataset.export);
            } catch (err) {
                alert(err.message || 'Export failed');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (exportWrap && !exportWrap.contains(e.target)) closeExportMenu();
    });
    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) fetchPage(currentPage - 1);
    });
    nextBtn?.addEventListener('click', () => {
        if (lastPayload && currentPage < lastPayload.pages) fetchPage(currentPage + 1);
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

    closeBtn?.addEventListener('click', closeDetail);
    backdrop?.addEventListener('click', closeDetail);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDetail();
    });

    window.addEventListener('evolv:periodchange', (e) => {
        const { from, to } = e.detail || {};
        if (!from || !to) return;
        currentFrom = from;
        currentTo = to;
        if (periodBadge) {
            const label = from === to ? from : `${from} → ${to}`;
            periodBadge.innerHTML = `<span class="material-icons-round">date_range</span> ${label}`;
        }
        fetchPage(1);
    });

    initCharts();

    // Launch spinner immediately (HTML already has is-loading)
    document.body.classList.add('sales-launch-loading');
    showSalesLoader(true, { launch: true });

    const now = new Date();
    currentFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const initToDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    currentTo = `${initToDate.getFullYear()}-${String(initToDate.getMonth() + 1).padStart(2, '0')}-${String(initToDate.getDate()).padStart(2, '0')}`;
    fetchPage(1);
})();
