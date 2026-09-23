<?php
/* Sale order drawer + line cards */
?>
<!-- Sales Order Detail Drawer -->
<div class="sales-detail-backdrop" id="salesDetailBackdrop" hidden></div>
<aside class="sales-detail-drawer so-sheet" id="salesDetailDrawer" aria-hidden="true" role="dialog" aria-labelledby="salesDetailTitle">
    <header class="so-qt-head">
        <button type="button" class="btn-subdrawer-back so-dash-back" id="salesDetailClose" aria-label="Back to quotations" title="Back">
            <span class="material-icons-round">arrow_back</span>
            <span>Back</span>
        </button>
        <h3 id="salesDetailTitle" class="so-qt-sr-only">Quotation</h3>
        <p class="sales-detail-sub" id="salesDetailSub" hidden>—</p>
        <div class="so-qt-badges">
            <span class="so-qt-badge is-blue"><span class="material-icons-round">request_quote</span> Quotation <strong id="salesDetailQtNum">—</strong></span>
            <span class="so-qt-badge is-green"><span class="material-icons-round">receipt_long</span> Sales Order <strong id="salesDetailSoNum">—</strong></span>
            <span class="so-qt-badge is-amber"><span class="material-icons-round">factory</span> Plant <strong id="salesDetailPlantNum">—</strong></span>
            <span class="so-qt-badge is-violet"><span class="material-icons-round">label</span> Type <strong id="salesDetailQtType">—</strong></span>
            <span class="so-qt-badge is-slate"><span class="material-icons-round">person</span> Customer <strong id="salesDetailCustomer">—</strong></span>
            <span class="so-qt-badge is-cyan"><span class="material-icons-round">event</span> Date <strong id="salesDetailDateVal">—</strong></span>
        </div>
    </header>
    <span id="salesDetailStatusPill" hidden></span>
    <span id="salesDetailLineNum" hidden>—</span>
    <span id="salesDetailNetVal" hidden>—</span>
    <span id="salesDetailQtyVal" hidden>—</span>

    <div class="so-dash" id="soDash">
        <div class="so-dash-loader" id="soDashLoader" hidden>
            <div class="sales-spinner" aria-hidden="true">
                <span class="sales-spinner-ring sales-spinner-ring--outer"></span>
                <span class="sales-spinner-ring sales-spinner-ring--inner"></span>
            </div>
            <strong>Loading sales order lines...</strong>
        </div>
        <div class="so-dash-kpis">
            <div class="so-dash-kpi so-kpi-sky">
                <span class="so-dash-kpi-icon"><span class="material-icons-round">view_list</span></span>
                <div class="so-dash-kpi-copy">
                    <span class="so-dash-kpi-label">Items</span>
                    <strong id="soDashItems">—</strong>
                    <span class="so-dash-kpi-hint">Order line items</span>
                </div>
                <svg class="so-dash-spark" viewBox="0 0 72 28" aria-hidden="true"><path d="M2 22 V10 M14 22 V16 M26 22 V8 M38 22 V14 M50 22 V6 M62 22 V12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
            </div>
            <div class="so-dash-kpi so-kpi-mint">
                <span class="so-dash-kpi-icon"><span class="material-icons-round">inventory_2</span></span>
                <div class="so-dash-kpi-copy">
                    <span class="so-dash-kpi-label">Quantity</span>
                    <strong id="soDashQty">—</strong>
                    <span class="so-dash-kpi-hint">Confirmed quantity</span>
                </div>
                <svg class="so-dash-spark" viewBox="0 0 72 28" aria-hidden="true"><path d="M2 20 V12 M14 20 V8 M26 20 V14 M38 20 V6 M50 20 V10 M62 20 V16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
            </div>
            <div class="so-dash-kpi so-kpi-amber">
                <span class="so-dash-kpi-icon"><span class="material-icons-round">payments</span></span>
                <div class="so-dash-kpi-copy">
                    <span class="so-dash-kpi-label">Net Value</span>
                    <strong id="soDashNet">—</strong>
                    <span class="so-dash-kpi-hint">Sales order net value</span>
                </div>
                <svg class="so-dash-spark" viewBox="0 0 72 28" aria-hidden="true"><path d="M2 22 V14 M14 22 V10 M26 22 V16 M38 22 V8 M50 22 V12 M62 22 V18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
            </div>
        </div>
    </div>

    <div class="so-related-panel" id="soRelatedPanel">
        <div class="so-related-head">
            <span class="material-icons-round">view_list</span>
            <div>
                <strong>Sales Order table</strong>
            </div>
            <div class="so-related-tools">
                <label class="so-related-search">
                    <span class="material-icons-round">search</span>
                    <input type="search" id="soRelatedSearch" placeholder="Search table..." autocomplete="off">
                </label>
                <button type="button" class="so-related-export" id="soRelatedFilterBtn" aria-pressed="false" title="Column filters">
                    <span class="material-icons-round">filter_alt</span>
                    Filter
                </button>
                <button type="button" class="so-related-export" id="soRelatedExport">
                    <span class="material-icons-round">file_download</span>
                    Export
                </button>
                <span class="so-related-count" id="soRelatedCount">0 items</span>
            </div>
        </div>
        <div class="so-related-table-wrap">
            <table class="so-related-table" id="soRelatedTable">
                <thead>
                    <tr>
                        <th>Line</th>
                        <th>Category</th>
                        <th>Material</th>
                        <th>Plant</th>
                        <th>Customer</th>
                        <th>Type</th>
                        <th class="col-num">Qty</th>
                        <th class="col-num">Net</th>
                        <th>Sales Order</th>
                    </tr>
                    <tr class="so-related-filter-row">
                        <th><input type="text" class="so-col-filter" data-so-filter="line_item" placeholder="Line..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="item_category" placeholder="Cat..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="material" placeholder="Material..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="plant" placeholder="Plant..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="customer" placeholder="Customer..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="type" placeholder="Type..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="qty" placeholder="Qty..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="net_amount" placeholder="Net..."></th>
                        <th><input type="text" class="so-col-filter" data-so-filter="sales_order" placeholder="SO..."></th>
                    </tr>
                </thead>
                <tbody id="soRelatedLinesBody">
                    <tr><td colspan="9" class="so-related-empty">Open a quotation to see sales order items.</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="so-line-drawer" id="soLineDrawer" aria-hidden="true">
        <header class="so-line-head">
            <button type="button" class="btn-subdrawer-back" id="soLineBack" title="Back to sales order">
                <span class="material-icons-round">arrow_back</span>
                <span>Back</span>
            </button>
            <div class="so-line-head-mid">
                <div class="so-line-head-copy">
                    <span class="so-line-kicker" id="soLineKicker">Sales API line</span>
                    <h3 id="soLineTitle">—</h3>
                    <p id="soLineSub" hidden>Select a table row to load SAP line details</p>
                </div>
                <div class="so-line-badges" id="soLineFacts"></div>
            </div>
            <div class="so-head-pills">
                <span class="so-line-line-pill" id="soLineLineBadge" title="Sales order line">
                    <span class="material-icons-round">format_list_numbered</span>
                    <span>Line</span>
                    <strong id="soLineLineNum">—</strong>
                </span>
                <span class="so-line-so-pill" id="soLineSoBadge" title="Sales order">
                    <span class="material-icons-round">receipt_long</span>
                    <span>SO</span>
                    <strong id="soLineSoNum">—</strong>
                </span>
            </div>
            <button type="button" class="icon-btn sales-drawer-close-btn so-line-close-hidden" id="soLineClose" aria-label="Close line" hidden>
                <span class="material-icons-round">close</span>
            </button>
        </header>
        <div class="so-line-body">
        <nav class="sales-drawer-nav-cards" id="salesDrawerNavCards" role="tablist" aria-label="Order sections">
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
        </div>

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
            <div class="so-head-pills">
                <span class="so-line-line-pill subdrawer-so-pill" id="subDrawerLineBadge" title="Sales order line">
                    <span class="material-icons-round">format_list_numbered</span>
                    <span>Line</span>
                    <strong id="subDrawerLineNum">—</strong>
                </span>
                <span class="so-line-so-pill subdrawer-so-pill" id="subDrawerSoBadge" title="Sales order">
                    <span class="material-icons-round">receipt_long</span>
                    <span>SO</span>
                    <strong id="subDrawerSoNum">—</strong>
                </span>
            </div>
            <button type="button" class="icon-btn sales-drawer-close-btn so-line-close-hidden" id="subDrawerClose" aria-label="Close" title="Close" hidden>
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
    </div>
</aside>
