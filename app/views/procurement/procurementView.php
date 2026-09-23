<?php
/* Procurement modal */
?>

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
                    <span class="mat-sep">Â·</span>
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

