<?php
/**
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 21/09/2026
 * DESCRIPTION : Sales hub — colorful charts, loader, and detail dashboards
 * 
*/
$currencySymbol = $currencySymbol ?? '$';
$year = (int) ($year ?? date('Y'));
$sapError = $sapError ?? null;
$dataSource = $dataSource ?? 'static';

$extraHead = '<link rel="stylesheet" href="' . e(asset('css/sales.css')) . '">';

ob_start();
?>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>
window.SALES_PAGE = {
    apiUrl: <?= json_encode(url('sales/data')) ?>,
    procurementUrl: <?= json_encode(url('sales/procurement')) ?>,
    procurementPrUrl: <?= json_encode(url('sales/procurement-pr')) ?>,
    bomUrl: <?= json_encode(url('sales/bom')) ?>,
    materialApiUrl: <?= json_encode(url('sales/material-api')) ?>,
    currencySymbol: <?= json_encode($currencySymbol) ?>,
    year: <?= $year ?>,
    defaultPeriod: 'this_week',
    defaultFrom: <?= json_encode($defaultFrom ?? '') ?>,
    defaultTo: <?= json_encode($defaultTo ?? '') ?>,
    defaultLabel: 'This Week',
    pageSize: 10
};
</script>
<script src="<?= e(asset('js/sales.js')) ?>"></script>
<?php
$extraScripts = ob_get_clean();
?>

