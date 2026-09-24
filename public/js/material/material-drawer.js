/* AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Sales-order material master panel
 */
(function () {
    window.KapisSales = window.KapisSales || {};
    window.KapisSales.modules = window.KapisSales.modules || [];
    window.KapisSales.modules.push(function installMaterialDrawer(env) {
        with (env) {
    /* ==========================================================================
       Material Panel & SAP Live Data Loader (ZI_MATERIALAPI_HUB_CDS)
    ========================================================================== */

    /**
     * Render the material panel
     * @param {Object} record - The record
     * @param {boolean} isLoading - Whether the panel is loading
     * @param {string} error - The error message
     * @param {Object[]} matData - The material data
     * @param {Object} rawPayload - The raw payload
     * @param {string} mode - The mode
     */
    function renderMaterialPanel(record, isLoading = false, error = null, matData = null, rawPayload = null, mode = 'material') {
        if (!panelMaterial) return;
        const mat = String(record?.material || '').trim();
        const isDateRange = (mode === 'date_range');

        if (isLoading) {
            panelMaterial.innerHTML = kpiPanelLoaderHtml(
                'Loading Material Master',
                `Fetching SAP material master for ${escapeHtml(mat)}…`,
                '#d97706'
            );
            return;
        }

        if (error) {
            panelMaterial.innerHTML = `
                <div class="sap-mat-modes" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
                    <button type="button" class="sap-mode-btn ${!isDateRange ? 'active' : ''}" data-mode="material" style="padding:0.42rem 0.95rem;border-radius:9999px;font-size:0.78rem;font-weight:700;cursor:pointer;border:1.5px solid #d97706;background:#d97706;color:#fff;display:inline-flex;align-items:center;gap:0.4rem">
                        <span class="material-icons-round" style="font-size:1.05rem">inventory_2</span> Order Material (${escapeHtml(mat)})
                    </button>
                    <button type="button" class="sap-mode-btn ${isDateRange ? 'active' : ''}" data-mode="date_range" style="padding:0.42rem 0.95rem;border-radius:9999px;font-size:0.78rem;font-weight:700;cursor:pointer;border:1.5px solid #cbd5e1;background:#fff;color:#475569;display:inline-flex;align-items:center;gap:0.4rem">
                        <span class="material-icons-round" style="font-size:1.05rem">date_range</span> All SAP Created (01–07 Sep 2026)
                    </button>
                </div>
                <div class="drawer-section-card" style="text-align:center;padding:2.5rem 1rem">
                    <span class="material-icons-round" style="font-size:2.6rem;color:#ef4444;margin-bottom:0.6rem;display:block">error_outline</span>
                    <div style="font-size:1rem;font-weight:700;color:#0f172a;margin-bottom:0.35rem">SAP Material API Notice</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-bottom:1.25rem">${escapeHtml(error)}</div>
                    <button type="button" class="btn-drawer-retry-mat" style="padding:0.5rem 1.2rem;background:#d97706;color:#fff;border:none;border-radius:0.55rem;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.4rem">
                        <span class="material-icons-round" style="font-size:1rem">sync</span> Retry SAP Sync
                    </button>
                </div>
            `;
            const retryBtn = panelMaterial.querySelector('.btn-drawer-retry-mat');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadDrawerMaterial(record, true, mode));
            }
            const modeBtns = panelMaterial.querySelectorAll('.sap-mode-btn');
            modeBtns.forEach(btn => {
                btn.addEventListener('click', () => loadDrawerMaterial(record, false, btn.dataset.mode));
            });
            return;
        }

        const items = matData || [];
        const rawJsonString = JSON.stringify(rawPayload || { data: items }, null, 2);
        const sapMatItem = (!isDateRange && items.length) ? items[0] : null;
        const sourceTab = record?._materialSourceTab || '';
        const backBtnHtml = sourceTab === 'bom'
            ? `<button type="button" class="btn-back-to-bom" style="padding:0.38rem 0.85rem;border-radius:0.5rem;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;gap:0.3rem;color:#0f766e">
                    <span class="material-icons-round" style="font-size:1rem">arrow_back</span> Back to BOM
               </button>`
            : '';

        panelMaterial.innerHTML = `
            <!-- Mode Switchers & Actions -->
          
            <!-- Top Controls: Mode Switchers & View Toggles -->
            <div id="matDataView" class="sap-view-pane">
                ${!isDateRange ? `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.85rem;flex-wrap:wrap">
                        ${backBtnHtml}
                        <span style="font-size:0.78rem;color:#64748b">SAP ZI_MaterialAPI_HUB · Product eq '${escapeHtml(mat)}'</span>
                    </div>
                    ${!items.length ? `
                        <div class="drawer-section-card" style="text-align:center;padding:2rem 1rem;margin-bottom:1rem">
                            <div style="font-weight:700;color:#0f172a;margin-bottom:0.35rem">No master record for this material</div>
                            <div style="color:#64748b;font-size:0.85rem">${escapeHtml(rawPayload?.message || 'SAP returned no ZI_MaterialAPI_HUB rows for this Product.')}</div>
                        </div>
                    ` : ''}
                ` : ''}
                ${isDateRange ? `
                    <div class="drawer-section-card" style="padding:0;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.03)">
                        <!-- Table Header Point with Total Values Badge, Search & Sync -->
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.1rem 1.25rem;border-bottom:1px solid #f1f5f9;flex-wrap:wrap">
                            <div style="display:flex;align-items:center;gap:0.65rem;flex-wrap:wrap">
                                <span class="material-icons-round" style="color:#d97706;font-size:1.25rem">list_alt</span>
                                <span style="font-size:0.95rem;font-weight:700;color:#0f172a">SAP Created Materials (01–07 Sep 2026)</span>
                                <span class="so-badge-pill" id="matTotalBadge" style="background:#fef3c7;color:#b45309;border-color:#fde68a;font-weight:700;font-size:0.8rem;padding:0.25rem 0.75rem">
                                    Total: ${items.length} records
                                </span>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.6rem">
                                <input type="text" class="mat-search-input" placeholder="Search Product or Description…" style="padding:0.42rem 0.85rem;border:1px solid #cbd5e1;border-radius:0.55rem;font-size:0.82rem;outline:none;min-width:240px;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03)"/>
                            </div>
                        </div>

                        <div class="drawer-components-table-wrap" style="max-height:none;overflow-x:auto">
                            <table class="drawer-components-table mat-items-table table-bordered">
                                <thead>
                                    <tr class="mat-header-row">
                                        <th class="col-sortable" data-sort="Product" title="Click to sort by Product" style="width:160px">
                                            <span>Product</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                        <th class="col-sortable" data-sort="ProductName" title="Click to sort by Product Name / Style">
                                            <span>Product Name / Style</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                        <th class="col-sortable" data-sort="ProductType" title="Click to sort by Type" style="width:90px">
                                            <span>Type</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                        <th class="col-sortable" data-sort="Plant" title="Click to sort by Plant" style="width:105px">
                                            <span>Plant</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                        <th class="col-sortable" data-sort="StorageLocation" title="Click to sort by Storage Loc" style="width:105px">
                                            <span>Storage Loc</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                        <th class="col-sortable" data-sort="BaseUnit" title="Click to sort by Unit" style="width:75px">
                                            <span>Unit</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                        <th class="col-sortable" data-sort="GrossWeight" title="Click to sort by Gross Weight" style="text-align:right;width:95px">
                                            <span>Gross Wt</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                        <th class="col-sortable" data-sort="CreationDate" title="Click to sort by Creation Date" style="width:140px">
                                            <span>Creation Date</span>
                                            <span class="sort-icon material-icons-round">unfold_more</span>
                                        </th>
                                    </tr>
                                    <tr class="mat-col-filter-row">
                                        <th><input type="text" class="mat-col-filter-input" data-filter-col="Product" placeholder="Filter product..."/></th>
                                        <th><input type="text" class="mat-col-filter-input" data-filter-col="ProductName" placeholder="Filter style / name..."/></th>
                                        <th>
                                            <select class="mat-col-filter-select" data-filter-col="ProductType" id="matColFilterType">
                                                <option value="">All Types</option>
                                            </select>
                                        </th>
                                        <th>
                                            <select class="mat-col-filter-select" data-filter-col="Plant" id="matColFilterPlant">
                                                <option value="">All Plants</option>
                                            </select>
                                        </th>
                                        <th><input type="text" class="mat-col-filter-input" data-filter-col="StorageLocation" placeholder="Loc..."/></th>
                                        <th>
                                            <select class="mat-col-filter-select" data-filter-col="BaseUnit" id="matColFilterUnit">
                                                <option value="">All Units</option>
                                            </select>
                                        </th>
                                        <th><input type="text" class="mat-col-filter-input" data-filter-col="GrossWeight" placeholder="Min wt..." style="text-align:right"/></th>
                                        <th>
                                            <div style="display:flex;align-items:center;gap:0.25rem">
                                                <input type="text" class="mat-col-filter-input" data-filter-col="CreationDate" placeholder="Filter date..."/>
                                                <button type="button" class="btn-clear-mat-filters" id="btnClearMatFilters" title="Clear all column filters">
                                                    <span class="material-icons-round" style="font-size:13px">clear</span>
                                                </button>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="matTableBody">
                                    <!-- Populated dynamically by page -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination Bar -->
                        <div class="bom-pagination-wrap" id="matPaginationWrap">
                            <div class="bom-pagination-info" id="matPaginationInfo">
                                Showing 0 to 0 of 0 records
                            </div>
                            <div class="bom-pagination-btns" id="matPaginationBtns">
                                <!-- Page buttons -->
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="drawer-section-card">
                        <div class="drawer-sec-header">
                            <div class="drawer-sec-title-wrap">
                                <span class="material-icons-round drawer-sec-icon" style="color:#d97706">inventory_2</span>
                                <h4 class="drawer-sec-title">Material Master Specifications</h4>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.5rem">
                                <span class="so-badge-pill" style="background:#fffbeb;color:#b45309;border-color:#fde68a;font-family:monospace;font-weight:700">${escapeHtml(mat)}</span>
                                <span class="so-badge-pill" style="background:#ecfdf5;color:#047857;border-color:#a7f3d0;font-weight:700"><span class="pulse-dot"></span> Live SAP</span>
                            </div>
                        </div>
                        <div class="drawer-info-grid">
                            <div class="drawer-info-item full-width">
                                <span class="info-lbl">Material Code / Product Number</span>
                                <span class="info-val" style="font-size:1.08rem;font-weight:700;color:#0f172a;font-family:monospace">${escapeHtml(sapMatItem?.Product || mat)}</span>
                            </div>
                            <div class="drawer-info-item full-width">
                                <span class="info-lbl">Description / Style Name</span>
                                <span class="info-val" style="font-weight:600;color:#0f172a">${escapeHtml(sapMatItem?.ProductName || record?.style || record?.material || '—')}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Product Type</span>
                                <span class="info-val">${escapeHtml(sapMatItem?.ProductType || record?.item_type || '—')}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Product Group</span>
                                <span class="info-val">${escapeHtml(sapMatItem?.ProductGroup || record?.material_group || '—')}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Brand</span>
                                <span class="info-val">${escapeHtml(sapMatItem?.Brand || '—')}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Product Category</span>
                                <span class="info-val">${escapeHtml(sapMatItem?.ProductCategory || '—')}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Base Unit of Measure</span>
                                <span class="info-val highlight-amber">${escapeHtml(sapMatItem?.BaseUnit || record?.base_unit || record?.unit || 'EA')}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Gross Weight</span>
                                <span class="info-val">${sapMatItem?.GrossWeight ? fmtRawNum(sapMatItem.GrossWeight) + ' ' + escapeHtml(sapMatItem.WeightUnit || 'G') : '—'}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Creation Date</span>
                                <span class="info-val">${escapeHtml(fmtSapDate(sapMatItem?.CreationDate) || sapMatItem?.CreationDate || '—')}</span>
                            </div>
                            <div class="drawer-info-item">
                                <span class="info-lbl">Last Change Date</span>
                                <span class="info-val">${escapeHtml(fmtSapDate(sapMatItem?.LastChangeDate) || sapMatItem?.LastChangeDate || '—')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="drawer-section-card">
                        <div class="drawer-sec-header">
                            <div class="drawer-sec-title-wrap">
                                <span class="material-icons-round drawer-sec-icon" style="color:#d97706">domain</span>
                                <h4 class="drawer-sec-title">Plant &amp; Storage Allocations (${items.length || 1} Plant Records)</h4>
                            </div>
                            ${getPlantBadgeHtml(sapMatItem?.Plant || record?.plant)}
                        </div>
                        ${items.length > 1 ? `
                            <div class="drawer-components-table-wrap" style="overflow-x:auto;margin-top:0.75rem">
                                <table class="drawer-components-table table-bordered">
                                    <thead>
                                        <tr>
                                            <th style="width:120px">Plant</th>
                                            <th style="width:140px">Storage Loc</th>
                                            <th style="width:100px">Type</th>
                                            <th style="width:90px">Base Unit</th>
                                            <th style="width:110px;text-align:right">Gross Wt</th>
                                            <th>Batch Mgmt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${items.map(it => `
                                            <tr>
                                                <td>${getPlantBadgeHtml(it.Plant || record?.plant)}</td>
                                                <td><span style="font-family:monospace;font-weight:700;color:#0f172a">${escapeHtml(it.StorageLocation || '—')}</span></td>
                                                <td><span class="proc-badge-tag">${escapeHtml(it.ProductType || '—')}</span></td>
                                                <td>${escapeHtml(it.BaseUnit || 'EA')}</td>
                                                <td style="text-align:right">${it.GrossWeight ? fmtRawNum(it.GrossWeight) + ' ' + escapeHtml(it.WeightUnit || 'G') : '—'}</td>
                                                <td>${it.IsBatchManagementRequired === '1' ? '<span style="color:#059669;font-weight:700">Required</span>' : '<span style="color:#94a3b8">No</span>'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="drawer-info-grid">
                                <div class="drawer-info-item">
                                    <span class="info-lbl">Plant</span>
                                    <span class="info-val">${escapeHtml(sapMatItem?.Plant || record?.plant || '—')}</span>
                                </div>
                                <div class="drawer-info-item">
                                    <span class="info-lbl">Storage Location</span>
                                    <span class="info-val">${escapeHtml(sapMatItem?.StorageLocation || record?.storage_location || '—')}</span>
                                </div>
                                <div class="drawer-info-item">
                                    <span class="info-lbl">Batch</span>
                                    <span class="info-val">${escapeHtml(record?.batch || '—')}</span>
                                </div>
                                <div class="drawer-info-item">
                                    <span class="info-lbl">Division</span>
                                    <span class="info-val">${escapeHtml(record?.division || '—')}${record?.division_code ? ' (' + escapeHtml(record.division_code) + ')' : ''}</span>
                                </div>
                                <div class="drawer-info-item">
                                    <span class="info-lbl">Base Unit of Measure</span>
                                    <span class="info-val highlight-amber">${escapeHtml(sapMatItem?.BaseUnit || record?.base_unit || record?.unit || 'EA')}</span>
                                </div>
                                <div class="drawer-info-item">
                                    <span class="info-lbl">Gross Weight</span>
                                    <span class="info-val">${sapMatItem?.GrossWeight ? fmtRawNum(sapMatItem.GrossWeight) + ' ' + escapeHtml(sapMatItem.WeightUnit || 'KG') : '—'}</span>
                                </div>
                            </div>
                        `}
                    </div>
                `}
            </div>

            <div id="matRawView" class="sap-view-pane" style="display:none">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem">
                    <span style="font-size:0.8rem;color:#64748b;font-weight:600">Payload size: ${items.length} entities</span>
                    <button type="button" class="btn-copy-mat-json" style="padding:0.4rem 0.85rem;border-radius:0.5rem;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:0.78rem;font-weight:600;display:inline-flex;align-items:center;gap:0.35rem">
                        <span class="material-icons-round" style="font-size:0.95rem">content_copy</span> Copy Raw JSON
                    </button>
                </div>
                <pre class="sap-raw-json-view">${escapeHtml(rawJsonString)}</pre>
            </div>
        `;

        // Sync & Copy JSON button listeners
        const syncBtn = panelMaterial.querySelector('.btn-sync-mat-data');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => loadDrawerMaterial(record, true, mode));
        }

        const backBomBtn = panelMaterial.querySelector('.btn-back-to-bom');
        if (backBomBtn) {
            backBomBtn.addEventListener('click', () => openSubDrawer('bom'));
        }

        const copyJsonBtn = panelMaterial.querySelector('.btn-copy-mat-json');
        if (copyJsonBtn) {
            copyJsonBtn.addEventListener('click', () => copyTextToClipboard(rawJsonString, copyJsonBtn));
        }

        const modeBtns = panelMaterial.querySelectorAll('.sap-mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetMode = btn.getAttribute('data-mode');
                loadDrawerMaterial(record, false, targetMode);
            });
        });

        const viewBtns = panelMaterial.querySelectorAll('.sap-view-toggle-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                const dv = panelMaterial.querySelector('#matDataView');
                const rv = panelMaterial.querySelector('#matRawView');
                if (dv) dv.style.display = (targetId === 'matDataView') ? 'block' : 'none';
                if (rv) rv.style.display = (targetId === 'matRawView') ? 'block' : 'none';
            });
        });

        if (isDateRange) {
            // Helper to extract timestamp for date sorting
            function getSapTimestamp(d) {
                if (!d) return 0;
                const s = String(d).trim();
                const m = s.match(/\/Date\((-?\d+)(?:[+-]\d+)?\)\//);
                if (m) return parseInt(m[1], 10) || 0;
                if (s.length === 8 && /^\d{8}$/.test(s)) {
                    return new Date(s.substring(0, 4) + '-' + s.substring(4, 6) + '-' + s.substring(6, 8)).getTime() || 0;
                }
                const t = Date.parse(s);
                return isNaN(t) ? 0 : t;
            }

            // 20 items per page Pagination for Material List
            const PAGE_SIZE = 20;
            let currentMatPage = 1;
            let currentMatSortCol = null;
            let currentMatSortDir = 'asc';
            const activeMatColFilters = {
                Product: '',
                ProductName: '',
                ProductType: '',
                Plant: '',
                StorageLocation: '',
                BaseUnit: '',
                GrossWeight: '',
                CreationDate: ''
            };
            let activeGlobalSearch = '';
            let activeFilteredItems = items.slice();

            const tbodyEl = panelMaterial.querySelector('#matTableBody');
            const infoEl = panelMaterial.querySelector('#matPaginationInfo');
            const btnsEl = panelMaterial.querySelector('#matPaginationBtns');
            const totalBadgeEl = panelMaterial.querySelector('#matTotalBadge');

            // Populate Filter Dropdowns (ProductType, Plant, BaseUnit)
            function populateMatDropdown(id, prop, label) {
                const sel = panelMaterial.querySelector('#' + id);
                if (!sel) return;
                const uniqueVals = Array.from(new Set(items.map(m => String(m[prop] || '').trim()).filter(Boolean))).sort();
                sel.innerHTML = `<option value="">${label}</option>` + uniqueVals.map(v =>
                    `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`
                ).join('');
            }
            populateMatDropdown('matColFilterType', 'ProductType', 'All Types');
            populateMatDropdown('matColFilterPlant', 'Plant', 'All Plants');
            populateMatDropdown('matColFilterUnit', 'BaseUnit', 'All Units');

            // Render material list page
            function renderMatPage(page) {
                const totalItems = activeFilteredItems.length;
                const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
                currentMatPage = Math.max(1, Math.min(page, totalPages));

                const startIdx = (currentMatPage - 1) * PAGE_SIZE;
                const endIdx = Math.min(startIdx + PAGE_SIZE, totalItems);
                const pageData = activeFilteredItems.slice(startIdx, endIdx);

                if (!pageData.length) {
                    tbodyEl.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align:center;padding:2.5rem 1rem;color:#64748b;font-size:0.88rem">
                                ${items.length ? 'No materials match your search or column filter criteria.' : 'No materials found matching CreationDate in SAP.'}
                            </td>
                        </tr>
                    `;
                } else {
                    tbodyEl.innerHTML = pageData.map(m => {
                        const prod = String(m.Product || '').trim();
                        const prodCell = prod
                            ? `<button type="button" class="bom-material-link" data-material="${escapeHtml(prod)}" title="View SAP material master for ${escapeHtml(prod)}">${escapeHtml(prod)}</button>`
                            : '<span style="color:#94a3b8">—</span>';
                        return `
                        <tr class="mat-data-row">
                            <td>${prodCell}</td>
                            <td>${escapeHtml(m.ProductName || m.Product_Text || '—')}</td>
                            <td><span class="proc-badge-tag">${escapeHtml(m.ProductType || '—')}</span></td>
                            <td>${getPlantBadgeHtml(m.Plant)}</td>
                            <td>${escapeHtml(m.StorageLocation || '—')}</td>
                            <td>${escapeHtml(m.BaseUnit || 'EA')}</td>
                            <td style="text-align:right">${fmtRawNum(m.GrossWeight)}</td>
                            <td style="white-space:nowrap;font-size:0.75rem;color:#64748b">${escapeHtml(fmtSapDate(m.CreationDate) || m.CreationDate || '—')}</td>
                        </tr>
                    `;
                    }).join('');

                    tbodyEl.querySelectorAll('.bom-material-link').forEach((btn) => {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openMaterialDetailsFor(btn.getAttribute('data-material'), 'material');
                        });
                    });
                }

                // Update info counter
                if (infoEl) {
                    if (totalItems === 0) {
                        infoEl.innerHTML = 'Showing <strong>0</strong> records';
                    } else {
                        infoEl.innerHTML = `Showing <strong>${startIdx + 1}</strong> to <strong>${endIdx}</strong> of <strong>${totalItems}</strong> records (Page <strong>${currentMatPage}</strong> of <strong>${totalPages}</strong>)`;
                    }
                }

                // Build pagination buttons
                if (btnsEl) {
                    if (totalPages <= 1) {
                        btnsEl.innerHTML = '';
                        return;
                    }

                    let btnsHtml = '';

                    // Prev button
                    btnsHtml += `
                        <button type="button" class="bom-page-btn btn-prev" ${currentMatPage === 1 ? 'disabled' : ''} title="Previous Page">
                            <span class="material-icons-round" style="font-size:0.95rem">chevron_left</span>
                        </button>
                    `;

                    // Calculate pages to show with windowing
                    const maxButtons = 5;
                    let startPage = Math.max(1, currentMatPage - Math.floor(maxButtons / 2));
                    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                    if (endPage - startPage + 1 < maxButtons) {
                        startPage = Math.max(1, endPage - maxButtons + 1);
                    }

                    if (startPage > 1) {
                        btnsHtml += `<button type="button" class="bom-page-btn" data-page="1">1</button>`;
                        if (startPage > 2) {
                            btnsHtml += `<span class="bom-page-ellipsis">…</span>`;
                        }
                    }

                    for (let i = startPage; i <= endPage; i++) {
                        btnsHtml += `
                            <button type="button" class="bom-page-btn ${i === currentMatPage ? 'active' : ''}" data-page="${i}">
                                ${i}
                            </button>
                        `;
                    }

                    if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                            btnsHtml += `<span class="bom-page-ellipsis">…</span>`;
                        }
                        btnsHtml += `<button type="button" class="bom-page-btn" data-page="${totalPages}">${totalPages}</button>`;
                    }

                    // Next button
                    btnsHtml += `
                        <button type="button" class="bom-page-btn btn-next" ${currentMatPage === totalPages ? 'disabled' : ''} title="Next Page">
                            <span class="material-icons-round" style="font-size:0.95rem">chevron_right</span>
                        </button>
                    `;

                    btnsEl.innerHTML = btnsHtml;

                    // Event listeners for page buttons
                    btnsEl.querySelector('.btn-prev')?.addEventListener('click', () => renderMatPage(currentMatPage - 1));
                    btnsEl.querySelector('.btn-next')?.addEventListener('click', () => renderMatPage(currentMatPage + 1));
                    btnsEl.querySelectorAll('[data-page]').forEach(b => {
                        b.addEventListener('click', () => {
                            const p = parseInt(b.dataset.page, 10);
                            if (p && p !== currentMatPage) renderMatPage(p);
                        });
                    });
                }
            }

            // Apply filter and sort
            function applyFiltersAndSort() {
                // 1. Filter
                let filtered = items.filter(m => {
                    // Global search
                    if (activeGlobalSearch) {
                        const prod = String(m.Product || '').toLowerCase();
                        const name = String(m.ProductName || m.Product_Text || '').toLowerCase();
                        const plant = String(m.Plant || '').toLowerCase();
                        if (!prod.includes(activeGlobalSearch) && !name.includes(activeGlobalSearch) && !plant.includes(activeGlobalSearch)) {
                            return false;
                        }
                    }
                    // Column filters
                    if (activeMatColFilters.Product) {
                        const p = String(m.Product || '').toLowerCase();
                        if (!p.includes(activeMatColFilters.Product.toLowerCase())) return false;
                    }
                    if (activeMatColFilters.ProductName) {
                        const name = String(m.ProductName || m.Product_Text || '').toLowerCase();
                        if (!name.includes(activeMatColFilters.ProductName.toLowerCase())) return false;
                    }
                    if (activeMatColFilters.ProductType) {
                        const t = String(m.ProductType || '').toLowerCase();
                        if (t !== activeMatColFilters.ProductType.toLowerCase()) return false;
                    }
                    if (activeMatColFilters.Plant) {
                        const pl = String(m.Plant || '').toUpperCase();
                        if (pl !== activeMatColFilters.Plant.toUpperCase()) return false;
                    }
                    if (activeMatColFilters.StorageLocation) {
                        const loc = String(m.StorageLocation || '').toLowerCase();
                        if (!loc.includes(activeMatColFilters.StorageLocation.toLowerCase())) return false;
                    }
                    if (activeMatColFilters.BaseUnit) {
                        const u = String(m.BaseUnit || '').toUpperCase();
                        if (u !== activeMatColFilters.BaseUnit.toUpperCase()) return false;
                    }
                    if (activeMatColFilters.GrossWeight) {
                        const minWt = parseFloat(activeMatColFilters.GrossWeight);
                        if (!isNaN(minWt) && (parseFloat(m.GrossWeight) || 0) < minWt) return false;
                    }
                    if (activeMatColFilters.CreationDate) {
                        const dtRaw = String(m.CreationDate || '').toLowerCase();
                        const dtFmt = fmtSapDate(m.CreationDate).toLowerCase();
                        const q = activeMatColFilters.CreationDate.toLowerCase();
                        if (!dtRaw.includes(q) && !dtFmt.includes(q)) return false;
                    }
                    return true;
                });

                // 2. Sort
                if (currentMatSortCol) {
                    filtered.sort((a, b) => {
                        if (currentMatSortCol === 'GrossWeight') {
                            const vA = parseFloat(a.GrossWeight) || 0;
                            const vB = parseFloat(b.GrossWeight) || 0;
                            return currentMatSortDir === 'asc' ? vA - vB : vB - vA;
                        }
                        if (currentMatSortCol === 'CreationDate') {
                            const vA = getSapTimestamp(a.CreationDate);
                            const vB = getSapTimestamp(b.CreationDate);
                            return currentMatSortDir === 'asc' ? vA - vB : vB - vA;
                        }
                        let vA, vB;
                        if (currentMatSortCol === 'ProductName') {
                            vA = String(a.ProductName || a.Product_Text || '').toLowerCase();
                            vB = String(b.ProductName || b.Product_Text || '').toLowerCase();
                        } else {
                            vA = String(a[currentMatSortCol] || '').toLowerCase();
                            vB = String(b[currentMatSortCol] || '').toLowerCase();
                        }
                        const cmp = vA.localeCompare(vB, undefined, { numeric: true });
                        return currentMatSortDir === 'asc' ? cmp : -cmp;
                    });
                }

                activeFilteredItems = filtered;
                renderMatPage(1);

                // Update total count badge
                if (totalBadgeEl) {
                    totalBadgeEl.textContent = (activeFilteredItems.length !== items.length)
                        ? `Total: ${activeFilteredItems.length} of ${items.length} records`
                        : `Total: ${items.length} records`;
                }
            }

            // Update table header sort icons
            function updateSortHeaders() {
                panelMaterial.querySelectorAll('.mat-items-table thead th.col-sortable').forEach(th => {
                    const col = th.dataset.sort;
                    const icon = th.querySelector('.sort-icon');
                    th.classList.remove('is-sorted-asc', 'is-sorted-desc');
                    if (col === currentMatSortCol) {
                        th.classList.add(currentMatSortDir === 'asc' ? 'is-sorted-asc' : 'is-sorted-desc');
                        if (icon) icon.textContent = (currentMatSortDir === 'asc' ? 'arrow_upward' : 'arrow_downward');
                    } else {
                        if (icon) icon.textContent = 'unfold_more';
                    }
                });
            }

            // Click listener for sortable headers
            panelMaterial.querySelectorAll('.mat-items-table thead th.col-sortable').forEach(th => {
                th.addEventListener('click', (e) => {
                    if (e.target.closest('input, select, button')) return;
                    const col = th.dataset.sort;
                    if (!col) return;
                    if (currentMatSortCol === col) {
                        currentMatSortDir = (currentMatSortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                        currentMatSortCol = col;
                        currentMatSortDir = 'asc';
                    }
                    updateSortHeaders();
                    applyFiltersAndSort();
                });
            });

            // Column filter input events
            panelMaterial.querySelectorAll('.mat-col-filter-input').forEach(inp => {
                inp.addEventListener('input', () => {
                    const col = inp.dataset.filterCol;
                    if (col) {
                        activeMatColFilters[col] = inp.value.trim();
                        applyFiltersAndSort();
                    }
                });
            });

            // Column filter select dropdown events
            panelMaterial.querySelectorAll('.mat-col-filter-select').forEach(sel => {
                sel.addEventListener('change', () => {
                    const col = sel.dataset.filterCol;
                    if (col) {
                        activeMatColFilters[col] = sel.value.trim();
                        applyFiltersAndSort();
                    }
                });
            });

            // Clear all column filters button
            const clearBtn = panelMaterial.querySelector('#btnClearMatFilters');
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    Object.keys(activeMatColFilters).forEach(k => activeMatColFilters[k] = '');
                    panelMaterial.querySelectorAll('.mat-col-filter-input').forEach(i => { i.value = ''; });
                    panelMaterial.querySelectorAll('.mat-col-filter-select').forEach(s => { s.value = ''; });
                    applyFiltersAndSort();
                });
            }

            // Global search input
            const searchInput = panelMaterial.querySelector('.mat-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    activeGlobalSearch = searchInput.value.toLowerCase().trim();
                    applyFiltersAndSort();
                });
            }

            // Initial render
            renderMatPage(1);
        }
    }

    /**
     * Load the material drawer
     * @param {Object} record - The record
     * @param {boolean} forceReload - Whether to force reload the drawer
     * @param {string} mode - The mode
     * @returns {void}
     */
    async function loadDrawerMaterial(record, forceReload = false, mode = 'material') {
        if (!record) return;
        let working = record;
        if (mode !== 'date_range' && isBlankCode(working.material)) {
            working = resolveWorkingRecord(record);
        }
        const mat = String(working.material || '').trim();
        if (mode !== 'date_range' && isBlankCode(mat)) {
            renderApiMissing(panelMaterial, 'Material required', 'Select a quotation item with a material code to load Material Master.');
            if (dncMaterialVal) dncMaterialVal.textContent = '—';
            return;
        }
        const cacheKey = (mode === 'date_range') ? '__date_range_sep2026__' : mat;

        if (!forceReload && matCacheByMat[cacheKey]) {
            renderMaterialPanel(working, false, null, matCacheByMat[cacheKey].data, matCacheByMat[cacheKey].raw, mode);
            if (dncMaterialVal && mode === 'date_range') {
                dncMaterialVal.textContent = `${matCacheByMat[cacheKey].data.length} materials`;
            }
            return;
        }

        renderMaterialPanel(working, true, null, null, null, mode);

        const endpoint = cfg.materialApiUrl || '/sales/material-api';
        const query = (mode === 'date_range')
            ? 'date_range=1'
            : `material=${encodeURIComponent(mat)}`;

        try {
            const res = await fetch(`${endpoint}?${query}&_=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load material data`);
            const payload = await res.json();
            if (payload.status === 'error' || !payload.data) {
                const err = payload.error || 'No material records returned from SAP';
                matCacheByMat[cacheKey] = { data: [], raw: payload };
                renderMaterialPanel(working, false, err, [], payload, mode);
            } else {
                matCacheByMat[cacheKey] = { data: payload.data, raw: payload };
                renderMaterialPanel(working, false, null, payload.data, payload, mode);
                if (dncMaterialVal && mode === 'date_range') {
                    dncMaterialVal.textContent = `${payload.data.length} materials`;
                }
            }
        } catch (err) {
            renderMaterialPanel(working, false, err.message, [], null, mode);
        }
    }

    /* ==========================================================================
       Procurement Panel & SAP Live Data Loader (ZBUSINESS_API_SRV)
    ========================================================================== */
        env.renderMaterialPanel = renderMaterialPanel;
        env.loadDrawerMaterial = loadDrawerMaterial;
        }
    });
})();
