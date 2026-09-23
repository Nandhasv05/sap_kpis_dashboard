/* AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : BOM panel and SAP COOIS loader
 */
(function () {
    window.KapisSales = window.KapisSales || {};
    window.KapisSales.modules = window.KapisSales.modules || [];
    window.KapisSales.modules.push(function installBom(env) {
        with (env) {
    /* ==========================================================================
       BOM Panel & SAP Live Data Loader (ZC_COOISCOMP_HUB_CDS)
    ========================================================================== */

    function bomRowLineNo(row) {
        return row?.SalesOrderItem || row?.SalesDocumentItem || row?.SalesOrderItemNumber || row?.Item || '';
    }

    function filterBomByLine(rows, lineItem) {
        const list = Array.isArray(rows) ? rows : [];
        const rawLine = String(lineItem ?? '').trim();
        if (!rawLine || rawLine === '—') return list;
        const line = normLineNo(rawLine);
        const keyed = list.filter((c) => String(bomRowLineNo(c)).trim() !== '');
        if (!keyed.length) return list;
        return list.filter((c) => normLineNo(bomRowLineNo(c)) === line);
    }

    function renderBomPanel(record, isLoading = false, error = null, bomData = null, rawPayload = null) {
        if (!panelBom) return;
        const so = String(record?.sales_order || '').trim();

        if (isLoading) {
            panelBom.innerHTML = kpiPanelLoaderHtml(
                'Loading BOM',
                `Fetching Bill of Materials for Sales Order #${escapeHtml(so)}${record?.line_item ? ` · Line ${escapeHtml(String(record.line_item))}` : ''}…`,
                '#0d9488'
            );
            return;
        }

        if (error) {
            panelBom.innerHTML = `
                <div class="drawer-section-card" style="text-align:center;padding:2.5rem 1rem">
                    <span class="material-icons-round" style="font-size:2.6rem;color:#ef4444;margin-bottom:0.6rem;display:block">error_outline</span>
                    <div style="font-size:1rem;font-weight:700;color:#0f172a;margin-bottom:0.35rem">SAP BOM Notice</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-bottom:1.25rem">${escapeHtml(error)}</div>
                    <button type="button" class="btn-drawer-retry-bom" style="padding:0.5rem 1.2rem;background:#0d9488;color:#fff;border:none;border-radius:0.55rem;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.4rem">
                        <span class="material-icons-round" style="font-size:1rem">sync</span> Retry SAP Sync
                    </button>
                </div>
            `;
            const retryBtn = panelBom.querySelector('.btn-drawer-retry-bom');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadDrawerBom(record, true));
            }
            return;
        }

        const comps = filterBomByLine(bomData || [], record?.line_item);
        let totalPlan = 0, totalPrd = 0, totalBomQty = 0;
        comps.forEach(c => {
            totalPlan += parseFloat(c.PlanQty || 0);
            totalPrd += parseFloat(c.PrdQty || 0);
            totalBomQty += parseFloat(c.BOMQuantity || 0);
        });

        const rawJsonString = JSON.stringify(rawPayload || { data: comps }, null, 2);

        panelBom.innerHTML = `
            <!-- Colorful BOM Stat Cards -->
            <div class="bom-stat-grid">
                <div class="bom-stat-card tone-teal">
                    <div class="bom-stat-icon-wrap">
                        <span class="material-icons-round" style="font-size:1.45rem">schema</span>
                    </div>
                    <div class="bom-stat-body">
                        <span class="bom-stat-label">Total Components</span>
                        <span class="bom-stat-val" id="bomStatComponents">${comps.length}</span>
                        <span class="bom-stat-sub" id="bomStatComponentsSub">BOM Line Items</span>
                    </div>
                </div>

                <div class="bom-stat-card tone-blue">
                    <div class="bom-stat-icon-wrap">
                        <span class="material-icons-round" style="font-size:1.45rem">assignment_turned_in</span>
                    </div>
                    <div class="bom-stat-body">
                        <span class="bom-stat-label">Plan Quantity</span>
                        <span class="bom-stat-val" id="bomStatPlan">${fmtRoundNum(totalPlan)}</span>
                        <span class="bom-stat-sub" id="bomStatPlanSub">Planned Demand</span>
                    </div>
                </div>

                <div class="bom-stat-card tone-emerald">
                    <div class="bom-stat-icon-wrap">
                        <span class="material-icons-round" style="font-size:1.45rem">factory</span>
                    </div>
                    <div class="bom-stat-body">
                        <span class="bom-stat-label">Prd Quantity</span>
                        <span class="bom-stat-val" id="bomStatPrd">${fmtRoundNum(totalPrd)}</span>
                        <span class="bom-stat-sub" id="bomStatPrdSub">Confirmed Produced</span>
                    </div>
                </div>

                <div class="bom-stat-card tone-purple">
                    <div class="bom-stat-icon-wrap">
                        <span class="material-icons-round" style="font-size:1.45rem">inventory_2</span>
                    </div>
                    <div class="bom-stat-body">
                        <span class="bom-stat-label">BOM Quantity</span>
                        <span class="bom-stat-val" id="bomStatBomQty">${fmtRoundNum(totalBomQty)}</span>
                        <span class="bom-stat-sub" id="bomStatBomSub">Total Component Ratio</span>
                    </div>
                </div>
            </div>

            <!-- Table View with 20 items per page & Pagination -->
            <div id="bomTableView" class="sap-view-pane">
                <div class="drawer-section-card" style="padding:0;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.03)">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.1rem 1.25rem;border-bottom:1px solid #f1f5f9;flex-wrap:wrap">
                        <div style="display:flex;align-items:center;gap:0.65rem;flex-wrap:wrap">
                            <span class="material-icons-round" style="color:#0d9488;font-size:1.25rem">format_list_bulleted</span>
                            <span style="font-size:0.95rem;font-weight:700;color:#0f172a">Bill of Materials Item Explosion</span>
                            <span class="so-badge-pill" id="bomTotalBadge" style="background:#ccfbf1;color:#0f766e;border-color:#99f6e4;font-weight:700;font-size:0.8rem;padding:0.25rem 0.75rem">
                                Total: ${comps.length} components
                            </span>
                        </div>
                        <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap">
                            <input type="text" class="bom-search-input" placeholder="Search Item or Material…" style="padding:0.42rem 0.85rem;border:1px solid #cbd5e1;border-radius:0.55rem;font-size:0.82rem;outline:none;min-width:220px;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03)"/>
                            <div class="bom-export" id="bomExport">
                                <button type="button" class="sales-export-btn bom-export-btn" id="bomExportBtn" aria-haspopup="menu" aria-expanded="false">
                                    <span class="material-icons-round">file_download</span>
                                    Export
                                    <span class="material-icons-round chev">expand_more</span>
                                </button>
                                <div class="sales-export-menu" id="bomExportMenu" hidden>
                                    <button type="button" data-bom-export="filtered">Filtered rows (CSV)</button>
                                    <button type="button" data-bom-export="all">All components (CSV)</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="drawer-components-table-wrap" style="max-height:none;overflow-x:auto">
                        <table class="drawer-components-table bom-items-table table-bordered">
                            <thead>
                                <tr class="bom-header-row">
                                    <th class="col-sortable" data-sort="Item" title="Click to sort by Item" style="width:110px">
                                        <span>Item</span>
                                        <span class="sort-icon material-icons-round">unfold_more</span>
                                    </th>
                                    <th class="col-sortable" data-sort="Material" title="Click to sort by Material">
                                        <span>Material</span>
                                        <span class="sort-icon material-icons-round">unfold_more</span>
                                    </th>
                                    <th class="col-sortable" data-sort="PlanQty" title="Click to sort by Plan Quantity" style="text-align:right;width:140px">
                                        <span>Plan Qty</span>
                                        <span class="sort-icon material-icons-round">unfold_more</span>
                                    </th>
                                    <th class="col-sortable" data-sort="PrdQty" title="Click to sort by Prd Quantity" style="text-align:right;width:140px">
                                        <span>Prd Qty</span>
                                        <span class="sort-icon material-icons-round">unfold_more</span>
                                    </th>
                                    <th class="col-sortable" data-sort="BOMQuantity" title="Click to sort by BOM Quantity" style="text-align:right;width:150px">
                                        <span>BOM Quantity</span>
                                        <span class="sort-icon material-icons-round">unfold_more</span>
                                    </th>
                                </tr>
                                <tr class="mat-col-filter-row bom-col-filter-row">
                                    <th><input type="text" class="mat-col-filter-input bom-col-filter-input" data-filter-col="Item" placeholder="Filter item..."/></th>
                                    <th><input type="text" class="mat-col-filter-input bom-col-filter-input" data-filter-col="Material" placeholder="Filter material..."/></th>
                                    <th><input type="text" class="mat-col-filter-input bom-col-filter-input" data-filter-col="PlanQty" placeholder="Min plan..." style="text-align:right"/></th>
                                    <th><input type="text" class="mat-col-filter-input bom-col-filter-input" data-filter-col="PrdQty" placeholder="Min prd..." style="text-align:right"/></th>
                                    <th>
                                        <div style="display:flex;align-items:center;gap:0.25rem">
                                            <input type="text" class="mat-col-filter-input bom-col-filter-input" data-filter-col="BOMQuantity" placeholder="Min bom..." style="text-align:right"/>
                                            <button type="button" class="btn-clear-mat-filters" id="btnClearBomFilters" title="Clear all column filters">
                                                <span class="material-icons-round" style="font-size:13px">clear</span>
                                            </button>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="bomTableBody">
                                <!-- Populated dynamically by page -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Bar -->
                    <div class="bom-pagination-wrap" id="bomPaginationWrap">
                        <div class="bom-pagination-info" id="bomPaginationInfo">
                            Showing 0 to 0 of 0 components
                        </div>
                        <div class="bom-pagination-btns" id="bomPaginationBtns">
                            <!-- Page buttons -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Raw JSON View -->
            <div id="bomRawView" class="sap-view-pane" style="display:none">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem">
                    <span style="font-size:0.8rem;color:#64748b;font-weight:600">Total entities returned: ${comps.length}</span>
                    <button type="button" class="btn-copy-bom-json" style="padding:0.4rem 0.85rem;border-radius:0.5rem;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:0.78rem;font-weight:600;display:inline-flex;align-items:center;gap:0.35rem">
                        <span class="material-icons-round" style="font-size:0.95rem">content_copy</span> Copy Raw JSON
                    </button>
                </div>
                <pre class="sap-raw-json-view">${escapeHtml(rawJsonString)}</pre>
            </div>
        `;

        // Sync & Copy JSON button listeners
        const syncBtn = panelBom.querySelector('.btn-sync-bom-data');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => loadDrawerBom(record, true));
        }

        const copyJsonBtn = panelBom.querySelector('.btn-copy-bom-json');
        if (copyJsonBtn) {
            copyJsonBtn.addEventListener('click', () => copyTextToClipboard(rawJsonString, copyJsonBtn));
        }

        // View tabs switcher
        const viewBtns = panelBom.querySelectorAll('.sap-view-toggle-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                const tv = panelBom.querySelector('#bomTableView');
                const rv = panelBom.querySelector('#bomRawView');
                if (tv) tv.style.display = (targetId === 'bomTableView') ? 'block' : 'none';
                if (rv) rv.style.display = (targetId === 'bomRawView') ? 'block' : 'none';
            });
        });

        // 20 items per page Pagination Implementation
        const PAGE_SIZE = 20;
        let currentBomPage = 1;
        let currentBomSortCol = null;
        let currentBomSortDir = 'asc';
        const activeBomColFilters = {
            Item: '',
            Material: '',
            PlanQty: '',
            PrdQty: '',
            BOMQuantity: ''
        };
        let activeBomGlobalSearch = '';
        let activeFilteredComps = comps.slice();

        const tbodyEl = panelBom.querySelector('#bomTableBody');
        const infoEl = panelBom.querySelector('#bomPaginationInfo');
        const btnsEl = panelBom.querySelector('#bomPaginationBtns');
        const totalBadgeEl = panelBom.querySelector('#bomTotalBadge');

        function sumBomRows(rows) {
            let plan = 0, prd = 0, bomQty = 0;
            (rows || []).forEach((c) => {
                plan += parseFloat(c.PlanQty || 0) || 0;
                prd += parseFloat(c.PrdQty || 0) || 0;
                bomQty += parseFloat(c.BOMQuantity || 0) || 0;
            });
            return { count: (rows || []).length, plan, prd, bomQty };
        }

        function updateBomStatCards(rows) {
            const t = sumBomRows(rows);
            const filtered = t.count !== comps.length;
            const setText = (id, value) => {
                const el = panelBom.querySelector(id);
                if (el) el.textContent = value;
            };
            setText('#bomStatComponents', String(t.count));
            setText('#bomStatPlan', fmtRoundNum(t.plan));
            setText('#bomStatPrd', fmtRoundNum(t.prd));
            setText('#bomStatBomQty', fmtRoundNum(t.bomQty));
            setText('#bomStatComponentsSub', filtered ? `${t.count} of ${comps.length} line items` : 'BOM Line Items');
            setText('#bomStatPlanSub', filtered ? 'Filtered planned demand' : 'Planned Demand');
            setText('#bomStatPrdSub', filtered ? 'Filtered produced qty' : 'Confirmed Produced');
            setText('#bomStatBomSub', filtered ? 'Filtered component ratio' : 'Total Component Ratio');
        }

        function bomRowsToCsv(rows) {
            const header = ['Item', 'Material', 'Plan Qty', 'Prd Qty', 'BOM Quantity'];
            const lines = [header.join(',')];
            (rows || []).forEach((c) => {
                lines.push([
                    c.Item ?? '',
                    c.Material ?? '',
                    c.PlanQty ?? '',
                    c.PrdQty ?? '',
                    c.BOMQuantity ?? '',
                ].map(csvEscape).join(','));
            });
            return lines.join('\r\n');
        }

        const exportWrap = panelBom.querySelector('#bomExport');
        const exportBtn = panelBom.querySelector('#bomExportBtn');
        const exportMenu = panelBom.querySelector('#bomExportMenu');
        function closeBomExportMenu() {
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
            if (open) {
                window.setTimeout(() => {
                    document.addEventListener('click', closeBomExportMenu, { once: true });
                }, 0);
            }
        });
        exportMenu?.querySelectorAll('[data-bom-export]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-bom-export');
                const rows = mode === 'all' ? comps : activeFilteredComps;
                const so = String(record?.sales_order || 'bom').trim();
                downloadCsv(`bom-${so}-${mode}-${Date.now()}.csv`, bomRowsToCsv(rows));
                closeBomExportMenu();
            });
        });

        function renderPage(page) {
            const totalItems = activeFilteredComps.length;
            const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
            currentBomPage = Math.max(1, Math.min(page, totalPages));

            const startIdx = (currentBomPage - 1) * PAGE_SIZE;
            const endIdx = Math.min(startIdx + PAGE_SIZE, totalItems);
            const pageData = activeFilteredComps.slice(startIdx, endIdx);

            if (!pageData.length) {
                tbodyEl.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center;padding:2.5rem 1rem;color:#64748b;font-size:0.88rem">
                            ${comps.length ? 'No components match your search or column filter criteria.' : `No BOM components found for sales order line ${escapeHtml(String(record?.line_item || '—'))}.`}
                        </td>
                    </tr>
                `;
            } else {
                tbodyEl.innerHTML = pageData.map(c => {
                    const matCode = String(c.Material || '').trim();
                    const matCell = matCode
                        ? `<button type="button" class="bom-material-link" data-material="${escapeHtml(matCode)}" title="View SAP material master for ${escapeHtml(matCode)}">${escapeHtml(matCode)}</button>`
                        : '<span style="color:#94a3b8">—</span>';
                    return `
                    <tr class="bom-data-row">
                        <td style="font-family:monospace;font-weight:600;color:#64748b">${escapeHtml(c.Item || '—')}</td>
                        <td>${matCell}</td>
                        <td style="text-align:right;font-weight:600">${fmtRoundNum(c.PlanQty)}</td>
                        <td style="text-align:right;color:#0d9488;font-weight:600">${fmtRoundNum(c.PrdQty)}</td>
                        <td style="text-align:right;color:#6366f1;font-weight:600">${fmtRoundNum(c.BOMQuantity)}</td>
                    </tr>
                `;
                }).join('');

                tbodyEl.querySelectorAll('.bom-material-link').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openMaterialDetailsFor(btn.getAttribute('data-material'), 'bom');
                    });
                });
            }

            // Update info counter
            if (infoEl) {
                if (totalItems === 0) {
                    infoEl.innerHTML = 'Showing <strong>0</strong> components';
                } else {
                    infoEl.innerHTML = `Showing <strong>${startIdx + 1}</strong> to <strong>${endIdx}</strong> of <strong>${totalItems}</strong> components (Page <strong>${currentBomPage}</strong> of <strong>${totalPages}</strong>)`;
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
                    <button type="button" class="bom-page-btn btn-prev" ${currentBomPage === 1 ? 'disabled' : ''} title="Previous Page">
                        <span class="material-icons-round" style="font-size:0.95rem">chevron_left</span>
                    </button>
                `;

                // Calculate pages to show with windowing
                const maxButtons = 5;
                let startPage = Math.max(1, currentBomPage - Math.floor(maxButtons / 2));
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
                        <button type="button" class="bom-page-btn ${i === currentBomPage ? 'active' : ''}" data-page="${i}">
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
                    <button type="button" class="bom-page-btn btn-next" ${currentBomPage === totalPages ? 'disabled' : ''} title="Next Page">
                        <span class="material-icons-round" style="font-size:0.95rem">chevron_right</span>
                    </button>
                `;

                btnsEl.innerHTML = btnsHtml;

                // Event listeners for page buttons
                btnsEl.querySelector('.btn-prev')?.addEventListener('click', () => renderPage(currentBomPage - 1));
                btnsEl.querySelector('.btn-next')?.addEventListener('click', () => renderPage(currentBomPage + 1));
                btnsEl.querySelectorAll('[data-page]').forEach(b => {
                    b.addEventListener('click', () => {
                        const p = parseInt(b.dataset.page, 10);
                        if (p && p !== currentBomPage) renderPage(p);
                    });
                });
            }
        }

        function applyBomFiltersAndSort() {
            // 1. Filter
            let filtered = comps.filter(c => {
                if (activeBomGlobalSearch) {
                    const mat = String(c.Material || '').toLowerCase();
                    const item = String(c.Item || '').toLowerCase();
                    if (!mat.includes(activeBomGlobalSearch) && !item.includes(activeBomGlobalSearch)) {
                        return false;
                    }
                }
                if (activeBomColFilters.Item) {
                    const it = String(c.Item || '').toLowerCase();
                    if (!it.includes(activeBomColFilters.Item.toLowerCase())) return false;
                }
                if (activeBomColFilters.Material) {
                    const m = String(c.Material || '').toLowerCase();
                    if (!m.includes(activeBomColFilters.Material.toLowerCase())) return false;
                }
                if (activeBomColFilters.PlanQty) {
                    const minVal = parseFloat(activeBomColFilters.PlanQty);
                    if (!isNaN(minVal) && (parseFloat(c.PlanQty) || 0) < minVal) return false;
                }
                if (activeBomColFilters.PrdQty) {
                    const minVal = parseFloat(activeBomColFilters.PrdQty);
                    if (!isNaN(minVal) && (parseFloat(c.PrdQty) || 0) < minVal) return false;
                }
                if (activeBomColFilters.BOMQuantity) {
                    const minVal = parseFloat(activeBomColFilters.BOMQuantity);
                    if (!isNaN(minVal) && (parseFloat(c.BOMQuantity) || 0) < minVal) return false;
                }
                return true;
            });

            // 2. Sort
            if (currentBomSortCol) {
                filtered.sort((a, b) => {
                    if (currentBomSortCol === 'PlanQty' || currentBomSortCol === 'PrdQty' || currentBomSortCol === 'BOMQuantity') {
                        const vA = parseFloat(a[currentBomSortCol]) || 0;
                        const vB = parseFloat(b[currentBomSortCol]) || 0;
                        return currentBomSortDir === 'asc' ? vA - vB : vB - vA;
                    }
                    const vA = String(a[currentBomSortCol] || '').toLowerCase();
                    const vB = String(b[currentBomSortCol] || '').toLowerCase();
                    const cmp = vA.localeCompare(vB, undefined, { numeric: true });
                    return currentBomSortDir === 'asc' ? cmp : -cmp;
                });
            }

            activeFilteredComps = filtered;
            renderPage(1);
            updateBomStatCards(activeFilteredComps);

            // Update total count badge
            if (totalBadgeEl) {
                totalBadgeEl.textContent = (activeFilteredComps.length !== comps.length)
                    ? `Total: ${activeFilteredComps.length} of ${comps.length} components`
                    : `Total: ${comps.length} components`;
            }
        }

        function updateBomSortHeaders() {
            panelBom.querySelectorAll('.bom-items-table thead th.col-sortable').forEach(th => {
                const col = th.dataset.sort;
                const icon = th.querySelector('.sort-icon');
                th.classList.remove('is-sorted-asc', 'is-sorted-desc');
                if (col === currentBomSortCol) {
                    th.classList.add(currentBomSortDir === 'asc' ? 'is-sorted-asc' : 'is-sorted-desc');
                    if (icon) icon.textContent = (currentBomSortDir === 'asc' ? 'arrow_upward' : 'arrow_downward');
                } else {
                    if (icon) icon.textContent = 'unfold_more';
                }
            });
        }

        // Click listener for sortable headers
        panelBom.querySelectorAll('.bom-items-table thead th.col-sortable').forEach(th => {
            th.addEventListener('click', (e) => {
                if (e.target.closest('input, select, button')) return;
                const col = th.dataset.sort;
                if (!col) return;
                if (currentBomSortCol === col) {
                    currentBomSortDir = (currentBomSortDir === 'asc' ? 'desc' : 'asc');
                } else {
                    currentBomSortCol = col;
                    currentBomSortDir = 'asc';
                }
                updateBomSortHeaders();
                applyBomFiltersAndSort();
            });
        });

        // Column filter input events
        panelBom.querySelectorAll('.bom-col-filter-input').forEach(inp => {
            inp.addEventListener('input', () => {
                const col = inp.dataset.filterCol;
                if (col) {
                    activeBomColFilters[col] = inp.value.trim();
                    applyBomFiltersAndSort();
                }
            });
        });

        // Clear all column filters button
        const clearBtn = panelBom.querySelector('#btnClearBomFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                Object.keys(activeBomColFilters).forEach(k => activeBomColFilters[k] = '');
                panelBom.querySelectorAll('.bom-col-filter-input').forEach(i => { i.value = ''; });
                applyBomFiltersAndSort();
            });
        }

        // Global search input
        const searchInput = panelBom.querySelector('.bom-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                activeBomGlobalSearch = searchInput.value.toLowerCase().trim();
                applyBomFiltersAndSort();
            });
        }

        // Initial render
        renderPage(1);
    }

    async function loadDrawerBom(record, forceReload = false) {
        if (!record) return;
        const so = String(record.sales_order || '').trim();
        if (isBlankCode(so)) {
            renderApiMissing(panelBom, 'Sales order required', 'This quotation has no follow-on sales order, so BOM cannot be loaded.');
            if (dncBomVal) dncBomVal.textContent = 'No SO';
            return;
        }
        if (!forceReload && bomCacheBySo[so]) {
            const lineRows = filterBomByLine(bomCacheBySo[so].data, record.line_item);
            renderBomPanel(record, false, null, lineRows, bomCacheBySo[so].raw);
            if (dncBomVal) dncBomVal.textContent = `${lineRows.length} components`;
            return;
        }

        renderBomPanel(record, true);
        if (dncBomVal) dncBomVal.textContent = 'Syncing…';

        const endpoint = cfg.bomUrl || '/sales/bom';
        try {
            const res = await fetch(`${endpoint}?sales_order=${encodeURIComponent(so)}&_=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load BOM data`);
            const payload = await res.json();
            if (payload.status === 'error' || !payload.data) {
                const err = payload.error || 'No BOM components returned from SAP for SO ' + so;
                bomCacheBySo[so] = { data: [], raw: payload };
                renderBomPanel(record, false, err, [], payload);
                if (dncBomVal) dncBomVal.textContent = '0 components';
            } else {
                bomCacheBySo[so] = { data: payload.data, raw: payload };
                const lineRows = filterBomByLine(payload.data, record.line_item);
                renderBomPanel(record, false, null, lineRows, payload);
                if (dncBomVal) dncBomVal.textContent = `${lineRows.length} components`;
            }
        } catch (err) {
            renderBomPanel(record, false, err.message, [], null);
            if (dncBomVal) dncBomVal.textContent = 'SAP Error';
        }
    }
        env.bomRowLineNo = bomRowLineNo;
        env.filterBomByLine = filterBomByLine;
        env.renderBomPanel = renderBomPanel;
        env.loadDrawerBom = loadDrawerBom;
        }
    });
})();
