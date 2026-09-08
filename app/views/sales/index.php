<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 04/09/2026
// DESCRIPTION : Sales hub — colorful charts, loader, and detail dashboards

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
    currencySymbol: <?= json_encode($currencySymbol) ?>,
    year: <?= $year ?>,
    pageSize: 25
};
</script>
<script src="<?= e(asset('js/sales.js')) ?>"></script>
<?php
$extraScripts = ob_get_clean();
?>

<section class="sales-hub is-loading" id="salesHub">
    <div class="sales-loader sales-loader--launch" id="salesLoader" role="status" aria-live="polite">
        <div class="sales-loader-ring" aria-hidden="true"></div>
        <strong>Loading SAP sales</strong>
        <span id="salesLoaderNote">Connecting to ZI_SalesApi_HUB…</span>
        <span class="sales-loader-hint">First load may take a moment while order lines sync from SAP.</span>
    </div>

    <?php if (!empty($sapError)): ?>
    <div class="sap-banner warn" style="display:flex">
        <span class="material-icons-round">cloud_off</span>
        <div>
            <strong>SAP connection unavailable</strong>
            <span><?= e((string) $sapError) ?></span>
        </div>
    </div>
    <?php endif; ?>
<!-- 
    <div class="sales-hero-bar">
        <div>
            <h2>Sales command center</h2>
            <p>Live hub lines in USD — plant, material, and order drill-down.</p>
        </div>
        <div class="sales-hero-chips">
            <span class="sales-chip"><span class="material-icons-round">cloud_done</span> ZI_SalesApi_HUB</span>
            <span class="sales-chip" id="salesPeriodBadge"><span class="material-icons-round">date_range</span> This Month</span>
            <span class="sales-chip" id="salesLiveCount"><span class="material-icons-round">receipt_long</span> — lines</span>
        </div>
    </div> -->

    <div class="kpi-grid sales-kpi-grid">
        <div class="kpi-card proj-card tone-sky" role="button" tabindex="0" data-kpi="net">
            <div class="kpi-icon"><span class="material-icons-round">payments</span></div>
            <div class="kpi-info">
                <div class="label">Net Sales</div>
                <div class="value" id="skNet">—</div>
                <div class="change" id="skNetNote">Filtered net amount</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-mint" role="button" tabindex="0" data-kpi="qty">
            <div class="kpi-icon"><span class="material-icons-round">inventory_2</span></div>
            <div class="kpi-info">
                <div class="label">Order Quantity</div>
                <div class="value" id="skQty">—</div>
                <div class="change">Units in selected period</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-amber" role="button" tabindex="0" data-kpi="orders">
            <div class="kpi-icon"><span class="material-icons-round">receipt_long</span></div>
            <div class="kpi-info">
                <div class="label">Sales Orders</div>
                <div class="value" id="skOrders">—</div>
                <div class="change">Distinct orders</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-violet" role="button" tabindex="0" data-kpi="avg">
            <div class="kpi-icon"><span class="material-icons-round">account_balance_wallet</span></div>
            <div class="kpi-info">
                <div class="label">Avg Line Value</div>
                <div class="value" id="skAvg">—</div>
                <div class="change">Per order line</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-teal" role="button" tabindex="0" data-kpi="margin">
            <div class="kpi-icon"><span class="material-icons-round">trending_up</span></div>
            <div class="kpi-info">
                <div class="label">Gross Margin</div>
                <div class="value" id="skMargin">—</div>
                <div class="change">Net vs cost amount</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-rose" role="button" tabindex="0" data-kpi="returns">
            <div class="kpi-icon"><span class="material-icons-round">assignment_return</span></div>
            <div class="kpi-info">
                <div class="label">Return Rate</div>
                <div class="value" id="skReturn">—</div>
                <div class="change">Return qty share</div>
            </div>
        </div>
    </div>

    <div class="sales-charts-main">
        <div class="card chart-panel sales-panel-sky">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">show_chart</span></span>
                <div>
                    <h2>Net Sales Trend</h2>
                    <p>Daily net amount</p>
                </div>
            </div>
            <div class="chart-wrap tall"><canvas id="salesTrendChart"></canvas></div>
        </div>
        <div class="card chart-panel sales-panel-violet">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">bubble_chart</span></span>
                <div>
                    <h2 id="salesMixTitle">Plant Mix</h2>
                    <p id="salesMixSubtitle">Click a slice to filter</p>
                </div>
            </div>
            <div class="chart-wrap tall"><canvas id="salesDivisionChart"></canvas></div>
        </div>
    </div>

    <div class="sales-charts-row">
        <div class="card chart-panel sales-panel-amber">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">star</span></span>
                <div>
                    <h2>Top Materials</h2>
                    <p>Highest net amount</p>
                </div>
            </div>
            <div class="chart-wrap"><canvas id="salesStylesChart"></canvas></div>
        </div>
        <div class="card chart-panel sales-panel-mint">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">receipt_long</span></span>
                <div>
                    <h2 id="salesBarTitle">Top Sales Orders</h2>
                    <p id="salesBarSubtitle">Click a bar to filter</p>
                </div>
            </div>
            <div class="chart-wrap"><canvas id="salesChannelChart"></canvas></div>
        </div>
        <div class="card chart-panel sales-panel-rose">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">donut_small</span></span>
                <div>
                    <h2>Status Mix</h2>
                    <p>Net amount by status</p>
                </div>
            </div>
            <div class="chart-wrap"><canvas id="salesStatusChart"></canvas></div>
        </div>
    </div>
