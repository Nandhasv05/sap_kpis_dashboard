/* AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Procurement panel, modal, and PR drawer
 */
(function () {
    window.KapisSales = window.KapisSales || {};
    window.KapisSales.modules = window.KapisSales.modules || [];
    window.KapisSales.modules.push(function installProcurement(env) {
        with (env) {
    function renderProcurementPanel(record, isLoading = false, error = null, procData = null, rawPayload = null) {
        if (!panelProcurement) return;
        const so = String(record?.sales_order || '').trim();

        if (isLoading) {
            panelProcurement.innerHTML = kpiPanelLoaderHtml(
                'Loading Procurement',
                `Fetching PR, PO, stock and demand for Sales Doc #${escapeHtml(so)}…`,
                '#4f46e5'
            );
            return;
        }

        if (error) {
            panelProcurement.innerHTML = `
                <div class="drawer-section-card" style="text-align:center;padding:2.5rem 1rem;background:#fff;border:1px solid #e2e8f0;border-radius:0.75rem">
                    <span class="material-icons-round" style="font-size:2.6rem;color:#ef4444;margin-bottom:0.6rem;display:block">error_outline</span>
                    <div style="font-size:1rem;font-weight:700;color:#0f172a;margin-bottom:0.35rem">SAP Procurement Notice</div>
                    <div style="color:#64748b;font-size:0.85rem;margin-bottom:1.25rem">${escapeHtml(error)}</div>
                    <button type="button" class="btn-drawer-retry-proc" style="padding:0.5rem 1.2rem;background:#4f46e5;color:#fff;border:none;border-radius:0.55rem;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.4rem">
                        <span class="material-icons-round" style="font-size:1rem">sync</span> Retry SAP Sync
                    </button>
                </div>
            `;
            const retryBtn = panelProcurement.querySelector('.btn-drawer-retry-proc');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadDrawerProcurement(record, true));
            }
            return;
        }

        const comps = procData || [];
        const first = comps[0] || {};
        const parentMat = record?.material || first.Material || '—';
        const parentDesc = record?.style || record?.material_description || first.MaterialDescription || '—';

        let totalReq = 0, totalPR = 0, totalPO = 0, totalStock = 0;
        const groupCounts = {};
        comps.forEach(c => {
            totalReq += parseFloat(String(c.RequirementQty || c.RequiredQuantity || 0).replace(/\s+/g, '')) || 0;
            totalPR += parseFloat(String(c.TotalPRQty || c.TotalPRQuantity || 0).replace(/\s+/g, '')) || 0;
            totalPO += parseFloat(String(c.TotalPOQty || c.TotalPOQuantity || 0).replace(/\s+/g, '')) || 0;
            totalStock += parseFloat(String(c.StockQty || c.StockQuantity || 0).replace(/\s+/g, '')) || 0;
            const g = String(c.MaterialGroup || '').trim();
            if (g) groupCounts[g] = (groupCounts[g] || 0) + 1;
        });

        const prCoveragePct = totalReq > 0 ? Math.min(100, Math.round((totalPR / totalReq) * 100)) : (totalPR > 0 ? 100 : 0);
        const poFulfillPct = totalReq > 0 ? Math.min(100, Math.round((totalPO / totalReq) * 100)) : (totalPO > 0 ? 100 : 0);
        const uniqueGroups = Object.keys(groupCounts);

        panelProcurement.innerHTML = `
            <div class="proc-shell">
                <div class="proc-pipeline-strip">
                    <div class="proc-pipeline-flow">
                        <button type="button" class="proc-flow-node stage-req" data-stage="req">
                            <span class="proc-flow-ico"><span class="material-icons-round">inventory_2</span></span>
                            <span class="proc-flow-meta">
                                <span class="proc-flow-lbl">Demand</span>
                                <strong class="proc-flow-val">${fmtNum(totalReq)}</strong>
                            </span>
                        </button>
                        <button type="button" class="proc-flow-node stage-pr" data-stage="pr">
                            <span class="proc-flow-ico"><span class="material-icons-round">assignment</span></span>
                            <span class="proc-flow-meta">
                                <span class="proc-flow-lbl">Purchase req</span>
                                <strong class="proc-flow-val">${fmtNum(totalPR)}</strong>
                            </span>
                        </button>
                        <button type="button" class="proc-flow-node stage-po" data-stage="po">
                            <span class="proc-flow-ico"><span class="material-icons-round">local_shipping</span></span>
                            <span class="proc-flow-meta">
                                <span class="proc-flow-lbl">Purchase order</span>
                                <strong class="proc-flow-val">${fmtNum(totalPO)}</strong>
                            </span>
                        </button>
                        <button type="button" class="proc-flow-node stage-stk" data-stage="stock">
                            <span class="proc-flow-ico"><span class="material-icons-round">warehouse</span></span>
                            <span class="proc-flow-meta">
                                <span class="proc-flow-lbl">Stock</span>
                                <strong class="proc-flow-val">${fmtNum(totalStock)}</strong>
                            </span>
                        </button>
                    </div>
                </div>

                ${comps.length === 0 ? `
                    <!-- Modern Dedicated Empty State Card (No ugly empty table / scrollbar) -->
                    <div class="proc-empty-state-card">
                        <div class="proc-empty-icon-wrap">
                            <span class="material-icons-round" style="font-size:1.85rem">inventory_2</span>
                        </div>
                        <h3 class="proc-empty-title">No Procurement Demand Records Found</h3>
                        <p class="proc-empty-desc">
                            SAP ZBUSINESS_API_SRV returned 0 procurement components or purchase requisitions for Sales Doc #<strong style="color:#0f172a">${escapeHtml(so)}</strong>.
                        </p>
                        <div class="proc-empty-actions">
                            <button type="button" class="btn-proc-empty-sync" style="padding:0.48rem 1.15rem;border-radius:0.55rem;background:#4f46e5;color:#fff;border:none;font-weight:700;font-size:0.82rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.4rem;box-shadow:0 2px 5px rgba(79,70,229,0.25)">
                                <span class="material-icons-round" style="font-size:1rem">sync</span> Sync from SAP
                            </button>
                            <button type="button" class="btn-proc-goto-bom" style="padding:0.48rem 1.15rem;border-radius:0.55rem;background:#ffffff;color:#334155;border:1px solid #cbd5e1;font-weight:700;font-size:0.82rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.4rem">
                                <span class="material-icons-round" style="font-size:1rem;color:#d97706">schema</span> View BOM Components
                            </button>
                            <button type="button" class="btn-proc-goto-planning" style="padding:0.48rem 1.15rem;border-radius:0.55rem;background:#ffffff;color:#334155;border:1px solid #cbd5e1;font-weight:700;font-size:0.82rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.4rem">
                                <span class="material-icons-round" style="font-size:1rem;color:#0284c7">calendar_today</span> View Planning Schedule
                            </button>
                        </div>
                    </div>
                ` : `
                    <!-- Clean Toolbar: Search & Dynamic Group Filter Pills -->
                    <div class="procurement-toolbar">
                        <div class="procurement-toolbar-top">
                            <div class="procurement-search-wrap">
                                <span class="material-icons-round">search</span>
                                <input type="search" class="proc-search-input" placeholder="Search material code, description, shade..." autocomplete="off">
                                <button type="button" class="proc-search-clear" style="display:none" aria-label="Clear search" title="Clear search">
                                    <span class="material-icons-round">close</span>
                                </button>
                            </div>
                            <div class="procurement-count-badge" id="procFilteredBadge">${comps.length} of ${comps.length} items</div>
                        </div>
                        <div class="procurement-group-filters">
                            <button type="button" class="proc-filter-pill active" data-group="all">All <span class="pill-cnt">${comps.length}</span></button>
                            ${uniqueGroups.map(grp => `
                                <button type="button" class="proc-filter-pill" data-group="${escapeHtml(grp.toLowerCase())}">
                                    ${escapeHtml(grp)} <span class="pill-cnt">${groupCounts[grp]}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="procurement-content-body" id="procContentBody">
                        <div class="procurement-table-scroll">
                            <table class="procurement-table table-bordered">
                                <thead>
                                    <tr>
                                        <th class="col-sortable" data-sort="ComponentMaterial">
                                            <span class="th-sort-wrap">Component Material <span class="material-icons-round sort-icon">unfold_more</span></span>
                                        </th>
                                        <th class="col-sortable" data-sort="ComponentDescription">
                                            <span class="th-sort-wrap">Description <span class="material-icons-round sort-icon">unfold_more</span></span>
                                        </th>
                                        <th class="col-sortable" data-sort="MaterialGroup">
                                            <span class="th-sort-wrap">Group <span class="material-icons-round sort-icon">unfold_more</span></span>
                                        </th>
                                        <th class="col-num col-sortable" data-sort="RequirementQty">
                                            <span class="th-sort-wrap th-sort-right">Req Qty <span class="material-icons-round sort-icon">unfold_more</span></span>
                                        </th>
                                        <th class="col-num col-sortable" data-sort="TotalPRQty">
                                            <span class="th-sort-wrap th-sort-right">Total PR Qty <span class="material-icons-round sort-icon">unfold_more</span></span>
                                        </th>
                                        <th class="col-num col-sortable" data-sort="TotalPOQty">
                                            <span class="th-sort-wrap th-sort-right">Total PO Qty <span class="material-icons-round sort-icon">unfold_more</span></span>
                                        </th>
                                        <th class="col-num col-sortable" data-sort="BalancePRQty">
                                            <span class="th-sort-wrap th-sort-right">Balance PR <span class="material-icons-round sort-icon">unfold_more</span></span>
                                        </th>
                                    </tr>
                                    <tr class="proc-col-filter-row">
                                        <th><input type="text" class="proc-col-filter" data-col="ComponentMaterial" placeholder="Filter code…"></th>
                                        <th><input type="text" class="proc-col-filter" data-col="ComponentDescription" placeholder="Filter desc/shade…"></th>
                                        <th><input type="text" class="proc-col-filter" data-col="MaterialGroup" placeholder="Filter group…"></th>
                                        <th><input type="number" class="proc-col-filter" data-col="RequirementQty" placeholder="Min req…"></th>
                                        <th><input type="number" class="proc-col-filter" data-col="TotalPRQty" placeholder="Min PR…"></th>
                                        <th><input type="number" class="proc-col-filter" data-col="TotalPOQty" placeholder="Min PO…"></th>
                                        <th><input type="number" class="proc-col-filter" data-col="BalancePRQty" placeholder="Min bal…"></th>
                                    </tr>
                                </thead>
                                <tbody id="drawerProcTableBody"></tbody>
                            </table>
                        </div>
                        <div class="bom-pagination-wrap" style="display:flex;align-items:center;justify-content:space-between;padding:0.7rem 1.1rem;border-top:1px solid #e2e8f0;background:#ffffff;font-size:0.8rem;color:#64748b">
                            <div id="drawerProcPaginationInfo">Showing 1 to 20 of ${comps.length} components</div>
                            <div id="drawerProcPaginationBtns" style="display:flex;gap:0.35rem"></div>
                        </div>
                    </div>
                `}
                <div class="proc-inspect-backdrop" id="procInspectBackdrop" hidden></div>
                <aside class="proc-inspect" id="procInspect" aria-hidden="true">
                    <div class="proc-inspect-head">
                        <div>
                            <div class="proc-inspect-eyebrow" id="procInspectEyebrow">PR &amp; PO DETAILS</div>
                            <h3 id="procInspectTitle">—</h3>
                            <p id="procInspectSub"></p>
                        </div>
                        <button type="button" class="proc-inspect-close" id="procInspectClose" aria-label="Close">
                            <span class="material-icons-round">close</span>
                        </button>
                    </div>
                    <div class="proc-inspect-body" id="procInspectBody"></div>
                </aside>
            </div>
        `;

        // Interactive State
        const PAGE_SIZE = 20;
        let currentProcPage = 1;
        let currentProcSortCol = null;
        let currentProcSortDir = 'asc';
        let activeGroupFilter = 'all';
        let activeGlobalSearch = '';
        const activeColFilters = {
            ComponentMaterial: '',
            ComponentDescription: '',
            MaterialGroup: '',
            RequirementQty: '',
            TotalPRQty: '',
            TotalPOQty: '',
            BalancePRQty: '',
            StockQty: ''
        };
        let activeFilteredComps = comps.slice();

        function procQty(r) {
            const req = parseFloat(String(r.RequirementQty || r.RequiredQuantity || '0').replace(/\s+/g, '')) || 0;
            const pr = parseFloat(String(r.TotalPRQty || r.TotalPRQuantity || '0').replace(/\s+/g, '')) || 0;
            const po = parseFloat(String(r.TotalPOQty || r.TotalPOQuantity || '0').replace(/\s+/g, '')) || 0;
            const bal = parseFloat(String(r.BalancePRQty || (pr - po) || '0').replace(/\s+/g, '')) || 0;
            const stock = parseFloat(String(r.StockQty || r.StockQuantity || '0').replace(/\s+/g, '')) || 0;
            return { req, pr, po, bal, stock };
        }

        function applyFiltersAndSort() {
            let filtered = comps.filter(c => {
                // 1. Group filter pill
                if (activeGroupFilter !== 'all') {
                    const grp = String(c.MaterialGroup || '').toLowerCase();
                    if (!grp.includes(activeGroupFilter)) return false;
                }
                // 2. Global search
                if (activeGlobalSearch) {
                    const mat = String(c.ComponentMaterial || '').toLowerCase();
                    const desc = String(c.ComponentDescription || c.ComponentMaterialDesc || '').toLowerCase();
                    const grp = String(c.MaterialGroup || '').toLowerCase();
                    const shade = String(c.ShadeText1 || '').toLowerCase();
                    if (!mat.includes(activeGlobalSearch) && !desc.includes(activeGlobalSearch) && !grp.includes(activeGlobalSearch) && !shade.includes(activeGlobalSearch)) {
                        return false;
                    }
                }
                // 3. Column filters
                if (activeColFilters.ComponentMaterial) {
                    const m = String(c.ComponentMaterial || '').toLowerCase();
                    if (!m.includes(activeColFilters.ComponentMaterial.toLowerCase())) return false;
                }
                if (activeColFilters.ComponentDescription) {
                    const d = String(c.ComponentDescription || c.ComponentMaterialDesc || '').toLowerCase();
                    const s = String(c.ShadeText1 || '').toLowerCase();
                    const query = activeColFilters.ComponentDescription.toLowerCase();
                    if (!d.includes(query) && !s.includes(query)) return false;
                }
                if (activeColFilters.MaterialGroup) {
                    const g = String(c.MaterialGroup || '').toLowerCase();
                    if (!g.includes(activeColFilters.MaterialGroup.toLowerCase())) return false;
                }
                if (activeColFilters.RequirementQty) {
                    const minVal = parseFloat(activeColFilters.RequirementQty);
                    const val = parseFloat(String(c.RequirementQty || c.RequiredQuantity || 0).replace(/\s+/g, '')) || 0;
                    if (!isNaN(minVal) && val < minVal) return false;
                }
                if (activeColFilters.TotalPRQty) {
                    const minVal = parseFloat(activeColFilters.TotalPRQty);
                    const val = parseFloat(String(c.TotalPRQty || c.TotalPRQuantity || 0).replace(/\s+/g, '')) || 0;
                    if (!isNaN(minVal) && val < minVal) return false;
                }
                if (activeColFilters.TotalPOQty) {
                    const minVal = parseFloat(activeColFilters.TotalPOQty);
                    const val = parseFloat(String(c.TotalPOQty || c.TotalPOQuantity || 0).replace(/\s+/g, '')) || 0;
                    if (!isNaN(minVal) && val < minVal) return false;
                }
                if (activeColFilters.BalancePRQty) {
                    const minVal = parseFloat(activeColFilters.BalancePRQty);
                    const val = parseFloat(String(c.BalancePRQty || 0).replace(/\s+/g, '')) || 0;
                    if (!isNaN(minVal) && val < minVal) return false;
                }
                if (activeColFilters.StockQty) {
                    const minVal = parseFloat(activeColFilters.StockQty);
                    const val = parseFloat(String(c.StockQty || c.StockQuantity || 0).replace(/\s+/g, '')) || 0;
                    if (!isNaN(minVal) && val < minVal) return false;
                }
                return true;
            });

            if (currentProcSortCol) {
                filtered.sort((a, b) => {
                    const numCols = ['RequirementQty', 'TotalPRQty', 'TotalPOQty', 'BalancePRQty', 'StockQty'];
                    if (numCols.includes(currentProcSortCol)) {
                        const vA = parseFloat(String(a[currentProcSortCol] || (currentProcSortCol === 'RequirementQty' ? a.RequiredQuantity : (currentProcSortCol === 'TotalPRQty' ? a.TotalPRQuantity : (currentProcSortCol === 'TotalPOQty' ? a.TotalPOQuantity : a.StockQuantity))) || 0).replace(/\s+/g, '')) || 0;
                        const vB = parseFloat(String(b[currentProcSortCol] || (currentProcSortCol === 'RequirementQty' ? b.RequiredQuantity : (currentProcSortCol === 'TotalPRQty' ? b.TotalPRQuantity : (currentProcSortCol === 'TotalPOQty' ? b.TotalPOQuantity : b.StockQuantity))) || 0).replace(/\s+/g, '')) || 0;
                        return currentProcSortDir === 'asc' ? vA - vB : vB - vA;
                    }
                    const vA = String(a[currentProcSortCol] || a.ComponentMaterialDesc || '').toLowerCase();
                    const vB = String(b[currentProcSortCol] || b.ComponentMaterialDesc || '').toLowerCase();
                    const cmp = vA.localeCompare(vB, undefined, { numeric: true });
                    return currentProcSortDir === 'asc' ? cmp : -cmp;
                });
            }

            activeFilteredComps = filtered;
            renderPage(1);

            const countBadge = panelProcurement.querySelector('#procFilteredBadge');
            if (countBadge) {
                countBadge.textContent = `${activeFilteredComps.length} of ${comps.length} items`;
            }
        }

        function updateSortHeaders() {
            panelProcurement.querySelectorAll('.proc-pro-table thead th.col-sortable, .procurement-table thead th.col-sortable').forEach(th => {
                const col = th.dataset.sort;
                const icon = th.querySelector('.sort-icon');
                th.classList.remove('is-sorted-asc', 'is-sorted-desc');
                if (col === currentProcSortCol) {
                    th.classList.add(currentProcSortDir === 'asc' ? 'is-sorted-asc' : 'is-sorted-desc');
                    if (icon) icon.textContent = (currentProcSortDir === 'asc' ? 'arrow_upward' : 'arrow_downward');
                } else {
                    if (icon) icon.textContent = 'unfold_more';
                }
            });
        }

        function renderPage(page) {
            const totalItems = activeFilteredComps.length;
            const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
            currentProcPage = Math.max(1, Math.min(page, totalPages));

            const startIdx = (currentProcPage - 1) * PAGE_SIZE;
            const endIdx = Math.min(startIdx + PAGE_SIZE, totalItems);
            const pageData = activeFilteredComps.slice(startIdx, endIdx);

            const tbodyEl = panelProcurement.querySelector('#drawerProcTableBody');
            const infoEl = panelProcurement.querySelector('#drawerProcPaginationInfo');
            const btnsEl = panelProcurement.querySelector('#drawerProcPaginationBtns');

            if (!tbodyEl) return;

            if (!pageData.length) {
                tbodyEl.innerHTML = `
                    <tr class="proc-empty-row">
                        <td colspan="7">${comps.length ? 'No components match your search or filter criteria.' : 'No procurement components found in SAP for this sales doc.'}</td>
                    </tr>
                `;
            } else {
                tbodyEl.innerHTML = pageData.map((r, i) => {
                    const q = procQty(r);
                    const balColor = q.bal < 0 ? '#dc2626' : (q.bal > 0 ? '#d97706' : '#059669');
                    return `
                        <tr class="proc-row" data-page-idx="${i}">
                            <td>
                                <code class="proc-mat-code">${escapeHtml(r.ComponentMaterial || '—')}</code>
                            </td>
                            <td>
                                ${escapeHtml(r.ComponentDescription || r.ComponentMaterialDesc || '—')}
                                ${r.ShadeText1 ? `<div class="proc-item-shade">${escapeHtml(r.ShadeText1)}</div>` : ''}
                            </td>
                            <td><span class="proc-tag ${groupTagClass(r.MaterialGroup)}">${escapeHtml(r.MaterialGroup || '—')}</span></td>
                            <td class="col-num">${fmtNum(q.req)}</td>
                            <td class="col-num" style="font-weight:600;color:#0f172a">${fmtNum(q.pr)}</td>
                            <td class="col-num" style="font-weight:600;color:#059669">${fmtNum(q.po)}</td>
                            <td class="col-num" style="font-weight:700;color:${balColor}">${fmtNum(q.bal)}</td>
                        </tr>
                    `;
                }).join('');

                tbodyEl.querySelectorAll('.proc-row').forEach((row) => {
                    const idx = Number(row.getAttribute('data-page-idx'));
                    const item = pageData[idx];
                    row.addEventListener('click', () => {
                        tbodyEl.querySelectorAll('.proc-row').forEach((r) => r.classList.remove('active'));
                        row.classList.add('active');
                        openProcInspect(item);
                    });
                });
            }

            if (infoEl) {
                infoEl.textContent = totalItems
                    ? `Showing ${startIdx + 1} to ${endIdx} of ${totalItems} components`
                    : 'Showing 0 components';
            }

            if (btnsEl) {
                btnsEl.innerHTML = '';
                if (totalPages > 1) {
                    const prevBtn = document.createElement('button');
                    prevBtn.type = 'button';
                    prevBtn.className = 'bom-page-btn';
                    prevBtn.disabled = (currentProcPage === 1);
                    prevBtn.innerHTML = '<span class="material-icons-round" style="font-size:14px">chevron_left</span>';
                    prevBtn.title = 'Previous page';
                    prevBtn.addEventListener('click', () => renderPage(currentProcPage - 1));
                    btnsEl.appendChild(prevBtn);

                    const maxDisplayPages = 5;
                    let startP = Math.max(1, currentProcPage - 2);
                    let endP = Math.min(totalPages, startP + maxDisplayPages - 1);
                    if (endP - startP < maxDisplayPages - 1) {
                        startP = Math.max(1, endP - maxDisplayPages + 1);
                    }

                    for (let p = startP; p <= endP; p++) {
                        const pBtn = document.createElement('button');
                        pBtn.type = 'button';
                        pBtn.className = `bom-page-btn ${p === currentProcPage ? 'active' : ''}`;
                        pBtn.textContent = p;
                        pBtn.addEventListener('click', () => renderPage(p));
                        btnsEl.appendChild(pBtn);
                    }

                    const nextBtn = document.createElement('button');
                    nextBtn.type = 'button';
                    nextBtn.className = 'bom-page-btn';
                    nextBtn.disabled = (currentProcPage === totalPages);
                    nextBtn.innerHTML = '<span class="material-icons-round" style="font-size:14px">chevron_right</span>';
                    nextBtn.title = 'Next page';
                    nextBtn.addEventListener('click', () => renderPage(currentProcPage + 1));
                    btnsEl.appendChild(nextBtn);
                }
            }
        }

        const inspectEl = panelProcurement.querySelector('#procInspect');
        const inspectBackdrop = panelProcurement.querySelector('#procInspectBackdrop');
        const inspectTitle = panelProcurement.querySelector('#procInspectTitle');
        const inspectSub = panelProcurement.querySelector('#procInspectSub');
        const inspectBody = panelProcurement.querySelector('#procInspectBody');

        function closeDrawerProcPr() {
            inspectEl?.classList.remove('is-open');
            if (inspectEl) inspectEl.setAttribute('aria-hidden', 'true');
            if (inspectBackdrop) inspectBackdrop.hidden = true;
        }

        panelProcurement.querySelector('#procInspectClose')?.addEventListener('click', closeDrawerProcPr);
        inspectBackdrop?.addEventListener('click', closeDrawerProcPr);

        function prLinesHtml(prList) {
            return `
                <div class="proc-nested-head">
                    <span>${prList.length} Purchase Requisition Item(s)</span>
                    <span class="proc-pill proc-pill-live"><span class="pulse-dot"></span> Live SAP</span>
                </div>
                ${prList.map((pr) => {
                    const reqQty = parseFloat(String(pr.RequirementQty || '0').replace(/\s+/g, '')) || 0;
                    const prQty = parseFloat(String(pr.PRQty || '0').replace(/\s+/g, '')) || 0;
                    const poQty = parseFloat(String(pr.POQty || '0').replace(/\s+/g, '')) || 0;
                    const balQty = parseFloat(String(pr.BalancePRQty || '0').replace(/\s+/g, '')) || 0;
                    const balColor = balQty < 0 ? '#dc2626' : (balQty > 0 ? '#d97706' : '#10b981');
                    const cleanItem = pr.PRItem ? String(parseInt(pr.PRItem, 10)) : '10';
                    return `
                        <div class="pr-line-card">
                            <div class="pr-line-card-head">
                                <span class="pr-num">
                                    <span class="material-icons-round" style="font-size:16px;color:#4f46e5">receipt</span>
                                    PR ${escapeHtml(pr.PRNumber || '—')} · Item ${escapeHtml(cleanItem)}
                                </span>
                            </div>
                            <div class="pr-grid-details">
                                <div><span>Requirement Qty</span><strong style="color:#0f172a">${fmtNum(reqQty)}</strong></div>
                                <div><span>PR Quantity</span><strong style="color:#4f46e5">${fmtNum(prQty)}</strong></div>
                                <div><span>PO Quantity</span><strong style="color:#059669">${fmtNum(poQty)}</strong></div>
                                <div><span>Balance PR Qty</span><strong style="color:${balColor}">${fmtNum(balQty)}</strong></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        }

        async function openProcInspect(item) {
            if (!item || !inspectEl) return;
            if (inspectTitle) inspectTitle.textContent = item.ComponentMaterial || '—';
            if (inspectSub) inspectSub.textContent = item.ComponentDescription || item.ComponentMaterialDesc || '';
            inspectBackdrop.hidden = false;
            inspectEl.classList.add('is-open');
            inspectEl.setAttribute('aria-hidden', 'false');
            inspectBody.innerHTML = `
                <div style="padding:1.25rem 0.5rem;text-align:center;color:#64748b">
                    <div class="sales-loader-ring" style="margin:0 auto 0.75rem;width:26px;height:26px;border-width:3px"></div>
                    <div style="font-weight:600;color:#0f172a">Loading PR / PO lines from SAP…</div>
                </div>
            `;

            const uri = item.ProcurementPRSet?.__deferred?.uri
                || `http://app-prod.evolvclothing.com:8000/sap/opu/odata/sap/ZBUSINESS_API_SRV/ProcurementDashboardSet(SalesDoc='${item.SalesDoc || so}',ComponentMaterial='${encodeURIComponent(item.ComponentMaterial)}')/ProcurementPRSet`;

            const endpoint = cfg.procurementPrUrl || '/sales/procurement-pr';
            try {
                const params = new URLSearchParams({
                    uri: uri,
                    sales_doc: item.SalesDoc || so,
                    component_material: item.ComponentMaterial || '',
                    _: String(Date.now()),
                });
                const res = await fetch(`${endpoint}?${params.toString()}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load PR Set`);
                const payload = await res.json();

                if (payload.status === 'error') {
                    inspectBody.innerHTML = `
                        <div class="pr-line-card" style="text-align:center;color:#ef4444;padding:1.5rem">
                            <h4 style="margin:0">SAP Request Failed</h4>
                            <p style="margin:0.25rem 0 0;font-size:0.8rem">${escapeHtml(payload.error || 'Failed to retrieve PR details from SAP')}</p>
                        </div>
                    `;
                    return;
                }

                const prList = payload.data || [];
                if (!prList.length) {
                    inspectBody.innerHTML = `
                        <div class="pr-line-card" style="text-align:center;color:#64748b;padding:1.5rem">
                            <h4 style="margin:0;color:#0f172a">No purchase requisitions linked</h4>
                            <p style="margin:0.35rem 0 0;font-size:0.8rem">No PR lines found in SAP for this component.</p>
                        </div>
                    `;
                    return;
                }
                inspectBody.innerHTML = prLinesHtml(prList);
            } catch (err) {
                inspectBody.innerHTML = `<div class="empty-state" style="color:#ef4444;padding:1.5rem">Error: ${escapeHtml(err.message)}</div>`;
            }
        }

        async function openDrawerPRSet(item) {
            await openProcInspect(item);
        }

        // Event Listeners: Sort Headers
        panelProcurement.querySelectorAll('.proc-pro-table thead th.col-sortable, .procurement-table thead th.col-sortable').forEach(th => {
            th.addEventListener('click', (e) => {
                if (e.target.closest('input, select, button')) return;
                const col = th.dataset.sort;
                if (!col) return;
                if (currentProcSortCol === col) {
                    currentProcSortDir = (currentProcSortDir === 'asc' ? 'desc' : 'asc');
                } else {
                    currentProcSortCol = col;
                    currentProcSortDir = 'asc';
                }
                updateSortHeaders();
                applyFiltersAndSort();
            });
        });

        // Column filter input events
        panelProcurement.querySelectorAll('.proc-col-filter').forEach(inp => {
            inp.addEventListener('input', () => {
                const col = inp.dataset.col;
                if (col) {
                    activeColFilters[col] = inp.value.trim();
                    applyFiltersAndSort();
                }
            });
        });

        // Clear all column filters button
        const clearColFiltersBtn = panelProcurement.querySelector('#btnClearDrawerProcFilters');
        if (clearColFiltersBtn) {
            clearColFiltersBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                Object.keys(activeColFilters).forEach(k => activeColFilters[k] = '');
                panelProcurement.querySelectorAll('.proc-col-filter').forEach(i => { i.value = ''; });
                applyFiltersAndSort();
            });
        }

        // Group Filter Pills
        const groupPills = panelProcurement.querySelectorAll('.proc-filter-pill');
        groupPills.forEach(pill => {
            pill.addEventListener('click', () => {
                groupPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeGroupFilter = pill.getAttribute('data-group') || 'all';
                applyFiltersAndSort();
            });
        });

        // Global Search Input & Clear
        const searchInput = panelProcurement.querySelector('.proc-search-input');
        const searchClearBtn = panelProcurement.querySelector('.proc-search-clear');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                activeGlobalSearch = searchInput.value.toLowerCase().trim();
                if (searchClearBtn) {
                    searchClearBtn.style.display = activeGlobalSearch ? 'flex' : 'none';
                }
                applyFiltersAndSort();
            });
        }
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                searchClearBtn.style.display = 'none';
                activeGlobalSearch = '';
                applyFiltersAndSort();
            });
        }

        // Sync Button
        const syncBtn = panelProcurement.querySelector('.btn-proc-sync');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => loadDrawerProcurement(record, true));
        }

        // Empty State Action Buttons
        const emptySyncBtn = panelProcurement.querySelector('.btn-proc-empty-sync');
        if (emptySyncBtn) {
            emptySyncBtn.addEventListener('click', () => loadDrawerProcurement(record, true));
        }
        const emptyBomBtn = panelProcurement.querySelector('.btn-proc-goto-bom');
        if (emptyBomBtn) {
            emptyBomBtn.addEventListener('click', () => openSubDrawer('bom'));
        }
        const emptyPlanningBtn = panelProcurement.querySelector('.btn-proc-goto-planning');
        if (emptyPlanningBtn) {
            emptyPlanningBtn.addEventListener('click', () => openSubDrawer('planning'));
        }

        const stageSortMap = {
            req: 'RequirementQty',
            pr: 'TotalPRQty',
            po: 'TotalPOQty',
            stock: 'StockQty'
        };

        panelProcurement.querySelectorAll('.proc-flow-node[data-stage]').forEach((card) => {
            card.addEventListener('click', () => {
                const stage = card.getAttribute('data-stage') || 'req';
                panelProcurement.querySelectorAll('.proc-flow-node[data-stage]').forEach((c) => {
                    c.classList.toggle('is-active', c === card);
                });
                if (stageSortMap[stage]) {
                    currentProcSortCol = stageSortMap[stage];
                    currentProcSortDir = 'desc';
                    updateSortHeaders();
                    applyFiltersAndSort();
                }
            });
        });

        // Initial render
        applyFiltersAndSort();
    }

    async function loadDrawerProcurement(record, forceReload = false) {
        if (!record) return;
        const so = String(record.sales_order || '').trim();
        if (isBlankCode(so)) {
            renderApiMissing(panelProcurement, 'Sales order required', 'This quotation has no follow-on sales order, so procurement cannot be loaded.');
            if (dncProcVal) dncProcVal.textContent = 'No SO';
            return;
        }
        if (!forceReload && procCacheBySo[so]) {
            renderProcurementPanel(record, false, null, procCacheBySo[so].data, procCacheBySo[so].raw);
            if (dncProcVal) dncProcVal.textContent = `${procCacheBySo[so].data.length} components`;
            return;
        }

        renderProcurementPanel(record, true);
        if (dncProcVal) dncProcVal.textContent = 'Syncing…';

        const endpoint = cfg.procurementUrl || '/sales/procurement';
        try {
            const res = await fetch(`${endpoint}?sales_doc=${encodeURIComponent(so)}&_=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load procurement data`);
            const payload = await res.json();
            if (payload.status === 'error' || !payload.data) {
                const err = payload.error || 'No procurement records returned from SAP for SO ' + so;
                procCacheBySo[so] = { data: [], raw: payload };
                renderProcurementPanel(record, false, err, [], payload);
                if (dncProcVal) dncProcVal.textContent = '0 components';
            } else {
                procCacheBySo[so] = { data: payload.data, raw: payload };
                renderProcurementPanel(record, false, null, payload.data, payload);
                if (dncProcVal) dncProcVal.textContent = `${payload.data.length} components`;
            }
        } catch (err) {
            renderProcurementPanel(record, false, err.message, [], null);
            if (dncProcVal) dncProcVal.textContent = 'SAP Error';
        }
    }
    /* ==========================================================================
       Procurement Data Display
    ========================================================================= */
    let currentProcData = [];
    let currentProcRawPayload = null;
    let currentProcSalesDoc = '';
    let activeProcGroupFilter = 'all';

    /*
     * Function to get the tag class based on the group
     */
    function groupTagClass(grp) {
        const g = String(grp || '').toUpperCase();
        if (g.includes('FABRIC')) return 'tag-fabric';
        if (g.includes('LABEL')) return 'tag-labels';
        if (g.includes('BUTTON')) return 'tag-button';
        if (g.includes('THREAD')) return 'tag-threads';
        if (g.includes('LINING')) return 'tag-lining';
        return '';
    }

    function openProcurementModal(salesDoc = '') {
        if (!procModal) return;
        currentProcSalesDoc = String(salesDoc || currentDrawerRecord?.sales_order || '').trim();
        if (procSalesDocLabel) procSalesDocLabel.textContent = currentProcSalesDoc;
        if (procHeaderMaterial) procHeaderMaterial.textContent = '…';
        if (procHeaderDesc) procHeaderDesc.textContent = 'Connecting to SAP…';
        activeProcGroupFilter = 'all';
        if (procGroupFilters) {
            procGroupFilters.querySelectorAll('.proc-filter-pill').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-group') === 'all');
            });
        }
        if (procSearchInput) procSearchInput.value = '';
        if (procSearchClear) procSearchClear.hidden = true;

        procModal.hidden = false;
        procModal.classList.remove('is-hidden');
        procModal.style.display = 'flex';
        if (procBackdrop) {
            procBackdrop.hidden = false;
            procBackdrop.classList.remove('is-hidden');
            procBackdrop.style.display = 'block';
        }
        document.body.classList.add('sales-detail-open');
        requestAnimationFrame(() => {
            procModal.classList.add('is-open');
        });
        loadProcurementData(currentProcSalesDoc);
    }

    function closeProcurementModal() {
        procModal?.classList.remove('is-open');
        if (procBackdrop) {
            procBackdrop.classList.add('is-hidden');
            procBackdrop.style.display = 'none';
            procBackdrop.hidden = true;
        }
        document.body.classList.remove('sales-detail-open');
        closePRDrawer();
        setTimeout(() => {
            if (procModal && !procModal.classList.contains('is-open')) {
                procModal.hidden = true;
                procModal.classList.add('is-hidden');
                procModal.style.display = 'none';
            }
        }, 320);
    }

    async function loadProcurementData(salesDoc = '') {
        const cleanDoc = String(salesDoc || currentProcSalesDoc || currentDrawerRecord?.sales_order || '').trim();
        if (!cleanDoc) return;
        currentProcSalesDoc = cleanDoc;
        if (procSalesDocLabel) procSalesDocLabel.textContent = cleanDoc;
        if (procReloadBtn) procReloadBtn.classList.add('is-loading');

        if (procTableBody) {
            procTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="proc-loading-container">
                        <div class="proc-simple-loader">
                            <div class="proc-spinner-ring"></div>
                            <div class="proc-loader-title">Connecting to SAP Procurement</div>
                            <div class="proc-loader-sub">Fetching live component materials, requirements, and orders for <strong>Sales Doc #${escapeHtml(cleanDoc)}</strong>…</div>
                        </div>
                    </td>
                </tr>
            `;
        }

        const endpoint = cfg.procurementUrl || '/sales/procurement';
        try {
            console.log('[Procurement] Live SAP call for Sales Doc:', cleanDoc, `${endpoint}?sales_doc=${encodeURIComponent(cleanDoc)}`);
            const res = await fetch(`${endpoint}?sales_doc=${encodeURIComponent(cleanDoc)}&_=${Date.now()}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: Failed to load procurement data`);
            }
            const payload = await res.json();
            currentProcRawPayload = payload;
            currentProcData = payload.data || [];

            if (payload.status === 'error' || !currentProcData.length) {
                if (procTableBody) {
                    procTableBody.innerHTML = `
                        <tr>
                            <td colspan="9" class="empty-state" style="padding:3.5rem 1rem;text-align:center;">
                                <span class="material-icons-round" style="font-size:2.4rem;color:${payload.status === 'error' ? '#ef4444' : '#94a3b8'};margin-bottom:0.5rem;display:block;">${payload.status === 'error' ? 'error_outline' : 'inventory_2'}</span>
                                <div style="font-weight:700;font-size:0.95rem;color:#1e293b;margin-bottom:0.25rem;">${payload.status === 'error' ? 'SAP Procurement Notice' : 'No Components Found'}</div>
                                <div style="color:#64748b;font-size:0.82rem;">${escapeHtml(payload.error || 'No procurement records returned from SAP for Sales Doc ' + cleanDoc)}</div>
                            </td>
                        </tr>
                    `;
                }
                if (procStatComponents) procStatComponents.textContent = '0';
                if (procStatReq) procStatReq.textContent = '0';
                if (procStatPR) procStatPR.textContent = '0';
                if (procStatPO) procStatPO.textContent = '0';
                if (procStatStock) procStatStock.textContent = '0';
                if (procFilterCountAll) procFilterCountAll.textContent = '0';
                if (procFilteredCount) procFilteredCount.textContent = '0 items';
                return;
            }

            if (currentProcData.length > 0) {
                const first = currentProcData[0];
                if (procHeaderMaterial) procHeaderMaterial.textContent = first.Material || '—';
                if (procHeaderDesc) procHeaderDesc.textContent = first.MaterialDescription || '—';
            }

            let totalReq = 0;
            let totalPR = 0;
            let totalPO = 0;
            let totalStock = 0;

            currentProcData.forEach((row) => {
                totalReq += parseFloat(String(row.RequirementQty || '0').replace(/\s+/g, '')) || 0;
                totalPR += parseFloat(String(row.TotalPRQty || '0').replace(/\s+/g, '')) || 0;
                totalPO += parseFloat(String(row.TotalPOQty || '0').replace(/\s+/g, '')) || 0;
                totalStock += parseFloat(String(row.StockQty || '0').replace(/\s+/g, '')) || 0;
            });

            if (procStatComponents) procStatComponents.textContent = currentProcData.length;
            if (procStatReq) procStatReq.textContent = fmtNum(totalReq);
            if (procStatPR) procStatPR.textContent = fmtNum(totalPR);
            if (procStatPO) procStatPO.textContent = fmtNum(totalPO);
            if (procStatStock) procStatStock.textContent = fmtNum(totalStock);
            if (procFilterCountAll) procFilterCountAll.textContent = currentProcData.length;

            renderProcurementTable(currentProcData);
        } catch (err) {
            if (procTableBody) {
                procTableBody.innerHTML = `<tr><td colspan="9" class="empty-state" style="color:#ef4444">Error: ${escapeHtml(err.message)}</td></tr>`;
            }
        } finally {
            if (procReloadBtn) {
                setTimeout(() => procReloadBtn.classList.remove('is-loading'), 350);
            }
        }
    }

    function renderProcurementTable(records) {
        if (!procTableBody) return;
        const query = procSearchInput?.value?.trim().toLowerCase() || '';

        const filtered = (records || []).filter((r) => {
            // Group filter
            if (activeProcGroupFilter !== 'all') {
                const grp = String(r.MaterialGroup || '').toLowerCase();
                if (!grp.includes(activeProcGroupFilter)) return false;
            }
            if (!query) return true;
            return (
                String(r.ComponentMaterial || '').toLowerCase().includes(query) ||
                String(r.ComponentDescription || '').toLowerCase().includes(query) ||
                String(r.MaterialGroup || '').toLowerCase().includes(query) ||
                String(r.ShadeText1 || '').toLowerCase().includes(query)
            );
        });

        if (procFilteredCount) {
            procFilteredCount.textContent = `${filtered.length} of ${records.length} items`;
        }

        if (!filtered.length) {
            procTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">No components match "${escapeHtml(query || activeProcGroupFilter)}"</td></tr>`;
            return;
        }

        procTableBody.innerHTML = filtered.map((r, i) => {
            const req = parseFloat(String(r.RequirementQty || '0').replace(/\s+/g, '')) || 0;
            const pr = parseFloat(String(r.TotalPRQty || '0').replace(/\s+/g, '')) || 0;
            const po = parseFloat(String(r.TotalPOQty || '0').replace(/\s+/g, '')) || 0;
            const bal = parseFloat(String(r.BalancePRQty || '0').replace(/\s+/g, '')) || 0;
            const stock = parseFloat(String(r.StockQty || '0').replace(/\s+/g, '')) || 0;
            const balColor = bal < 0 ? '#dc2626' : (bal > 0 ? '#d97706' : '#10b981');

            return `
                <tr class="proc-row" data-idx="${i}" tabindex="0" role="button" title="Click to view ProcurementPRSet details">
                    <td>
                        <span class="proc-comp-badge">${escapeHtml(r.ComponentMaterial)}</span>
                    </td>
                    <td>
                        <div class="proc-desc-cell">
                            <span class="proc-desc-name">${escapeHtml(r.ComponentDescription || '—')}</span>
                            ${r.ShadeText1 ? `<span class="proc-desc-shade"><span class="material-icons-round" style="font-size:12px">palette</span> Shade: ${escapeHtml(r.ShadeText1)}</span>` : ''}
                        </div>
                    </td>
                    <td><span class="proc-tag ${groupTagClass(r.MaterialGroup)}">${escapeHtml(r.MaterialGroup || '—')}</span></td>
                    <td class="col-num">${fmtNum(req)}</td>
                    <td class="col-num" style="font-weight:600;color:#0f172a">${fmtNum(pr)}</td>
                    <td class="col-num" style="font-weight:600;color:#059669">${fmtNum(po)}</td>
                    <td class="col-num" style="font-weight:700;color:${balColor}">${fmtNum(bal)}</td>
                    <td class="col-num" style="font-weight:600;color:#0284c7">${fmtNum(stock)}</td>
                    <td style="text-align:center">
                        <button type="button" class="proc-btn-drill" data-action="pr">
                            <span>PR Set</span>
                            <span class="material-icons-round" style="font-size:13px">chevron_right</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        procTableBody.querySelectorAll('.proc-row').forEach((row, i) => {
            const item = filtered[i];
            row.addEventListener('click', () => {
                procTableBody.querySelectorAll('.proc-row').forEach(r => r.classList.remove('active'));
                row.classList.add('active');
                openPRDrawer(item);
            });
        });
    }

    async function openPRDrawer(item) {
        if (!prDrawer) return;
        prDrawer.classList.add('open');
        prDrawer.setAttribute('aria-hidden', 'false');

        if (prDrawerTitle) prDrawerTitle.textContent = item.ComponentMaterial;
        if (prDrawerSubtitle) prDrawerSubtitle.textContent = item.ComponentDescription || '';

        const uri = item.ProcurementPRSet?.__deferred?.uri
            || `http://app-prod.evolvclothing.com:8000/sap/opu/odata/sap/ZBUSINESS_API_SRV/ProcurementDashboardSet(SalesDoc='${item.SalesDoc || currentProcSalesDoc}',ComponentMaterial='${encodeURIComponent(item.ComponentMaterial)}')/ProcurementPRSet`;

        if (prDrawerBody) {
            prDrawerBody.innerHTML = `
                <div style="padding:2.5rem 1rem;text-align:center;color:#64748b">
                    <div class="sales-loader-ring" style="margin:0 auto 1rem;width:28px;height:28px;border-width:3px"></div>
                    <div style="font-weight:600;color:#0f172a">Calling SAP ProcurementPRSet…</div>
                    <small style="color:#94a3b8;font-size:0.75rem;margin-top:0.25rem;display:block">Retrieving purchase requisition line items</small>
                </div>
            `;
        }

        const endpoint = cfg.procurementPrUrl || '/sales/procurement-pr';
        try {
            const params = new URLSearchParams({
                uri: uri,
                sales_doc: item.SalesDoc || currentProcSalesDoc,
                component_material: item.ComponentMaterial || '',
                _: String(Date.now()),
            });
            const res = await fetch(`${endpoint}?${params.toString()}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: Failed to load PR Set`);
            }
            const payload = await res.json();

            if (payload.status === 'error') {
                prDrawerBody.innerHTML = `
                    <div class="pr-line-card" style="text-align:center;color:#ef4444;padding:2rem">
                        <span class="material-icons-round" style="font-size:36px;color:#ef4444;margin-bottom:0.5rem">error_outline</span>
                        <h4 style="margin:0">SAP Request Failed</h4>
                        <p style="margin:0.25rem 0 0.5rem;font-size:0.8rem">${escapeHtml(payload.error || 'Failed to retrieve PR details from SAP')}</p>
                    </div>
                `;
                return;
            }

            const prList = payload.data || [];

            if (!prList.length) {
                prDrawerBody.innerHTML = `
                    <div class="pr-line-card" style="text-align:center;color:#64748b;padding:2rem">
                        <span class="material-icons-round" style="font-size:36px;color:#cbd5e1;margin-bottom:0.5rem">info</span>
                        <h4 style="margin:0;color:#0f172a">No Purchase Requisitions Linked</h4>
                        <p style="margin:0.25rem 0 1rem;font-size:0.8rem">No PR lines found in SAP for this component material.</p>
                        <div style="text-align:left;background:#f8fafc;padding:0.75rem;border-radius:0.5rem;font-size:0.75rem;border:1px solid #e2e8f0">
                            <strong style="color:#0f172a;display:block;margin-bottom:0.35rem">Component Summary:</strong>
                            <div>Req Qty: <b>${escapeHtml(item.RequirementQty || '0')}</b></div>
                            <div>Total PR Qty: <b>${escapeHtml(item.TotalPRQty || '0')}</b></div>
                            <div>Total PO Qty: <b>${escapeHtml(item.TotalPOQty || '0')}</b></div>
                            <div>Balance PR: <b>${escapeHtml(item.BalancePRQty || '0')}</b></div>
                            <div>Stock Qty: <b>${escapeHtml(item.StockQty || '0')}</b></div>
                        </div>
                    </div>
                `;
                return;
            }

            prDrawerBody.innerHTML = `
                <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:0.82rem;font-weight:700;color:#334155">${prList.length} Purchase Requisition Item(s)</span>
                    <span class="proc-pill proc-pill-live"><span class="pulse-dot"></span> Live SAP</span>
                </div>
                ${prList.map((pr) => {
                const reqQty = parseFloat(String(pr.RequirementQty || '0').replace(/\s+/g, '')) || 0;
                const prQty = parseFloat(String(pr.PRQty || '0').replace(/\s+/g, '')) || 0;
                const poQty = parseFloat(String(pr.POQty || '0').replace(/\s+/g, '')) || 0;
                const balQty = parseFloat(String(pr.BalancePRQty || '0').replace(/\s+/g, '')) || 0;
                const balColor = balQty < 0 ? '#dc2626' : (balQty > 0 ? '#d97706' : '#10b981');
                const formattedDate = fmtSapDate(pr.DeliveryDate);
                const cleanItem = pr.PRItem ? String(parseInt(pr.PRItem, 10)) : '10';

                return `
                    <div class="pr-line-card">
                        <div class="pr-line-card-head">
                            <span class="pr-num">
                                <span class="material-icons-round" style="font-size:16px;color:#4f46e5">receipt</span> 
                                PR ${escapeHtml(pr.PRNumber || '—')} · Item ${escapeHtml(cleanItem)}
                            </span>
                        </div>
                        <div class="pr-grid-details">
                            <div>
                                <span>Requirement Qty</span>
                                <strong style="color:#0f172a">${fmtNum(reqQty)}</strong>
                            </div>
                            <div>
                                <span>PR Quantity</span>
                                <strong style="color:#4f46e5">${fmtNum(prQty)}</strong>
                            </div>
                            <div>
                                <span>PO Quantity</span>
                                <strong style="color:#059669">${fmtNum(poQty)}</strong>
                            </div>
                            <div>
                                <span>Balance PR Qty</span>
                                <strong style="color:${balColor}">${fmtNum(balQty)}</strong>
                            </div>
                            <div>
                                <span>Delivery Date</span>
                                <strong style="color:#0f172a">${escapeHtml(formattedDate)}</strong>
                            </div>
                            <div>
                                <span>Sales Doc</span>
                                <strong>SO #${escapeHtml(pr.SalesDoc ? String(parseInt(pr.SalesDoc, 10)) : (currentProcSalesDoc || '—'))}</strong>
                            </div>
                        </div>
                    </div>
                    `;
            }).join('')}
            `;
        } catch (err) {
            if (prDrawerBody) {
                prDrawerBody.innerHTML = `
                    <div class="pr-line-card" style="border-color:#fca5a5;background:#fef2f2;padding:1.5rem">
                        <h4 style="color:#b91c1c;margin:0 0 0.25rem">Failed to load PR Set</h4>
                        <p style="margin:0;font-size:0.8rem;color:#7f1d1d">${escapeHtml(err.message)}</p>
                    </div>
                `;
            }
        }
    }

    function closePRDrawer() {
        if (!prDrawer) return;
        prDrawer.classList.remove('open');
        prDrawer.setAttribute('aria-hidden', 'true');
        procTableBody?.querySelectorAll('.proc-row').forEach(r => r.classList.remove('active'));
    }

    // Bind Procurement UI events
    procCard?.addEventListener('click', () => {
        const defaultDoc = currentDrawerRecord?.sales_order || (lastPayload?.records && lastPayload.records[0]?.sales_order) || '';
        if (defaultDoc) openProcurementModal(defaultDoc);
    });
    procCloseBtn?.addEventListener('click', closeProcurementModal);
    procBackdrop?.addEventListener('click', closeProcurementModal);
    procReloadBtn?.addEventListener('click', () => loadProcurementData(currentProcSalesDoc));
    prDrawerClose?.addEventListener('click', closePRDrawer);

    // Group Filter Pills
    procGroupFilters?.querySelectorAll('.proc-filter-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
            procGroupFilters.querySelectorAll('.proc-filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeProcGroupFilter = pill.getAttribute('data-group') || 'all';
            renderProcurementTable(currentProcData);
        });
    });

    let procSearchTimer;
    procSearchInput?.addEventListener('input', () => {
        if (procSearchClear) procSearchClear.hidden = !procSearchInput.value;
        clearTimeout(procSearchTimer);
        procSearchTimer = setTimeout(() => renderProcurementTable(currentProcData), 200);
    });

    procSearchClear?.addEventListener('click', () => {
        if (procSearchInput) procSearchInput.value = '';
        if (procSearchClear) procSearchClear.hidden = true;
        renderProcurementTable(currentProcData);
    });

        env.renderProcurementPanel = renderProcurementPanel;
        env.loadDrawerProcurement = loadDrawerProcurement;
        env.groupTagClass = groupTagClass;
        env.openProcurementModal = openProcurementModal;
        env.closeProcurementModal = closeProcurementModal;
        env.loadProcurementData = loadProcurementData;
        env.renderProcurementTable = renderProcurementTable;
        env.openPRDrawer = openPRDrawer;
        env.closePRDrawer = closePRDrawer;
        }
    });
})();
