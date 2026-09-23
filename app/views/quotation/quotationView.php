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

$extraHead = '<link rel="stylesheet" href="' . e(asset('css/quotation/quotation.css')) . '">'
    . '<link rel="stylesheet" href="' . e(asset('css/saleorder/saleorder.css')) . '">'
    . '<link rel="stylesheet" href="' . e(asset('css/bom/bom.css')) . '">'
    . '<link rel="stylesheet" href="' . e(asset('css/procurement/procurement.css')) . '">';

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
    salesApiHubUrl: <?= json_encode(url('sales/sales-api')) ?>,
    currencySymbol: <?= json_encode($currencySymbol) ?>,
    year: <?= $year ?>,
    defaultPeriod: 'this_week',
    defaultFrom: <?= json_encode($defaultFrom ?? '') ?>,
    defaultTo: <?= json_encode($defaultTo ?? '') ?>,
    defaultLabel: 'This Week',
    pageSize: 10
};
</script>
<script src="<?= e(asset('js/quotation/quotation.js')) ?>"></script>
<?php
$extraScripts = ob_get_clean();
?>

<!-- Sales Hub -->
<section class="sales-hub is-loading" id="salesHub">
    <div class="sales-loader is-on" id="salesLoader" role="status" aria-live="polite">
        <div class="sales-loader-panel">
            <div class="sales-spinner" aria-hidden="true">
                <span class="sales-spinner-ring sales-spinner-ring--outer"></span>
                <span class="sales-spinner-ring sales-spinner-ring--inner"></span>
            </div>
            <strong>Loading SAP quotations</strong>
            <span class="sales-loader-hint" id="salesLoaderNote">Fetching quotations from SAP...</span>
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
                <div class="label">Quotation Value</div>
                <div class="kpi-value-row">
                    <div class="value" id="skNet">—</div>
                    <!-- <span class="kpi-delta" id="skNetDelta" hidden></span> -->
                </div>
                <div class="change" id="skNetNote">Quotation net value</div>
            </div>
            <div class="kpi-spark" id="skNetSpark" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
        </div>

        <!-- 2. Order Quantity -->
        <div class="kpi-card proj-card tone-mint" role="button" tabindex="0" data-kpi="qty" title="Total Order Quantity">
            <div class="kpi-icon"><span class="material-icons-round">inventory_2</span></div>
            <div class="kpi-info">
                <div class="label">Quotation Qty</div>
                <div class="kpi-value-row">
                    <div class="value" id="skQty">—</div>
                    <!-- <span class="kpi-delta" id="skQtyDelta" hidden></span> -->
                </div>
                <div class="change">Quoted quantity</div>
            </div>
            <div class="kpi-spark" id="skQtySpark" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
        </div>

        <!-- 3. Sales Orders -->
        <div class="kpi-card proj-card tone-amber" role="button" tabindex="0" data-kpi="orders" title="Total Sales Orders (Click to search in table)">
            <div class="kpi-icon"><span class="material-icons-round">shopping_bag</span></div>
            <div class="kpi-info">
                <div class="label">Quotations</div>
                <div class="kpi-value-row">
                    <div class="value" id="skOrders">—</div>
                    <!-- <span class="kpi-delta" id="skOrdersDelta" hidden></span> -->
                </div>
                <div class="change">Total records</div>
            </div>
            <div class="kpi-spark" id="skOrdersSpark" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
        </div>
    </div>
    <div class="sales-table-shell card proj-panel" id="salesTableShell">
        <div class="sales-table-head">
            <div class="sales-table-head-left">
                <div class="sales-table-title">
                    <h2>Quotations</h2>
                </div>
                <span class="sales-count-badge" id="salesTableCountBadge">
                    <span class="sales-count-num" id="salesTableCount">—</span> Total Records
                </span>
            </div>
            <div class="sales-table-head-right">
                <div class="sales-table-search">
                    <div class="sales-search-wrap">
                        <span class="material-icons-round search-icon">search</span>
                        <input type="search" id="salesSearch" placeholder="Search quotation or sales order..." autocomplete="off">
                        <button type="button" class="sales-search-clear" id="salesSearchClear" hidden aria-label="Clear search">
                            <span class="material-icons-round">close</span>
                        </button>
                        <button type="button" class="sales-search-btn" id="btnSalesSearchSubmit" title="Search">
                            <span class="material-icons-round" style="color: white;">arrow_forward</span>
                        </button>
                    </div>
                </div>
                <div class="sales-table-tools">
                    <button type="button" class="sales-tool-btn" id="btnSalesColFilter" aria-pressed="false" title="Show column filters">
                        <span class="material-icons-round">filter_alt</span>
                        <span class="sales-tool-btn-label">Filter</span>
                    </button>
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
                        <th class="col-sortable" data-sort="quotation" title="Click to sort by Quotation">
                            <span>Quotation</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="line_item" title="Click to sort by Item">
                            <span>Item</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="material" title="Click to sort by Material">
                            <span>Material</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="item_category" title="Click to sort by Category">
                            <span>Category</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="customer" title="Click to sort by Customer">
                            <span>Customer</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="customer_ref" title="Click to sort by Customer Reference">
                            <span>Customer Reference</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="date" title="Click to sort by Quotation Date">
                            <span>Quotation Date</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable col-num" data-sort="qty" title="Click to sort by Quantity">
                            <span>Quantity</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable col-num" data-sort="net_amount" title="Click to sort by Net Value">
                            <span>Net Value</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                        <th class="col-sortable" data-sort="sales_order" title="Click to sort by Sales Order">
                            <span>Sales Order</span>
                            <span class="sort-icon material-icons-round">unfold_more</span>
                        </th>
                    </tr>
                    <tr class="sales-col-filter-row">
                        <th class="col-filter-th" style="text-align:center;"><span class="material-icons-round filter-header-icon" title="Column Filters">filter_alt</span></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="quotation" placeholder="Quotation..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="line_item" placeholder="Item..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="material" placeholder="Material..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="item_category" placeholder="Cat..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="customer" placeholder="Customer..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="customer_ref" placeholder="Reference..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="date" placeholder="Date..."></th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input col-num" data-filter-col="qty" placeholder="Min qty..."></th>
                        <th class="col-filter-th">
                            <div class="col-filter-net-clear">
                                <input type="text" class="col-filter-input col-num" data-filter-col="net_amount" placeholder="Min amt...">
                                <button type="button" class="btn-clear-col-filters" id="btnClearColFilters" title="Clear all column filters">
                                    <span class="material-icons-round">clear</span>
                                </button>
                            </div>
                        </th>
                        <th class="col-filter-th"><input type="text" class="col-filter-input" data-filter-col="sales_order" placeholder="Filter SO..."></th>
                    </tr>
                </thead>
                <tbody id="salesTableBody">
                    <tr><td colspan="11" class="empty-state">Loading...</td></tr>
                </tbody>
            </table>
        </div>
        <div class="sales-pagination" id="salesPagination">
            <div class="sales-page-left">
                <span class="sales-range-info" id="salesRangeInfo">Showing 0-0 of 0</span>
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

<input type="hidden" id="dateFrom" value="<?= e($defaultFrom ?? "{$year}-01-01") ?>">
<input type="hidden" id="dateTo" value="<?= e($defaultTo ?? "{$year}-12-31") ?>">

<?php require base_path('app/views/saleorder/saleorderView.php'); ?>
<?php require base_path('app/views/bom/bomView.php'); ?>
<?php require base_path('app/views/procurement/procurementView.php'); ?>