<section class="sales-hub is-loading" id="salesHub">
    <div class="sales-loader is-on" id="salesLoader" role="status" aria-live="polite">
        <div class="sales-loader-panel">
            <div class="sales-spinner" aria-hidden="true">
                <span class="sales-spinner-ring sales-spinner-ring--outer"></span>
                <span class="sales-spinner-ring sales-spinner-ring--inner"></span>
            </div>
            <strong>Loading SAP sales</strong>
            <span class="sales-loader-hint" id="salesLoaderNote">Fetching order lines from SAP…</span>
        </div>
    </div>
    <script>
    (function () {
        var el = document.getElementById('salesLoader');
        if (el) document.documentElement.appendChild(el);
        document.documentElement.classList.add('sales-is-loading');
        document.body && document.body.classList.add('sales-is-loading');
        var splash = document.getElementById('kapisSplash');
        if (splash) {
            splash.classList.add('is-done');
            splash.setAttribute('hidden', '');
        }
    })();
    </script>

    <?php if (!empty($sapError)): ?>
    <div class="sap-banner warn" style="display:flex">
        <span class="material-icons-round">cloud_off</span>
        <div>
            <strong>SAP connection unavailable</strong>
            <span><?= e((string) $sapError) ?></span>
        </div>
    </div>
    <?php endif; ?>
    <div class="kpi-grid sales-kpi-grid">
        <!-- 1. Net Sales -->
        <div class="kpi-card proj-card tone-sky" role="button" tabindex="0" data-kpi="net" title="Total Net Sales">
            <div class="kpi-icon"><span class="material-icons-round">payments</span></div>
            <div class="kpi-info">
                <div class="label">Net Sales</div>
                <div class="kpi-value-row">
                    <div class="value" id="skNet">—</div>
                    <!-- <span class="kpi-delta" id="skNetDelta" hidden></span> -->
                </div>
                <div class="change" id="skNetNote">Filtered net amount</div>
            </div>
            <div class="kpi-spark" id="skNetSpark" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
        </div>

        <!-- 2. Order Quantity -->
        <div class="kpi-card proj-card tone-mint" role="button" tabindex="0" data-kpi="qty" title="Total Order Quantity">
            <div class="kpi-icon"><span class="material-icons-round">inventory_2</span></div>
            <div class="kpi-info">
                <div class="label">Order Quantity</div>
                <div class="kpi-value-row">
                    <div class="value" id="skQty">—</div>
                    <!-- <span class="kpi-delta" id="skQtyDelta" hidden></span> -->
                </div>
                <div class="change">Units in selected period</div>
            </div>
            <div class="kpi-spark" id="skQtySpark" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
        </div>

        <!-- 3. Sales Orders -->
        <div class="kpi-card proj-card tone-amber" role="button" tabindex="0" data-kpi="orders" title="Total Sales Orders (Click to search in table)">
            <div class="kpi-icon"><span class="material-icons-round">shopping_bag</span></div>
            <div class="kpi-info">
                <div class="label">Orders</div>
                <div class="kpi-value-row">
                    <div class="value" id="skOrders">—</div>
                    <!-- <span class="kpi-delta" id="skOrdersDelta" hidden></span> -->
                </div>
                <div class="change">Distinct orders</div>
            </div>
            <div class="kpi-spark" id="skOrdersSpark" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
        </div>
    </div>

    <div class="sales-charts-main">
        <div class="card chart-panel sales-panel-sky">
            <div class="chart-panel-head">
                <div class="chart-head-left">
                    <span class="chart-panel-icon"><span class="material-icons-round">show_chart</span></span>
                    <div>
                        <h2>Net Sales Trend</h2>
                        <p>Daily net amount</p>
                    </div>
                </div>
                <div class="chart-header-badge trend-badge" id="trendBadge">
                    <span class="material-icons-round">trending_up</span>
                    <span id="trendPeakStat">Daily Activity</span>
                </div>
            </div>
            <div class="chart-wrap tall"><canvas id="salesTrendChart"></canvas></div>
        </div>
        <div class="card chart-panel sales-panel-violet">
            <div class="chart-panel-head">
                <div class="chart-head-left">
                    <span class="chart-panel-icon"><span class="material-icons-round">pie_chart</span></span>
                    <div>
                        <h2 id="salesMixTitle">Plant Mix</h2>
                        <p id="salesMixSubtitle">Click a slice to filter</p>
                    </div>
                </div>
                <div class="chart-header-badge mix-badge" id="mixBadge">
                    <span class="kpi-pulse-dot amber"></span>
                    <span id="mixActiveStat">Interactive</span>
                </div>
            </div>
            <div class="chart-wrap tall chart-wrap-donut">
                <canvas id="salesDivisionChart"></canvas>
                <div class="doughnut-center-badge" id="plantMixCenterBadge" aria-hidden="true">
                    <span class="doughnut-center-val" id="plantMixCenterVal">—</span>
                    <span class="doughnut-center-lbl" id="plantMixCenterLbl">Distribution</span>
                </div>
            </div>
        </div>
    </div>
    <div class="sales-table-shell card proj-panel">
        <div class="sales-table-head">
            <div class="sales-table-head-left">
                <div class="sales-table-title">
                    <h2>Order Lines</h2>
                </div>
                <span class="sales-count-badge" id="salesTableCountBadge">
                    <span class="sales-count-num" id="salesTableCount">—</span> lines
                </span>
            </div>
            <div class="sales-table-head-right">
                <div class="sales-table-search">
                    <div class="sales-search-wrap">
                        <span class="material-icons-round search-icon">search</span>
                        <input type="search" id="salesSearch" placeholder="Search order, material, plant, status…" autocomplete="off">
                        <button type="button" class="sales-search-clear" id="salesSearchClear" hidden aria-label="Clear search">
                            <span class="material-icons-round">close</span>
                        </button>
                        <button type="button" class="sales-search-btn" id="btnSalesSearchSubmit" title="Search">
                            <span class="material-icons-round">arrow_forward</span>
                        </button>
                    </div>
                </div>
                <div class="sales-table-export" id="salesExport">
                    <button type="button" class="sales-export-btn" id="salesExportBtn" aria-haspopup="menu" aria-expanded="false">
                        <span class="material-icons-round">file_download</span>
                        Export
                        <span class="material-icons-round chev">expand_more</span>
                    </button>
                    <div class="sales-export-menu" id="salesExportMenu" hidden>
                        <button type="button" data-export="page">This page (CSV)</button>
                        <button type="button" data-export="all">All filtered (CSV)</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="table-responsive table-wrap sales-table-wrap">
            <table class="sales-data-table table-bordered" id="salesDataTable">
                <thead>
                    <tr class="sales-th-row">
                        <th class="col-sno" style="width: 55px; text-align: center;">S.No</th>
                        <th class="col-sortable" data-sort="sales_order" title="Click to sort by Sales Order">
                            <span>Sales Order</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="line_item" title="Click to sort by Line">
                            <span>Line</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="material" title="Click to sort by Material">
                            <span>Material</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="plant" title="Click to sort by Plant">
                            <span>Plant</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="date" title="Click to sort by Date">
                            <span>Date</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable col-num" data-sort="qty" title="Click to sort by Quantity">
                            <span>Quantity</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable col-num" data-sort="net_amount" title="Click to sort by Net Amount">
                            <span>Net Amount</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="status" title="Click to sort by Status">
                            <span>Status</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-go" aria-hidden="true"></th>
                    </tr>
                    <tr class="sales-col-filter-row">
                        <th class="col-filter-th" style="text-align:center;"><span class="material-icons-round filter-header-icon" title="Column Filters">filter_alt</span></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="sales_order" placeholder="Filter SO..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="line_item" placeholder="Line..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="material" placeholder="Material..."></th>
                        <th class="col-filter-th">
                            <select class="col-filter-select" data-filter-col="plant" id="colFilterPlant">
                                <option value="">All Plants</option>
                            </select>
                        </th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="date" placeholder="Date..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input col-num" data-filter-col="qty" placeholder="Min qty..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input col-num" data-filter-col="net_amount" placeholder="Min amt..."></th>
                        <th class="col-filter-th">
                            <select class="col-filter-select" data-filter-col="status" id="colFilterStatus">
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="open">Open</option>
                                <option value="complete">Complete</option>
                            </select>
                        </th>
                        <th class="col-filter-th" style="text-align:center;">
                            <button type="button" class="btn-clear-col-filters" id="btnClearColFilters" title="Clear all column filters">
                                <span class="material-icons-round">clear</span>
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody id="salesTableBody">
                    <tr><td colspan="10" class="empty-state">Loading…</td></tr>
                </tbody>
            </table>
        </div>
        <div class="sales-pagination" id="salesPagination">
            <div class="sales-page-left">
                <span class="sales-range-info" id="salesRangeInfo">Showing 0–0 of 0</span>
                <div class="sales-page-nav">
                    <button type="button" class="sales-page-btn" id="salesPrev" disabled title="Previous page">
                        <span class="material-icons-round">chevron_left</span> Previous
                    </button>
                    <div class="sales-page-numbers" id="salesPageNumbers"></div>
                    <button type="button" class="sales-page-btn" id="salesNext" disabled title="Next page">
                        Next <span class="material-icons-round">chevron_right</span>
                    </button>
                </div>
            </div>
            <div class="sales-page-right">
                <label for="salesPageSize">Per page</label>
                <select id="salesPageSize" class="sales-select" aria-label="Rows per page">
                    <option value="10" selected>10 / page</option>
                    <option value="25">25 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                </select>
            </div>
        </div>
    </div>
