/* AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Sales order dashboard, line overlay, related lines
 */
(function () {
    window.KapisSales = window.KapisSales || {};
    window.KapisSales.modules = window.KapisSales.modules || [];
    window.KapisSales.modules.push(function installSaleOrder(env) {
        with (env) {
    /* ==========================================================================
       Interactive Sales Order Offcanvas (Planning, BOM, Material, Procurement)
    ========================================================================== */

    function fillSubDrawerSoBadge() {
        const soEl = document.getElementById('subDrawerSoNum');
        const lineEl = document.getElementById('subDrawerLineNum');
        const so = currentDrawerRecord?.sales_order || '—';
        const line = currentDrawerRecord?.line_item || '—';
        if (soEl) soEl.textContent = so;
        if (lineEl) lineEl.textContent = line;
        document.querySelectorAll('#subDrawerSoBadge, #subDrawerLineBadge').forEach((pill) => {
            pill.style.animation = 'none';
            void pill.offsetWidth;
            pill.style.animation = '';
        });
    }

    function openSubDrawer(tabName) {
        if (!currentDrawerRecord || !tabName) return;
        activeDrawerTab = tabName;

        const titles = {
            planning: 'Delivery & Schedule Planning',
            bom: 'Bill of Materials (BOM)',
            material: 'Material Master Specifications',
            procurement: 'Procurement Overview'
        };
        const tags = {
            planning: 'Schedule',
            bom: 'BOM',
            material: 'Master',
            procurement: 'Live SAP'
        };

        if (subDrawerTitle) subDrawerTitle.textContent = titles[tabName] || 'Category Details';
        fillSubDrawerSoBadge();

        const panels = {
            planning: panelPlanning,
            bom: panelBom,
            material: panelMaterial,
            procurement: panelProcurement
        };

        Object.keys(panels).forEach(k => {
            const p = panels[k];
            if (p) {
                p.hidden = (k !== tabName);
                p.classList.toggle('is-active', k === tabName);
            }
        });

        if (drawerNavCards) {
            drawerNavCards.querySelectorAll('.so-sheet-tab, .drawer-nav-card, .so-module').forEach((btn) => {
                const on = btn.getAttribute('data-tab') === tabName;
                btn.classList.toggle('active', on);
                btn.setAttribute('aria-selected', on ? 'true' : 'false');
            });
        }

        if (tabName === 'planning') {
            renderPlanningPanel(currentDrawerRecord);
        } else if (tabName === 'bom') {
            loadDrawerBom(currentDrawerRecord);
        } else if (tabName === 'material') {
            loadDrawerMaterial(currentDrawerRecord, false, 'material');
        } else if (tabName === 'procurement') {
            loadDrawerProcurement(currentDrawerRecord);
        }

        if (subDrawer) {
            subDrawer.classList.add('open');
            subDrawer.setAttribute('aria-hidden', 'false');
        }
    }

    function openMaterialDetailsFor(materialCode, sourceTab) {
        const mat = String(materialCode || '').trim();
        if (!currentDrawerRecord || !mat || mat === '—') return;

        activeDrawerTab = 'material';
        if (subDrawerTitle) subDrawerTitle.textContent = 'Material Master · ' + mat;
        fillSubDrawerSoBadge();

        const panels = {
            planning: panelPlanning,
            bom: panelBom,
            material: panelMaterial,
            procurement: panelProcurement
        };
        Object.keys(panels).forEach((k) => {
            const p = panels[k];
            if (p) {
                p.hidden = k !== 'material';
                p.classList.toggle('is-active', k === 'material');
            }
        });

        loadDrawerMaterial(
            { ...currentDrawerRecord, material: mat, _materialSourceTab: sourceTab || 'bom' },
            false,
            'material'
        );

        if (subDrawer) {
            subDrawer.classList.add('open');
            subDrawer.setAttribute('aria-hidden', 'false');
        }
    }

    function closeSubDrawer() {
        if (subDrawer) {
            subDrawer.classList.remove('open');
            subDrawer.setAttribute('aria-hidden', 'true');
        }
        activeDrawerTab = null;
        if (drawerNavCards) {
            drawerNavCards.querySelectorAll('.so-sheet-tab, .drawer-nav-card, .so-module').forEach((btn) => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
        }
    }

    /********** SWITCH DRAWER TAB FUNCTION *********   */
    function switchDrawerTab(tabName) {
        if (!tabName) {
            closeSubDrawer();
        } else {
            openSubDrawer(tabName);
        }
    }
    
    /********** DRAWER NAV CARD CLICK EVENT LISTENER *********   */
    if (drawerNavCards) {
        drawerNavCards.querySelectorAll('.drawer-nav-card, .so-sheet-tab, .so-module').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tab = btn.getAttribute('data-tab');
                if (tab) openSubDrawer(tab);
            });
        });
    }

    /********** SO LINE DRAWER BACK BUTTON CLICK EVENT LISTENER *********   */
    soLineBack?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSoLineDrawer();
    });
    soLineClose?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSoLineDrawer();
    });

    subDrawerBackBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSubDrawer();
    });

    subDrawerCloseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSoLineDrawer();
    });

    /********** RENDER PLANNING PANEL FUNCTION *********   */
    function renderPlanningPanel(record) {
        if (!panelPlanning) return;
        const isFixed = record.delivery_date_quantity_is_fixed === 'X' || record.delivery_date_quantity_is_fixed === 'true';
        const isPartial = record.partial_delivery_is_allowed === 'X' || record.partial_delivery_is_allowed === 'true';
        const isDelivRel = record.item_is_delivery_relevant === 'X' || record.item_is_delivery_relevant === 'true';

        panelPlanning.innerHTML = `
            <div class="drawer-section-card">
                <div class="drawer-sec-header">
                    <div class="drawer-sec-title-wrap">
                        <span class="material-icons-round drawer-sec-icon" style="color:#0d9488">request_quote</span>
                        <h4 class="drawer-sec-title">Quotation → Sales Order</h4>
                    </div>
                    <span class="category-tag">${escapeHtml(record.quotation_type || record.item_category || 'QT')}</span>
                </div>
                <div class="drawer-info-grid">
                    <div class="drawer-info-item">
                        <span class="info-lbl">Quotation</span>
                        <span class="info-val highlight-blue">${escapeHtml(record.quotation || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Follow-on Sales Order</span>
                        <span class="info-val">${escapeHtml(record.sales_order || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Sales Order Type</span>
                        <span class="info-val">${escapeHtml(record.sales_order_type || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Item / Material</span>
                        <span class="info-val">${escapeHtml(record.line_item || '—')} · ${escapeHtml(record.material || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Requested Delivery</span>
                        <span class="info-val">${escapeHtml(fmtSapDate(record.requested_delivery_date) || record.requested_delivery_date || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Valid From / To</span>
                        <span class="info-val">${escapeHtml(fmtSapDate(record.valid_from) || record.valid_from || '—')} → ${escapeHtml(fmtSapDate(record.valid_to) || record.valid_to || '—')}</span>
                    </div>
                </div>
            </div>
            <div class="drawer-section-card">
                <div class="drawer-sec-header">
                    <div class="drawer-sec-title-wrap">
                        <span class="material-icons-round drawer-sec-icon" style="color:#2563eb">event_available</span>
                        <h4 class="drawer-sec-title">Delivery & Schedule Planning</h4>
                    </div>
                    <span class="sales-status-pill ${statusClass(record.status)}">${escapeHtml(record.status || 'Active')}</span>
                </div>
                <div class="drawer-info-grid">
                    <div class="drawer-info-item">
                        <span class="info-lbl">Confirmed Delivery Qty</span>
                        <span class="info-val highlight-blue">${fmtNum(record.confd_deliv_qty || record.qty)} ${escapeHtml(record.unit || 'EA')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Requested Quantity</span>
                        <span class="info-val">${fmtNum(record.requested_quantity || record.qty)} ${escapeHtml(record.requested_quantity_unit || record.unit || 'EA')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Target Quantity</span>
                        <span class="info-val">${fmtNum(record.target_quantity || record.qty)} ${escapeHtml(record.target_quantity_unit || record.unit || 'EA')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Base Unit</span>
                        <span class="info-val">${escapeHtml(record.base_unit || record.unit || 'EA')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Delivery Confirmation</span>
                        <span class="info-val highlight-green">${escapeHtml(record.delivery_confirmation_status || 'Confirmed')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">SD Process Status</span>
                        <span class="info-val">${escapeHtml(record.sd_process_status || record.status || 'Active')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Total Delivery Status</span>
                        <span class="info-val">${escapeHtml(record.total_delivery_status || record.delivery_status || 'Open')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Delivery Block Status</span>
                        <span class="info-val">${escapeHtml(record.delivery_block_status || 'None')}</span>
                    </div>
                </div>
            </div>

            <div class="drawer-section-card">
                <div class="drawer-sec-header">
                    <div class="drawer-sec-title-wrap">
                        <span class="material-icons-round drawer-sec-icon" style="color:#0284c7">local_shipping</span>
                        <h4 class="drawer-sec-title">Logistics & Dispatch Rules</h4>
                    </div>
                    ${getPlantBadgeHtml(record.plant)}
                </div>
                <div class="drawer-info-grid">
                    <div class="drawer-info-item">
                        <span class="info-lbl">Plant</span>
                        <span class="info-val">${escapeHtml(record.plant || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Storage Location</span>
                        <span class="info-val">${escapeHtml(record.storage_location || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Shipping Point</span>
                        <span class="info-val">${escapeHtml(record.shipping_point || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Shipping Type</span>
                        <span class="info-val">${escapeHtml(record.shipping_type || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Delivery Priority</span>
                        <span class="info-val">${escapeHtml(record.delivery_priority || 'Standard')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Route</span>
                        <span class="info-val">${escapeHtml(record.route || '—')}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Partial Delivery Allowed</span>
                        <span class="info-val">${isPartial ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="drawer-info-item">
                        <span class="info-lbl">Date & Qty Fixed</span>
                        <span class="info-val">${isFixed ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="drawer-info-item full-width">
                        <span class="info-lbl">Delivery Relevance</span>
                        <span class="info-val">${isDelivRel ? 'Relevant for Delivery / Shipping' : 'Standard'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /********** COPY TEXT TO CLIPBOARD FUNCTION *********   */
    function copyTextToClipboard(text, btn) {
        if (!text) return;
        const doSuccess = () => {
            if (btn) {
                const orig = btn.innerHTML;
                btn.innerHTML = '<span class="material-icons-round" style="font-size:0.95rem">check</span> Copied!';
                setTimeout(() => { btn.innerHTML = orig; }, 1800);
            }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(doSuccess).catch(() => fallbackCopy(text, doSuccess));
        } else {
            fallbackCopy(text, doSuccess);
        }
    }

    /********** FALLBACK COPY TEXT TO CLIPBOARD FUNCTION *********   */
    function fallbackCopy(text, cb) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            if (cb) cb();
        } catch (e) { }
        document.body.removeChild(ta);
    }

    function isBlankCode(value) {
        const s = String(value ?? '').trim();
        return s === '' || s === '—' || s === '-' || s === 'null';
    }

    function isTagCategory(record) {
        return String(record?.item_category || '').trim().toUpperCase() === 'TAG';
    }

    function quotationFamilyLines(record) {
        const q = String(record?.quotation || '').trim();
        const so = String(record?.sales_order || '').trim();
        const fromPage = (currentRawRecords || []).filter((r) => {
            if (q && String(r.quotation || '').trim() === q) return true;
            if (!isBlankCode(so) && String(r.sales_order || '').trim() === so) return true;
            return false;
        });
        const extra = [...getSoDetailLines(so), ...getSoDetailLines(q)];
        const map = new Map();
        [...fromPage, ...extra].forEach((r) => {
            const id = String(r.id || `${r.quotation}-${r.line_item}-${r.material}`);
            if (!map.has(id)) map.set(id, r);
        });
        return Array.from(map.values()).sort((a, b) => (Number(a.line_item) || 0) - (Number(b.line_item) || 0));
    }

    function resolveWorkingRecord(clicked) {
        const family = quotationFamilyLines(clicked || {});
        const items = family.filter((r) => !r.is_header);
        let working = clicked || {};
        if (clicked?.is_header || isBlankCode(clicked?.material)) {
            working = items.find(isTagCategory) || items.find((r) => !isBlankCode(r.material)) || clicked || {};
        }
        const so = !isBlankCode(clicked?.sales_order) ? clicked.sales_order : (working.sales_order || '');
        return {
            ...working,
            sales_order: so,
            quotation: clicked?.quotation || working.quotation,
            customer: clicked?.customer || working.customer,
            customer_ref: clicked?.customer_ref || working.customer_ref,
            quotation_type: clicked?.quotation_type || working.quotation_type,
            requested_delivery_date: clicked?.requested_delivery_date || working.requested_delivery_date,
            valid_from: clicked?.valid_from || working.valid_from,
            valid_to: clicked?.valid_to || working.valid_to,
            _family: family,
            _items: items,
        };
    }

    function renderApiMissing(panel, title, message) {
        if (!panel) return;
        panel.innerHTML = `
            <div class="drawer-section-card" style="text-align:center;padding:2.5rem 1rem">
                <span class="material-icons-round" style="font-size:2.4rem;color:#f59e0b;margin-bottom:0.5rem;display:block">info</span>
                <div style="font-weight:700;font-size:1rem;color:#0f172a;margin-bottom:0.35rem">${escapeHtml(title)}</div>
                <div style="color:#64748b;font-size:0.85rem">${escapeHtml(message)}</div>
            </div>
        `;
    }

    function getSoDetailLines(so) {
        const key = String(so || '').trim();
        if (!key || key === '—') return [];
        if (Array.isArray(soDetailLines[key])) return soDetailLines[key];
        const stripped = key.replace(/^0+/, '') || '0';
        if (Array.isArray(soDetailLines[stripped])) return soDetailLines[stripped];
        const padded = key.padStart(10, '0');
        if (Array.isArray(soDetailLines[padded])) return soDetailLines[padded];
        return [];
    }

    function normLineNo(value) {
        return String(value || '').replace(/^0+/, '') || '0';
    }

    function enrichFromSalesApi(item) {
        if (!item) return item;
        const lines = getSoDetailLines(item.sales_order);
        if (!lines.length) return item;
        const line = normLineNo(item.line_item);
        const mat = String(item.material || '').trim();
        let match = lines.find((l) => normLineNo(l.line_item) === line);
        if (!match && mat && mat !== '—') {
            match = lines.find((l) => String(l.material || '').trim() === mat);
        }
        if (!match) return item;
        return {
            ...item,
            ...match,
            quotation: item.quotation || match.quotation,
            sales_order: item.sales_order || match.sales_order,
            _family: item._family,
        };
    }

    function fillSoModuleCards(record) {
        const so = record?.sales_order || '';
        const unit = record?.unit || 'EA';
        const confd = Number(record?.confd_deliv_qty);
        const qty = Number(record?.qty) || 0;
        if (dncPlanningVal) {
            dncPlanningVal.textContent = `${fmtNum(Number.isFinite(confd) && confd > 0 ? confd : qty)} ${unit}`;
        }
        if (dncBomVal) {
            if (!isBlankCode(so) && bomCacheBySo[so]) {
                dncBomVal.textContent = `${filterBomByLine(bomCacheBySo[so].data, record?.line_item).length} components`;
            } else {
                dncBomVal.textContent = 'Live SAP BOM';
            }
        }
        if (dncMaterialVal) {
            dncMaterialVal.textContent = isBlankCode(record?.material) ? '—' : record.material;
        }
        if (dncProcVal) {
            if (!isBlankCode(so) && procCacheBySo[so]) {
                dncProcVal.textContent = `${procCacheBySo[so].data.length} components`;
            } else if (record?.delivery_status && record.delivery_status !== '—') {
                dncProcVal.textContent = `Delivery ${record.delivery_status}`;
            } else {
                dncProcVal.textContent = isBlankCode(so) ? 'Needs sales order' : 'Ready';
            }
        }
    }

    function closeSoLineDrawer() {
        closeSubDrawer();
        if (soLineDrawer) {
            soLineDrawer.classList.remove('open');
            soLineDrawer.setAttribute('aria-hidden', 'true');
        }
    }

    function openSoLineDrawer(item, familyRecord) {
        if (!item) return;
        currentDrawerRecord = resolveWorkingRecord(enrichFromSalesApi({
            ...item,
            sales_order: familyRecord?.sales_order || item.sales_order,
            quotation: familyRecord?.quotation || item.quotation,
        }));
        const rec = currentDrawerRecord;
        const so = rec.sales_order || '—';
        const qt = rec.quotation || '—';
        if (soLineKicker) soLineKicker.textContent = rec.material && !isBlankCode(rec.material) ? rec.material : `Line ${rec.line_item || '—'}`;
        if (soLineTitle) soLineTitle.textContent = rec.material && !isBlankCode(rec.material) ? rec.material : `Sales Order ${so}`;
        if (soLineSub) {
            soLineSub.hidden = true;
            soLineSub.textContent = `Quotation ${qt} · Plant ${rec.plant || '—'} · ${rec.item_category || '—'}`;
        }
        const soBadgeNum = document.getElementById('soLineSoNum');
        if (soBadgeNum) soBadgeNum.textContent = so;
        const lineBadgeNum = document.getElementById('soLineLineNum');
        if (lineBadgeNum) lineBadgeNum.textContent = rec.line_item || '—';
        if (soLineFacts) {
            const facts = [
                ['Line', rec.line_item || '—', 'is-blue'],
                ['Qty', `${fmtNum(rec.qty)} ${rec.unit || 'EA'}`, 'is-green'],
                ['Confirmed', `${fmtNum(rec.confd_deliv_qty || rec.qty)} ${rec.unit || 'EA'}`, 'is-cyan'],
                ['Net', fmtMoney(rec.net_amount), 'is-amber'],
                ['Cost', fmtMoney(rec.cost), 'is-rose'],
                ['Status', rec.sd_process_status && rec.sd_process_status !== '—' ? rec.sd_process_status : (rec.status || 'Active'), 'is-violet'],
                ['Plant', rec.plant || '—', 'is-slate'],
                ['Cat', rec.item_category || '—', 'is-mint'],
            ];
            soLineFacts.innerHTML = facts.map(([label, val, cls], i) => (
                `<span class="so-line-badge ${cls}" style="animation-delay:${0.04 * (i + 1)}s"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(val))}</strong></span>`
            )).join('');
        }
        fillSoModuleCards(rec);
        if (drawer) drawer.scrollTop = 0;
        if (soLineDrawer) {
            soLineDrawer.classList.add('open');
            soLineDrawer.setAttribute('aria-hidden', 'false');
        }
    }

    function getSoTableSearchTerm() {
        return String(document.getElementById('soRelatedSearch')?.value || '').trim().toLowerCase();
    }

    function soTableRowText(r) {
        return [
            r.line_item, r.item_category, r.material, r.material_group, r.plant,
            r.customer, r.quotation_type, r.sales_order_type, r.qty, r.net_amount, r.sales_order,
        ].map((v) => String(v ?? '')).join(' ').toLowerCase();
    }

    function getSoColFilters() {
        const filters = {};
        document.querySelectorAll('.so-col-filter').forEach((inp) => {
            const key = inp.getAttribute('data-so-filter');
            const val = String(inp.value || '').trim().toLowerCase();
            if (key && val) filters[key] = val;
        });
        return filters;
    }

    function soLineMatchesFilters(item, q, colFilters) {
        if (q && !soTableRowText(item).includes(q)) return false;
        const map = {
            line_item: item.line_item,
            item_category: item.item_category,
            material: item.material,
            plant: item.plant,
            customer: item.customer,
            type: item.quotation_type || item.sales_order_type,
            qty: item.qty,
            net_amount: item.net_amount,
            sales_order: item.sales_order,
        };
        return Object.entries(colFilters).every(([key, val]) => String(map[key] ?? '').toLowerCase().includes(val));
    }

    function applySoTableFilter() {
        const q = getSoTableSearchTerm();
        const colFilters = getSoColFilters();
        const body = document.getElementById('soRelatedLinesBody');
        const countEl = document.getElementById('soRelatedCount');
        if (!body) return;
        let visible = 0;
        body.querySelectorAll('.so-related-row').forEach((row) => {
            const idx = Number(row.getAttribute('data-related-idx'));
            const item = soTableLines[idx];
            const show = item ? soLineMatchesFilters(item, q, colFilters) : false;
            row.style.display = show ? '' : 'none';
            if (show) visible += 1;
        });
        if (countEl) {
            const total = soTableLines.length;
            const filtered = q || Object.keys(colFilters).length;
            countEl.textContent = filtered ? `${visible} / ${total}` : `${total} item${total === 1 ? '' : 's'}`;
        }
    }

    function exportSoTable() {
        const q = getSoTableSearchTerm();
        const colFilters = getSoColFilters();
        const rows = soTableLines.filter((r) => soLineMatchesFilters(r, q, colFilters));
        const so = soTableParent?.sales_order || 'sales-order';
        downloadCsv(`sales-order-${so}-${Date.now()}.csv`, recordsToCsv(rows));
    }

    function renderRelatedOrderLines(record) {
        const body = document.getElementById('soRelatedLinesBody');
        const countEl = document.getElementById('soRelatedCount');
        const family = record?._family || quotationFamilyLines(record);
        const lines = family.length ? family : [];
        soTableLines = lines;
        soTableParent = record;
        const searchEl = document.getElementById('soRelatedSearch');
        if (searchEl) {
            searchEl.value = '';
            if (!searchEl.dataset.bound) {
                searchEl.dataset.bound = '1';
                searchEl.addEventListener('input', applySoTableFilter);
            }
        }
        const exportEl = document.getElementById('soRelatedExport');
        if (exportEl && !exportEl.dataset.bound) {
            exportEl.dataset.bound = '1';
            exportEl.addEventListener('click', exportSoTable);
        }
        const soTableEl = document.getElementById('soRelatedTable');
        const soFilterBtn = document.getElementById('soRelatedFilterBtn');
        if (soFilterBtn && !soFilterBtn.dataset.bound) {
            soFilterBtn.dataset.bound = '1';
            soFilterBtn.addEventListener('click', () => {
                const on = soTableEl?.classList.toggle('show-col-filters');
                soFilterBtn.classList.toggle('is-on', !!on);
                soFilterBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }
        const soExpandBtn = document.getElementById('soRelatedExpandBtn');
        const soPanel = document.getElementById('soRelatedPanel');
        if (soExpandBtn && !soExpandBtn.dataset.bound) {
            soExpandBtn.dataset.bound = '1';
            soExpandBtn.addEventListener('click', () => {
                const on = soPanel?.classList.toggle('is-expanded');
                soExpandBtn.classList.toggle('is-on', !!on);
                soExpandBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
                const icon = soExpandBtn.querySelector('.material-icons-round');
                if (icon) icon.textContent = on ? 'close_fullscreen' : 'open_in_full';
            });
        }
        if (!document.documentElement.dataset.soColFilterBound) {
            document.documentElement.dataset.soColFilterBound = '1';
            document.querySelectorAll('.so-col-filter').forEach((inp) => {
                inp.addEventListener('input', applySoTableFilter);
            });
        }
        if (countEl) {
            countEl.textContent = `${lines.length} item${lines.length === 1 ? '' : 's'}`;
        }
        if (!body) return lines;
        if (!lines.length) {
            body.innerHTML = '<tr><td colspan="9" class="so-related-empty">No sales order items for this quotation.</td></tr>';
            return lines;
        }
        body.innerHTML = lines.map((r, i) => {
            const cat = r.item_category || (r.is_header ? 'HDR' : '—');
            const desc = r.material_group && r.material_group !== '—' ? r.material_group : '';
            return `
            <tr class="so-related-row ${String(r.id) === String(record?.id) ? 'is-active' : ''}" data-related-idx="${i}" tabindex="0">
                <td><span class="line-no">${escapeHtml(r.line_item)}</span></td>
                <td><span class="category-tag">${escapeHtml(cat)}</span></td>
                <td class="rpt-mat">
                    <div>${escapeHtml(r.material || '—')}</div>
                    ${desc ? `<div class="style-meta">${escapeHtml(desc)}</div>` : ''}
                </td>
                <td>${getPlantBadgeHtml(r.plant)}</td>
                <td>${escapeHtml(r.customer || '—')}</td>
                <td>${escapeHtml(r.quotation_type || r.sales_order_type || '—')}</td>
                <td class="col-num">${fmtNum(r.qty)}${r.unit ? ` ${escapeHtml(r.unit)}` : ''}</td>
                <td class="col-num">${fmtMoney(r.net_amount)}</td>
                <td>${escapeHtml(r.sales_order || '—')}</td>
            </tr>`;
        }).join('');
        body.querySelectorAll('.so-related-row').forEach((row) => {
            const idx = Number(row.getAttribute('data-related-idx'));
            const item = lines[idx];
            if (!item) return;
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                body.querySelectorAll('.so-related-row').forEach((el) => el.classList.remove('is-active'));
                row.classList.add('is-active');
                openSoLineDrawer(item, record);
            });
        });
        return lines;
    }

    function renderSoDashboardCharts(lines) {
        const qtyEl = document.getElementById('soQtyChart');
        const mixEl = document.getElementById('soMixChart');
        const chartLines = (lines || []).filter((r) => !r.is_header);
        const qtyLabels = chartLines.map((r) => `${r.line_item} ${r.material || ''}`.trim().slice(0, 22));
        const orderQty = chartLines.map((r) => Number(r.qty) || 0);
        const confdQty = chartLines.map((r) => {
            const confd = Number(r.confd_deliv_qty);
            return Number.isFinite(confd) && confd > 0 ? confd : (Number(r.qty) || 0);
        });
        const mixMap = {};
        chartLines.forEach((r) => {
            const key = String(r.item_category || 'Other').trim() || 'Other';
            mixMap[key] = (mixMap[key] || 0) + (Number(r.net_amount) || 0);
        });
        const mixLabels = Object.keys(mixMap);
        const mixValues = Object.values(mixMap);
        const mixColors = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#e11d48', '#64748b'];

        if (soQtyChart) {
            soQtyChart.destroy();
            soQtyChart = null;
        }
        if (soMixChart) {
            soMixChart.destroy();
            soMixChart = null;
        }
        if (qtyEl && typeof Chart !== 'undefined') {
            soQtyChart = new Chart(qtyEl, {
                type: 'bar',
                data: {
                    labels: qtyLabels.length ? qtyLabels : ['No items'],
                    datasets: [{
                        label: 'Order qty',
                        data: orderQty.length ? orderQty : [0],
                        backgroundColor: orderQty.map((_, i) => i % 2 ? 'rgba(20, 184, 166, 0.85)' : 'rgba(37, 99, 235, 0.85)'),
                        borderRadius: 10,
                        borderSkipped: false,
                        maxBarThickness: 18,
                    }],
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(15,23,42,0.06)' } },
                        y: { ticks: { color: '#334155', font: { size: 10 } }, grid: { display: false } },
                    },
                },
            });
        }
        if (mixEl && typeof Chart !== 'undefined') {
            const netByItem = chartLines.map((r) => Number(r.net_amount) || 0);
            soMixChart = new Chart(mixEl, {
                type: 'line',
                data: {
                    labels: qtyLabels.length ? qtyLabels : ['No items'],
                    datasets: [{
                        label: 'Net value',
                        data: netByItem.length ? netByItem : [0],
                        borderColor: '#7c3aed',
                        backgroundColor: (ctx) => {
                            const chart = ctx.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return 'rgba(124, 58, 237, 0.18)';
                            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            g.addColorStop(0, 'rgba(124, 58, 237, 0.35)');
                            g.addColorStop(1, 'rgba(124, 58, 237, 0.02)');
                            return g;
                        },
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#7c3aed',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        borderWidth: 3,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { font: { size: 10 }, color: '#64748b', maxRotation: 35 }, grid: { display: false } },
                        y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(15,23,42,0.06)' } },
                    },
                },
            });
        }

        const itemsEl = document.getElementById('soDashItems');
        const qtyKpi = document.getElementById('soDashQty');
        const netKpi = document.getElementById('soDashNet');
        const qtySum = chartLines.reduce((s, r) => s + (Number(r.qty) || 0), 0);
        const netSum = chartLines.reduce((s, r) => s + (Number(r.net_amount) || 0), 0);
        if (itemsEl) itemsEl.textContent = String(chartLines.length);
        if (qtyKpi) qtyKpi.textContent = fmtNum(qtySum);
        if (netKpi) netKpi.textContent = fmtMoney(netSum);
    }

    async function loadSalesApiHubLines(so, familyRecord) {
        const key = String(so || '').replace(/^0+/, '') || String(so || '');
        if (!key || key === '—') return [];
        if (Array.isArray(salesApiHubCache[key]) && salesApiHubCache[key].length) {
            return salesApiHubCache[key];
        }
        if (!cfg.salesApiHubUrl) return [];
        const dash = document.getElementById('soDash');
        const dashLoader = document.getElementById('soDashLoader');
        dash?.classList.add('is-loading');
        if (dashLoader) dashLoader.hidden = false;
        try {
            const url = `${cfg.salesApiHubUrl}?sales_order=${encodeURIComponent(key)}`;
            const res = await fetch(url, { credentials: 'same-origin' });
            const json = await res.json();
            const records = Array.isArray(json.records) ? json.records : [];
            const mapped = records.map((row) => ({
                ...row,
                quotation: familyRecord?.quotation || row.quotation,
                customer: familyRecord?.customer || row.customer,
                customer_ref: familyRecord?.customer_ref || row.customer_ref,
                quotation_type: familyRecord?.quotation_type || row.quotation_type,
            }));
            salesApiHubCache[key] = mapped;
            soDetailLines[key] = mapped;
            soDetailLines[String(so)] = mapped;
            return mapped;
        } catch (_) {
            return [];
        } finally {
            dash?.classList.remove('is-loading');
            if (dashLoader) dashLoader.hidden = true;
        }
    }

    function openSalesOrderOffcanvas(record, initialTab = null) {
        if (!record || !drawer) return;
        currentDrawerRecord = resolveWorkingRecord(record);
        const related = renderRelatedOrderLines(currentDrawerRecord);
        renderSoDashboardCharts(related);
        const relatedNet = related.reduce((sum, r) => sum + (Number(r.net_amount) || 0), 0);
        const relatedQty = related.reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
        const so = currentDrawerRecord.sales_order || '—';
        const qt = currentDrawerRecord.quotation || '—';

        if (drawerQtNum) drawerQtNum.textContent = qt;
        if (drawerSoNum) drawerSoNum.textContent = so;
        if (drawerLineNum) drawerLineNum.textContent = String(related.length);
        if (drawerPlantNum) drawerPlantNum.textContent = currentDrawerRecord.plant || '—';
        const qtTypeEl = document.getElementById('salesDetailQtType');
        if (qtTypeEl) {
            qtTypeEl.textContent = currentDrawerRecord.quotation_type || currentDrawerRecord.sales_order_type || '—';
        }
        const qtCustEl = document.getElementById('salesDetailCustomer');
        if (qtCustEl) {
            qtCustEl.textContent = currentDrawerRecord.customer_ref || currentDrawerRecord.customer || '—';
        }
        if (drawerStatusPill) {
            drawerStatusPill.hidden = true;
            drawerStatusPill.textContent = currentDrawerRecord.status || 'Active';
        }
        if (detailTitle) {
            detailTitle.textContent = qt && qt !== '—' ? `Quotation ${qt}` : `Sales Order ${so}`;
        }
        if (drawerSub) {
            drawerSub.hidden = true;
        }

        if (drawerNetVal) drawerNetVal.textContent = fmtMoney(relatedNet);
        if (drawerQtyVal) drawerQtyVal.textContent = `${fmtNum(relatedQty)} ${currentDrawerRecord.unit || 'EA'}`;
        if (drawerDateVal) drawerDateVal.textContent = fmtSapDate(currentDrawerRecord.date) || currentDrawerRecord.date || '—';

        const setOd = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        };
        setOd('odSalesOrder', so);
        setOd('odLine', currentDrawerRecord.line_item);
        setOd('odPlant', currentDrawerRecord.plant);
        setOd('odStatus', currentDrawerRecord.status || 'Active');
        setOd('odMaterial', currentDrawerRecord.material);
        setOd('odMaterialGroup', currentDrawerRecord.material_group);
        setOd('odQty', `${fmtNum(currentDrawerRecord.qty)} ${currentDrawerRecord.unit || 'EA'}`);
        setOd('odNet', fmtMoney(currentDrawerRecord.net_amount));
        setOd('odDate', fmtSapDate(currentDrawerRecord.date) || currentDrawerRecord.date);
        setOd('odDivision', currentDrawerRecord.division);
        setOd('odCustomer', currentDrawerRecord.customer_ref || currentDrawerRecord.customer);
        setOd('odUnit', currentDrawerRecord.unit || 'EA');

        if (drawerQuickNet) drawerQuickNet.textContent = fmtMoney(relatedNet);
        if (drawerQuickQty) drawerQuickQty.textContent = `${fmtNum(relatedQty)} ${currentDrawerRecord.unit || 'EA'}`;
        if (drawerQuickDate) drawerQuickDate.textContent = fmtSapDate(currentDrawerRecord.date) || currentDrawerRecord.date || '—';
        if (drawerQuickPlant) drawerQuickPlant.textContent = currentDrawerRecord.plant || '—';

        closeSoLineDrawer();
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        if (backdrop) {
            backdrop.hidden = false;
            backdrop.style.display = 'block';
        }
        document.body.classList.add('sales-detail-open');

        activeDrawerTab = null;
        closeSubDrawer();

        loadSalesApiHubLines(so, currentDrawerRecord).then((apiLines) => {
            if (!apiLines.length || !drawer.classList.contains('open')) return;
            const apiRecord = { ...currentDrawerRecord, _family: apiLines };
            currentDrawerRecord = apiRecord;
            renderRelatedOrderLines(apiRecord);
            renderSoDashboardCharts(apiLines);
        });
    }

    function openDetail(record) {
        openSalesOrderOffcanvas(record, null);
    }

    function closeDetail() {
        closeSoLineDrawer();
        drawer?.classList.remove('open');
        drawer?.setAttribute('aria-hidden', 'true');
        if (backdrop) {
            backdrop.hidden = true;
            backdrop.style.display = 'none';
        }
        document.body.classList.remove('sales-detail-open');
    }
        env.fillSubDrawerSoBadge = fillSubDrawerSoBadge;
        env.openSubDrawer = openSubDrawer;
        env.openMaterialDetailsFor = openMaterialDetailsFor;
        env.closeSubDrawer = closeSubDrawer;
        env.switchDrawerTab = switchDrawerTab;
        env.renderPlanningPanel = renderPlanningPanel;
        env.copyTextToClipboard = copyTextToClipboard;
        env.fallbackCopy = fallbackCopy;
        env.isBlankCode = isBlankCode;
        env.isTagCategory = isTagCategory;
        env.quotationFamilyLines = quotationFamilyLines;
        env.resolveWorkingRecord = resolveWorkingRecord;
        env.renderApiMissing = renderApiMissing;
        env.getSoDetailLines = getSoDetailLines;
        env.normLineNo = normLineNo;
        env.enrichFromSalesApi = enrichFromSalesApi;
        env.fillSoModuleCards = fillSoModuleCards;
        env.closeSoLineDrawer = closeSoLineDrawer;
        env.openSoLineDrawer = openSoLineDrawer;
        env.getSoTableSearchTerm = getSoTableSearchTerm;
        env.soTableRowText = soTableRowText;
        env.getSoColFilters = getSoColFilters;
        env.soLineMatchesFilters = soLineMatchesFilters;
        env.applySoTableFilter = applySoTableFilter;
        env.exportSoTable = exportSoTable;
        env.renderRelatedOrderLines = renderRelatedOrderLines;
        env.renderSoDashboardCharts = renderSoDashboardCharts;
        env.loadSalesApiHubLines = loadSalesApiHubLines;
        env.openSalesOrderOffcanvas = openSalesOrderOffcanvas;
        env.openDetail = openDetail;
        env.closeDetail = closeDetail;
        }
    });
})();
