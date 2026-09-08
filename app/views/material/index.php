<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 07/09/2026
// DESCRIPTION : Material hub — live ZI_MaterialAPI_HUB master data

$year = (int) ($year ?? date('Y'));
$sapError = $sapError ?? null;

$extraHead = '<link rel="stylesheet" href="' . e(asset('css/sales.css')) . '">'
    . '<link rel="stylesheet" href="' . e(asset('css/material.css')) . '">';

ob_start();
?>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>
window.MATERIAL_PAGE = {
    apiUrl: <?= json_encode(url('material/data')) ?>,
    year: <?= $year ?>,
    pageSize: 25
};
</script>
<script src="<?= e(asset('js/material.js')) ?>"></script>
<?php
$extraScripts = ob_get_clean();
?>

<section class="sales-hub material-hub is-loading" id="materialHub">
    <div class="sales-loader sales-loader--launch" id="materialLoader" role="status" aria-live="polite">
        <div class="sales-loader-ring" aria-hidden="true"></div>
        <strong>Loading SAP materials</strong>
        <span id="materialLoaderNote">Connecting to ZI_MaterialAPI_HUB…</span>
        <span class="sales-loader-hint">Pulling product, plant, group, and brand master lines from Material API Hub.</span>
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

    <div class="kpi-grid sales-kpi-grid">
        <div class="kpi-card proj-card tone-sky">
            <div class="kpi-icon"><span class="material-icons-round">inventory_2</span></div>
            <div class="kpi-info">
                <div class="label">Products</div>
                <div class="value" id="mkProducts">—</div>
                <div class="change" id="mkProductsNote">Distinct Product</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-mint">
            <div class="kpi-icon"><span class="material-icons-round">factory</span></div>
            <div class="kpi-info">
                <div class="label">Plants</div>
                <div class="value" id="mkPlants">—</div>
                <div class="change" id="mkPlantsNote">Distinct Plant</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-amber">
            <div class="kpi-icon"><span class="material-icons-round">category</span></div>
            <div class="kpi-info">
                <div class="label">Product Types</div>
                <div class="value" id="mkTypes">—</div>
                <div class="change">e.g. FERT</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-violet">
            <div class="kpi-icon"><span class="material-icons-round">layers</span></div>
            <div class="kpi-info">
                <div class="label">Product Groups</div>
                <div class="value" id="mkGroups">—</div>
                <div class="change">ProductGroup</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-rose">
            <div class="kpi-icon"><span class="material-icons-round">sell</span></div>
            <div class="kpi-info">
                <div class="label">Brands</div>
                <div class="value" id="mkBrands">—</div>
                <div class="change">Distinct Brand</div>
            </div>
        </div>
        <div class="kpi-card proj-card tone-teal">
            <div class="kpi-icon"><span class="material-icons-round">qr_code_2</span></div>
            <div class="kpi-info">
                <div class="label">Batch Managed</div>
                <div class="value" id="mkBatch">—</div>
                <div class="change">IsBatchManagementRequired</div>
            </div>
        </div>
    </div>

    <div class="sales-charts-main">
        <div class="card chart-panel mat-panel-sand">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">show_chart</span></span>
                <div>
                    <h2>Created Materials</h2>
                    <p>CreationDate count by day</p>
                </div>
            </div>
            <div class="chart-wrap tall"><canvas id="mkTrendChart"></canvas></div>
        </div>
        <div class="card chart-panel mat-panel-teal">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">factory</span></span>
                <div>
                    <h2>By Plant</h2>
                    <p>Plant mix of material lines</p>
                </div>
            </div>
            <div class="chart-wrap tall"><canvas id="mkPlantChart"></canvas></div>
        </div>
    </div>

    <div class="sales-charts-row">
        <div class="card chart-panel mat-panel-coral">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">water_drop</span></span>
                <div>
                    <h2>Top Product Groups</h2>
                    <p>Highest line count</p>
                </div>
            </div>
            <div class="chart-wrap"><canvas id="mkTopChart"></canvas></div>
        </div>
        <div class="card chart-panel mat-panel-forest">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">category</span></span>
                <div>
                    <h2>By Product Type</h2>
                    <p>FERT / type mix</p>
                </div>
            </div>
            <div class="chart-wrap"><canvas id="mkGroupChart"></canvas></div>
        </div>
        <div class="card chart-panel mat-panel-amber">
            <div class="chart-panel-head">
                <span class="chart-panel-icon"><span class="material-icons-round">sell</span></span>
                <div>
                    <h2>By Brand</h2>
                    <p>Brand mix</p>
                </div>
            </div>
            <div class="chart-wrap"><canvas id="mkStatusChart"></canvas></div>
        </div>
    </div>

    <div class="mat-boards">
        <article class="mat-board mat-board-plant">
            <header>
                <span class="material-icons-round">factory</span>
                <div>
                    <h3>Plant board</h3>
                    <small>Share of lines</small>
                </div>
            </header>
            <div class="mat-rank" id="matPlantBoard"></div>
        </article>
        <article class="mat-board mat-board-mat">
            <header>
                <span class="material-icons-round">style</span>
                <div>
                    <h3>Product group board</h3>
                    <small>Top groups</small>
                </div>
            </header>
            <div class="mat-rank" id="matMaterialBoard"></div>
        </article>
        <article class="mat-board mat-board-div">
            <header>
                <span class="material-icons-round">donut_large</span>
                <div>
                    <h3>Brand board</h3>
                    <small>Brand share</small>
                </div>
            </header>
            <div class="mat-rank" id="matDivisionBoard"></div>
        </article>
    </div>

    <div class="sales-table-card mat-table-card">
        <div class="sales-table-head">
            <div class="sales-table-title">
                <span class="sales-table-icon mat-table-icon"><span class="material-icons-round">layers</span></span>
                <div>
                    <h2>Material Master Report</h2>
                    <p id="materialRangeInfo">Loading…</p>
                </div>
            </div>
            <div class="sales-table-tools">
                <label class="sales-search">
                    <span class="material-icons-round">search</span>
                    <input type="search" id="materialSearch" placeholder="Search product, plant, brand, group…" autocomplete="off">
                </label>
                <select id="materialPageSize" class="sales-select">
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </div>
        </div>
        <div class="table-scroll">
            <table class="sales-table mat-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Group</th>
                        <th>Plant</th>
                        <th>SLoc</th>
                        <th>Brand</th>
                        <th>Division</th>
                        <th>Unit</th>
                        <th>Created</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="materialTableBody">
                    <tr><td colspan="10" class="empty-state">Loading…</td></tr>
                </tbody>
            </table>
        </div>
        <div class="sales-pager mat-pager">
            <button type="button" class="sales-pager-btn mat-pager-btn" id="materialPrev" disabled aria-label="Previous page">
                <span class="material-icons-round">chevron_left</span>
            </button>
            <button type="button" class="sales-pager-btn mat-pager-btn" id="materialNext" disabled aria-label="Next page">
                <span class="material-icons-round">chevron_right</span>
            </button>
        </div>
    </div>
</section>

<div class="sales-detail-backdrop" id="materialDetailBackdrop" hidden></div>
<aside class="sales-detail-drawer mat-detail-drawer" id="materialDetailDrawer" aria-hidden="true">
    <div class="sales-detail-head">
        <div>
            <p class="sales-detail-eyebrow">ZI_MaterialAPI_HUB</p>
            <h3 id="materialDetailTitle">—</h3>
        </div>
        <button type="button" class="icon-btn" id="materialDetailClose" aria-label="Close details">
            <span class="material-icons-round">close</span>
        </button>
    </div>
    <div class="sales-detail-body" id="materialDetailBody"></div>
</aside>