</section>

<div class="sales-detail-backdrop" id="salesDetailBackdrop" hidden></div>
<aside class="sales-detail-drawer so-sheet" id="salesDetailDrawer" aria-hidden="true" role="dialog" aria-labelledby="salesDetailTitle">
    <header class="sales-detail-head">
        <div class="sales-detail-head-meta">
            <div class="sales-detail-badges">
                <span class="so-badge-pill"><span class="material-icons-round">receipt_long</span> SO # <strong id="salesDetailSoNum">—</strong></span>
                <span class="so-badge-pill so-badge-line"><span class="material-icons-round">view_list</span> Line <strong id="salesDetailLineNum">—</strong></span>
                <span class="so-badge-pill so-badge-plant"><span class="material-icons-round">factory</span> Plant <strong id="salesDetailPlantNum">—</strong></span>
                <span class="sales-status-pill" id="salesDetailStatusPill">Active</span>
                <span class="so-badge-pill so-badge-net"><span class="material-icons-round">payments</span> Net <strong id="salesDetailNetVal">—</strong></span>
                <span class="so-badge-pill so-badge-qty"><span class="material-icons-round">inventory_2</span> Qty <strong id="salesDetailQtyVal">—</strong></span>
                <span class="so-badge-pill so-badge-date"><span class="material-icons-round">event</span> Date <strong id="salesDetailDateVal">—</strong></span>
            </div>
            <h3 id="salesDetailTitle" class="sales-detail-title">—</h3>
            <p class="sales-detail-sub" id="salesDetailSub">—</p>
        </div>
        <button type="button" class="icon-btn sales-drawer-close-btn" id="salesDetailClose" aria-label="Close details" title="Close">
            <span class="material-icons-round">close</span>
        </button>
    </header>

    <nav class="sales-drawer-nav-cards" id="salesDrawerNavCards" role="tablist" aria-label="Order sections">
        <button type="button" class="drawer-nav-card card-planning" data-tab="planning" role="tab" id="tabCardPlanning">
            <div class="dnc-top">
                <span class="dnc-icon-wrap"><span class="material-icons-round">event_available</span></span>
                <span class="dnc-tag">Schedule</span>
            </div>
            <div class="dnc-header-group">
                <span class="dnc-eyebrow">Delivery &amp; Schedule</span>
                <span class="dnc-title">Planning</span>
            </div>
            <div class="dnc-metric-box">
                <span class="dnc-metric-label">Confirmed Quantity</span>
                <span class="dnc-value" id="dncPlanningVal">—</span>
            </div>
            <div class="dnc-footer">View Schedule <span class="material-icons-round dnc-arrow">arrow_forward</span></div>
        </button>

        <button type="button" class="drawer-nav-card card-bom" data-tab="bom" role="tab" id="tabCardBom">
            <div class="dnc-top">
                <span class="dnc-icon-wrap"><span class="material-icons-round">schema</span></span>
                <span class="dnc-tag">BOM</span>
            </div>
            <div class="dnc-header-group">
                <span class="dnc-eyebrow">Bill of Materials</span>
                <span class="dnc-title">BOM Explosion</span>
            </div>
            <div class="dnc-metric-box">
                <span class="dnc-metric-label">Component Status</span>
                <span class="dnc-value" id="dncBomVal">Live SAP BOM</span>
            </div>
            <div class="dnc-footer">Explore BOM <span class="material-icons-round dnc-arrow">arrow_forward</span></div>
        </button>

        <button type="button" class="drawer-nav-card card-material" data-tab="material" role="tab" id="tabCardMaterial">
            <div class="dnc-top">
                <span class="dnc-icon-wrap"><span class="material-icons-round">inventory_2</span></span>
                <span class="dnc-tag">Master</span>
            </div>
            <div class="dnc-header-group">
                <span class="dnc-eyebrow">Material Specs &amp; Hierarchy</span>
                <span class="dnc-title">Material Master</span>
            </div>
            <div class="dnc-metric-box">
                <span class="dnc-metric-label">Parent Material Code</span>
                <span class="dnc-value font-mono" id="dncMaterialVal">—</span>
            </div>
            <div class="dnc-footer">View Specs <span class="material-icons-round dnc-arrow">arrow_forward</span></div>
        </button>

        <button type="button" class="drawer-nav-card card-procurement" data-tab="procurement" role="tab" id="tabCardProcurement">
            <div class="dnc-top">
                <span class="dnc-icon-wrap"><span class="material-icons-round">local_shipping</span></span>
                <span class="dnc-tag proc-live-tag"><span class="pulse-dot"></span> Live SAP</span>
            </div>
            <div class="dnc-header-group">
                <span class="dnc-eyebrow">Demand &amp; Supply Chain</span>
                <span class="dnc-title">Procurement</span>
            </div>
            <div class="dnc-metric-box">
                <span class="dnc-metric-label">SAP PR &amp; PO Records</span>
                <span class="dnc-value" id="dncProcVal">Syncing...</span>
            </div>
            <div class="dnc-footer">Open Dashboard <span class="material-icons-round dnc-arrow">arrow_forward</span></div>
        </button>
    </nav>

    <!-- Detail Sub-Offcanvas (Opens when any card is clicked, with Back button) -->
    <div class="sales-subdrawer" id="salesSubDrawer" aria-hidden="true">
        <div class="sales-subdrawer-header">
            <div class="subdrawer-header-left">
                <button type="button" class="btn-subdrawer-back" id="btnSubDrawerBack" title="Back to categories">
                    <span class="material-icons-round">arrow_back</span>
                    <span>Back</span>
                </button>
                <div class="subdrawer-title-group">
                    <h3 class="subdrawer-title" id="subDrawerTitle">Delivery &amp; Schedule Planning</h3>
                </div>
            </div>
            <button type="button" class="icon-btn sales-drawer-close-btn" id="subDrawerClose" aria-label="Close" title="Close">
                <span class="material-icons-round">close</span>
            </button>
        </div>

        <div class="sales-subdrawer-body" id="salesSubDrawerBody">
            <!-- Planning Panel -->
            <div class="drawer-tab-panel" id="panelPlanning" role="tabpanel" hidden></div>

            <!-- BOM Panel -->
            <div class="drawer-tab-panel" id="panelBom" role="tabpanel" hidden></div>

            <!-- Material Panel -->
            <div class="drawer-tab-panel" id="panelMaterial" role="tabpanel" hidden></div>

            <!-- Procurement Panel -->
            <div class="drawer-tab-panel" id="panelProcurement" role="tabpanel" hidden></div>
        </div>
    </div>