<!-- 
    <div class="sales-section-title">
        <div>
            <h2>Details dashboards</h2>
            <p>Ranked plant, division, status, and material boards — click a row to filter the table.</p>
        </div>
    </div> -->
    <!-- <div class="sales-boards">
        <article class="sales-board plant">
            <header>
                <span class="material-icons-round">factory</span>
                <div>
                    <h3>Plant dashboard</h3>
                    <small>Share of net sales</small>
                </div>
            </header>
            <div class="sales-rank" id="plantBoard"></div>
        </article>
        <article class="sales-board division">
            <header>
                <span class="material-icons-round">category</span>
                <div>
                    <h3>Division dashboard</h3>
                    <small>Apparel vs accessories</small>
                </div>
            </header>
            <div class="sales-rank" id="divisionBoard"></div>
        </article>
        <article class="sales-board status">
            <header>
                <span class="material-icons-round">flag</span>
                <div>
                    <h3>Status dashboard</h3>
                    <small>Process status mix</small>
                </div>
            </header>
            <div class="sales-rank" id="statusBoard"></div>
        </article>
        <article class="sales-board material">
            <header>
                <span class="material-icons-round">style</span>
                <div>
                    <h3>Material dashboard</h3>
                    <small>Top net lines</small>
                </div>
            </header>
            <div class="sales-rank" id="materialBoard"></div>
        </article>
    </div> -->

    <div class="sales-table-shell card proj-panel">
        <div class="sales-table-head">
            <div class="sales-table-title">
                <span class="sales-table-icon"><span class="material-icons-round">table_rows</span></span>
                <h2>Order Lines</h2>
            </div>
            <div class="sales-table-search">
                <div class="sales-search-wrap">
                    <span class="material-icons-round">search</span>
                    <input type="search" id="salesSearch" placeholder="Search order, material, plant, status…" autocomplete="off">
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
        <div class="table-wrap sales-table-wrap">
            <table class="sales-data-table" id="salesDataTable">
                <thead>
                    <tr>
                        <th>Sales Order</th>
                        <th>Line</th>
                        <th>Material</th>
                        <th>Plant</th>
                        <th>Division</th>
                        <th>Date</th>
                        <th class="col-num">Qty</th>
                        <th class="col-num">Net Amount</th>
                        <th>Status</th>
                        <th class="col-go" aria-hidden="true"></th>
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
                    <button type="button" class="sales-page-btn" id="salesPrev" disabled>
                        <span class="material-icons-round">chevron_left</span> Previous
                    </button>
                    <button type="button" class="sales-page-btn" id="salesNext" disabled>
                        Next <span class="material-icons-round">chevron_right</span>
                    </button>
                </div>
            </div>
            <div class="sales-page-right">
                <label for="salesPageSize">Per page</label>
                <select id="salesPageSize" class="sales-select" aria-label="Rows per page">
                    <option value="10">10 / page</option>
                    <option value="25" selected>25 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                </select>
            </div>
        </div>
    </div>
</section>

<div class="sales-detail-backdrop" id="salesDetailBackdrop" hidden></div>
<aside class="sales-detail-drawer" id="salesDetailDrawer" aria-hidden="true">
    <div class="sales-detail-head">
        <div>
            <p class="sales-detail-eyebrow">Order line dashboard</p>
            <h3 id="salesDetailTitle">—</h3>
        </div>
        <button type="button" class="icon-btn" id="salesDetailClose" aria-label="Close details">
            <span class="material-icons-round">close</span>
        </button>
    </div>
    <div class="sales-detail-body" id="salesDetailBody"></div>
</aside>

<input type="hidden" id="dateFrom" value="<?= e($defaultFrom ?? "{$year}-01-01") ?>">
<input type="hidden" id="dateTo" value="<?= e($defaultTo ?? "{$year}-12-31") ?>">