</aside>

<input type="hidden" id="dateFrom" value="<?= e($defaultFrom ?? "{$year}-01-01") ?>">
<input type="hidden" id="dateTo" value="<?= e($defaultTo ?? "{$year}-12-31") ?>">

<!-- Procurement Offcanvas & PR Drilldown -->
<div class="procurement-backdrop is-hidden" id="procurementBackdrop" style="display:none" hidden></div>
<div class="procurement-modal is-hidden" id="procurementModal" role="dialog" aria-modal="true" aria-labelledby="procurementModalTitle" style="display:none" hidden>
    <!-- Modern Sleek Header -->
    <div class="procurement-modal-header">
        <div class="proc-header-left">
            <div class="proc-header-icon">
                <span class="material-icons-round">inventory_2</span>
            </div>
            <div class="proc-header-meta">
                <div class="proc-header-top-row">
                    <h2 id="procurementModalTitle">Procurement Overview</h2>
                    <span class="proc-pill proc-pill-so">Sales Doc #<strong id="procSalesDocLabel">—</strong></span>
                    <span class="proc-pill proc-pill-live"><span class="pulse-dot"></span> Live SAP</span>
                </div>
                <div class="procurement-subtitle">
                    <span class="mat-label">Material:</span>
                    <strong id="procHeaderMaterial">—</strong>
                    <span class="mat-sep">·</span>
                    <span id="procHeaderDesc">—</span>
                </div>
            </div>
        </div>
        <div class="procurement-header-actions">
            <button type="button" class="proc-btn-header" id="btnProcReload" title="Sync live data from SAP">
                <span class="material-icons-round">sync</span>
                <span>Sync</span>
            </button>
            <button type="button" class="proc-btn-close" id="procurementModalClose" aria-label="Close Procurement Drawer" title="Close">
                <span class="material-icons-round">close</span>
            </button>
        </div>
    </div>

    <!-- Colorful Modern Offcanvas KPI Cards -->
    <div class="procurement-cards-grid">
        <div class="proc-stat-card proc-stat-indigo">
            <div class="proc-stat-top">
                <span class="proc-stat-lbl">Components</span>
                <div class="proc-stat-icon-wrap"><span class="material-icons-round">category</span></div>
            </div>
            <div class="proc-stat-num"><b id="procStatComponents">0</b><span class="proc-stat-unit"> items</span></div>
            <div class="proc-stat-sub">Bill of Materials</div>
        </div>
        <div class="proc-stat-card proc-stat-cyan">
            <div class="proc-stat-top">
                <span class="proc-stat-lbl">Required Qty</span>
                <div class="proc-stat-icon-wrap"><span class="material-icons-round">shopping_bag</span></div>
            </div>
            <div class="proc-stat-num"><b id="procStatReq">0</b></div>
            <div class="proc-stat-sub">Demand Requirement</div>
        </div>
        <div class="proc-stat-card proc-stat-amber">
            <div class="proc-stat-top">
                <span class="proc-stat-lbl">Total PR Qty</span>
                <div class="proc-stat-icon-wrap"><span class="material-icons-round">receipt_long</span></div>
            </div>
            <div class="proc-stat-num"><b id="procStatPR">0</b></div>
            <div class="proc-stat-sub">Purchase Requisitions</div>
        </div>
        <div class="proc-stat-card proc-stat-emerald">
            <div class="proc-stat-top">
                <span class="proc-stat-lbl">Total PO Qty</span>
                <div class="proc-stat-icon-wrap"><span class="material-icons-round">local_shipping</span></div>
            </div>
            <div class="proc-stat-num"><b id="procStatPO">0</b></div>
            <div class="proc-stat-sub">Purchase Orders</div>
        </div>
        <div class="proc-stat-card proc-stat-purple">
            <div class="proc-stat-top">
                <span class="proc-stat-lbl">Stock Available</span>
                <div class="proc-stat-icon-wrap"><span class="material-icons-round">warehouse</span></div>
            </div>
            <div class="proc-stat-num"><b id="procStatStock">0</b></div>
            <div class="proc-stat-sub">On-hand Inventory</div>
        </div>
    </div>

    <!-- Clean Toolbar: Search & Group Filter Pills -->
    <div class="procurement-toolbar">
        <div class="procurement-search-wrap">
            <span class="material-icons-round">search</span>
            <input type="search" id="procSearchInput" placeholder="Search material code, description, shade..." autocomplete="off">
            <button type="button" class="proc-search-clear" id="procSearchClear" aria-label="Clear search" title="Clear search" hidden>
                <span class="material-icons-round">clear</span>
            </button>
        </div>
        <div class="procurement-group-filters" id="procGroupFilters">
            <button type="button" class="proc-filter-pill active" data-group="all">All (<span id="procFilterCountAll">0</span>)</button>
            <button type="button" class="proc-filter-pill" data-group="fabric">Fabric</button>
            <button type="button" class="proc-filter-pill" data-group="lining">Lining</button>
            <button type="button" class="proc-filter-pill" data-group="label">Labels</button>
            <button type="button" class="proc-filter-pill" data-group="thread">Threads</button>
            <button type="button" class="proc-filter-pill" data-group="button">Buttons</button>
        </div>
        <div class="procurement-count-badge" id="procFilteredCount">0 items</div>
    </div>

    <!-- Main Content: Data Table -->
    <div class="procurement-content-body">
        <div class="procurement-table-scroll" id="procurementTableView">
            <table class="procurement-table" id="procurementTable">
                <thead>
                    <tr>
                        <th style="min-width:180px">Component Material</th>
                        <th style="min-width:240px">Description</th>
                        <th style="min-width:95px">Group</th>
                        <th class="col-num" style="min-width:90px">Req Qty</th>
                        <th class="col-num" style="min-width:110px">Total PR Qty</th>
                        <th class="col-num" style="min-width:110px">Total PO Qty</th>
                        <th class="col-num" style="min-width:110px">Balance PR</th>
                        <th class="col-num" style="min-width:105px">Stock Qty</th>
                        <th class="col-action" style="text-align:center;min-width:90px">PR Set</th>
                    </tr>
                </thead>
                <tbody id="procurementTableBody">
                    <tr><td colspan="9" class="empty-state">Loading Procurement data...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Nested PR Set Drilldown Drawer inside Modal -->
    <div class="procurement-pr-drawer" id="procurementPrDrawer" aria-hidden="true">
        <div class="pr-drawer-header">
            <div>
                <span class="pr-drawer-eyebrow"><span class="material-icons-round" style="font-size:14px;vertical-align:-1px;">receipt_long</span> PR &amp; PO Details</span>
                <h3 id="prDrawerTitle">PR Set</h3>
                <p id="prDrawerSubtitle" class="pr-drawer-sub"></p>
            </div>
            <button type="button" class="icon-btn" id="prDrawerClose" aria-label="Close PR Drawer">
                <span class="material-icons-round">close</span>
            </button>
        </div>
        <div class="pr-drawer-body" id="prDrawerBody">
            <div class="loading-state">Loading ProcurementPRSet from SAP...</div>
        </div>
    </div>
</div>

