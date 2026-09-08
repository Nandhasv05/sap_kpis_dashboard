/* AUTHOR : NANDHAKUMAR S V
// DATE : 26/08/2026
// DESCRIPTION : Shared application UI for the app
/* Evolv app — period filter + mobile nav */
(function () {
    // Ripple
    document.querySelectorAll('.ripple-btn, .md-btn-filled').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Mobile nav
    const navToggle = document.getElementById('navToggle');
    const navToggleIcon = document.getElementById('navToggleIcon');
    const sideNav = document.getElementById('sideNav');
    const navBackdrop = document.getElementById('navBackdrop');

    // OPEN NAV METHOD
    function openNav() {
        document.body.classList.add('nav-open');
        if (navBackdrop) navBackdrop.hidden = false;
        navToggle?.setAttribute('aria-expanded', 'true');
        navToggle?.setAttribute('aria-label', 'Close menu');
        if (navToggleIcon) navToggleIcon.textContent = 'close';
    }

    // CLOSE NAV METHOD
    function closeNav() {
        document.body.classList.remove('nav-open');
        if (navBackdrop) navBackdrop.hidden = true;
        navToggle?.setAttribute('aria-expanded', 'false');
        navToggle?.setAttribute('aria-label', 'Open menu');
        if (navToggleIcon) navToggleIcon.textContent = 'menu';
    }

    // TOGGLE NAV METHOD
    function toggleNav() {
        if (document.body.classList.contains('nav-open')) closeNav();
        else openNav();
    }

    // NAV TOGGLE CLICK EVENT
    navToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNav();
    });

    // NAV BACKDROP CLICK EVENT
    navBackdrop?.addEventListener('click', closeNav);

    // TOP NAV LINKS CLICK EVENT
    sideNav?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeNav);
    });

    // WINDOW RESIZE EVENT
    window.addEventListener('resize', () => {
        if (window.innerWidth > 960) closeNav();
    });

    // DOCUMENT KEYDOWN EVENT
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNav();
            closeAccountMenu();
        }
    });

    // ACCOUNT MENU
    const account = document.getElementById('account');
    const accountBtn = document.getElementById('accountBtn');
    const accountMenu = document.getElementById('accountMenu');

    function openAccountMenu() {
        if (!accountMenu) return;
        accountMenu.hidden = false;
        accountBtn?.setAttribute('aria-expanded', 'true');
    }

    function closeAccountMenu() {
        if (!accountMenu) return;
        accountMenu.hidden = true;
        accountBtn?.setAttribute('aria-expanded', 'false');
    }

    accountBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (accountMenu?.hidden) openAccountMenu();
        else closeAccountMenu();
    });

    // PERIOD FILTER
    const periodFilter = document.getElementById('periodFilter');
    const periodTrigger = document.getElementById('periodTrigger');
    const periodMenu = document.getElementById('periodMenu');
    const periodLabel = document.getElementById('periodTriggerLabel');
    const customModal = document.getElementById('customDateModal');
    const headerFrom = document.getElementById('headerDateFrom');
    const headerTo = document.getElementById('headerDateTo');

    // PERIOD LABELS
    const PERIOD_LABELS = {
        today: 'Today',
        yesterday: 'Yesterday',
        this_week: 'This Week',
        prev_week: 'Previous Week',
        this_month: 'This Month',
        prev_month: 'Previous Month',
        custom: 'Custom Date'
    };

    // PAD FUNCTION
    function pad(n) { return String(n).padStart(2, '0'); }
    function fmt(d) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    // START OF WEEK FUNCTION
    function startOfWeek(d) {
        const x = new Date(d);
        const day = x.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        x.setDate(x.getDate() + diff);
        x.setHours(0, 0, 0, 0);
        return x;
    }

    // END OF WEEK FUNCTION
    function endOfWeek(d) {
        const s = startOfWeek(d);
        const e = new Date(s);
        e.setDate(s.getDate() + 6);
        return e;
    }

    // GET PERIOD RANGE FUNCTION
    function getPeriodRange(period) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let from, to;

        switch (period) {
            case 'today':
                from = to = new Date(now);
                break;
            case 'yesterday':
                from = to = new Date(now);
                from.setDate(from.getDate() - 1);
                to = new Date(from);
                break;
            case 'this_week':
                from = startOfWeek(now);
                to = endOfWeek(now);
                break;
            case 'prev_week': {
                const thisStart = startOfWeek(now);
                to = new Date(thisStart);
                to.setDate(to.getDate() - 1);
                from = startOfWeek(to);
                break;
            }
            case 'this_month':
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'prev_month':
                from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            default:
                from = new Date(now.getFullYear(), 0, 1);
                to = new Date(now.getFullYear(), 11, 31);
        }
        return { from: fmt(from), to: fmt(to), period };
    }

    // EMIT PERIOD FUNCTION
    function emitPeriod(detail) {
        window.dispatchEvent(new CustomEvent('evolv:periodchange', { detail }));
        const dashFrom = document.getElementById('dateFrom');
        const dashTo = document.getElementById('dateTo');
        if (dashFrom) dashFrom.value = detail.from;
        if (dashTo) dashTo.value = detail.to;
    }

    // SELECT PERIOD FUNCTION
    function selectPeriod(period, customRange) {
        const range = customRange || getPeriodRange(period);
        if (periodLabel) periodLabel.textContent = PERIOD_LABELS[period] || 'Period';
        document.querySelectorAll('.period-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
        closePeriodMenu();
        emitPeriod({ ...range, period });
        document.querySelectorAll('.header-line-beam').forEach(b => {
            b.style.animation = 'none';
            void b.offsetWidth;
            b.style.animation = '';
        });
    }

    // OPEN PERIOD MENU FUNCTION
    function openPeriodMenu() {
        if (!periodMenu || !periodFilter) return;
        periodMenu.hidden = false;
        periodFilter.classList.add('open');
        periodTrigger?.setAttribute('aria-expanded', 'true');
    }

    // CLOSE PERIOD MENU FUNCTION
    function closePeriodMenu() {
        if (!periodMenu || !periodFilter) return;
        periodMenu.hidden = true;
        periodFilter.classList.remove('open');
        periodTrigger?.setAttribute('aria-expanded', 'false');
    }

    // PERIOD TRIGGER CLICK EVENT
    if (periodTrigger) {
        periodTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (periodMenu.hidden) openPeriodMenu();
            else closePeriodMenu();
        });
    }

    // PERIOD OPTIONS CLICK EVENT
    document.querySelectorAll('.period-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const period = opt.dataset.period;
            if (period === 'custom') {
                closePeriodMenu();
                if (customModal) {
                    const def = getPeriodRange('this_month');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (headerFrom) {
                        headerFrom.value = def.from;
                        headerFrom.removeAttribute('min');
                        headerFrom.max = fmt(today);
                    }
                    if (headerTo) {
                        headerTo.value = def.to;
                        headerTo.removeAttribute('min');
                        headerTo.max = fmt(today);
                    }
                    const err = document.getElementById('customDateError');
                    if (err) err.hidden = true;
                    customModal.hidden = false;
                }
                return;
            }
            selectPeriod(period);
        });
    });

    // DOCUMENT CLICK EVENT
    document.addEventListener('click', (e) => {
        if (periodFilter && !periodFilter.contains(e.target)) closePeriodMenu();
        if (account && !account.contains(e.target)) closeAccountMenu();
    });

    // CUSTOM DATE CANCEL CLICK EVENT
    document.getElementById('customDateCancel')?.addEventListener('click', () => {
        if (customModal) customModal.hidden = true;
    });

    // CUSTOM DATE APPLY CLICK EVENT
    document.getElementById('customDateApply')?.addEventListener('click', () => {
        const err = document.getElementById('customDateError');
        function showErr(msg) {
            if (!err) {
                alert(msg);
                return;
            }
            err.textContent = msg;
            err.hidden = false;
        }
        if (err) err.hidden = true;
        if (!headerFrom?.value || !headerTo?.value) {
            showErr('Choose both From and To dates.');
            return;
        }
        if (headerFrom.value > headerTo.value) {
            showErr('Start date must be before end date.');
            return;
        }
        const from = new Date(headerFrom.value + 'T00:00:00');
        const to = new Date(headerTo.value + 'T00:00:00');
        const maxTo = new Date(from);
        maxTo.setMonth(maxTo.getMonth() + 6);
        if (to > maxTo) {
            showErr('Custom date range cannot exceed 6 months.');
            return;
        }
        if (customModal) customModal.hidden = true;
        selectPeriod('custom', { from: headerFrom.value, to: headerTo.value, period: 'custom' });
    });

    // CUSTOM MODAL CLICK EVENT
    customModal?.addEventListener('click', (e) => {
        if (e.target === customModal) customModal.hidden = true;
    });

    // PERIOD TRIGGER CLICK EVENT
    if (periodTrigger) {
        const initial = getPeriodRange('this_month');
        emitPeriod({ ...initial, period: 'this_month' });
    }

    // FADE UP, FADE IN, ANIM UP ELEMENTS
    setTimeout(() => {
        document.querySelectorAll('.fade-up, .fade-in, .anim-up').forEach(el => {
            el.style.opacity = '1';
            el.classList.remove('fade-up', 'fade-in', 'anim-up', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6');
        });
    }, 1400);

    const splash = document.getElementById('kapisSplash');

    function showKapisSplash() {
        if (!splash) return;
        splash.classList.remove('is-done');
        splash.removeAttribute('hidden');
    }

    function hideKapisSplash() {
        if (!splash) return;
        splash.classList.add('is-done');
        setTimeout(() => {
            if (splash.classList.contains('is-done')) {
                splash.setAttribute('hidden', '');
            }
        }, 280);
    }

    window.kapisSplash = { show: showKapisSplash, hide: hideKapisSplash };

    function hideSplashSoon() {
        const wait = document.readyState === 'complete' ? 280 : 520;
        setTimeout(hideKapisSplash, wait);
    }

    if (document.readyState === 'complete') {
        hideSplashSoon();
    } else {
        window.addEventListener('load', hideSplashSoon);
        setTimeout(hideKapisSplash, 2500);
    }

    document.querySelectorAll('.kapis-tab').forEach((link) => {
        link.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === '_blank') {
                return;
            }
            showKapisSplash();
        });
    });

    const kpiModal = document.getElementById('kpiModal');
    const kpiModalCard = kpiModal?.querySelector('.kpi-modal-card');
    const kpiModalTitle = document.getElementById('kpiModalTitle');
    const kpiModalValue = document.getElementById('kpiModalValue');
    const kpiModalNote = document.getElementById('kpiModalNote');
    const kpiModalLabel = document.getElementById('kpiModalLabel');
    const kpiModalBody = document.getElementById('kpiModalBody');
    const kpiModalIconName = document.getElementById('kpiModalIconName');
    const kpiModalIcon = document.getElementById('kpiModalIcon');

    function cardTone(card) {
        const cls = [...(card?.classList || [])].find((c) => c.startsWith('tone-'));
        return cls ? cls.replace('tone-', '') : 'sky';
    }

    function detailsFromCard(card) {
        const related = [...document.querySelectorAll('.kpi-card.proj-card')].map((el) => ([
            el.querySelector('.label')?.textContent?.trim() || 'Metric',
            el.querySelector('.value')?.textContent?.trim() || '—',
        ]));
        return {
            title: card.querySelector('.label')?.textContent?.trim() || 'KPI details',
            value: card.querySelector('.value')?.textContent?.trim() || '—',
            note: card.querySelector('.change')?.textContent?.trim() || '',
            icon: card.querySelector('.kpi-icon .material-icons-round')?.textContent?.trim() || 'insights',
            tone: cardTone(card),
            rows: related,
        };
    }

    function openKpiModal(opts) {
        if (!kpiModal) return;
        const tone = opts.tone || 'sky';
        kpiModal.dataset.tone = tone;
        if (kpiModalCard) {
            kpiModalCard.style.setProperty('--tone', getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#1b5e4b');
        }
        const toneMap = {
            sky: '#0369a1',
            mint: '#047857',
            amber: '#b45309',
            violet: '#6d28d9',
            rose: '#be123c',
            teal: '#0f766e',
        };
        const color = toneMap[tone] || '#1b5e4b';
        if (kpiModalCard) kpiModalCard.style.setProperty('--tone', color);
        if (kpiModalIcon) kpiModalIcon.style.background = color;
        if (kpiModalTitle) kpiModalTitle.textContent = opts.title || 'KPI details';
        if (kpiModalLabel) kpiModalLabel.textContent = opts.title || 'Value';
        if (kpiModalValue) kpiModalValue.textContent = opts.value || '—';
        if (kpiModalNote) kpiModalNote.textContent = opts.note || '';
        if (kpiModalIconName) kpiModalIconName.textContent = opts.icon || 'insights';
        if (kpiModalBody) {
            const rows = Array.isArray(opts.rows) ? opts.rows : [];
            kpiModalBody.innerHTML = rows.map((row, i) => `
                <div class="kpi-modal-stat" style="animation-delay:${0.05 * i}s">
                    <span>${String(row[0] ?? '')}</span>
                    <strong>${String(row[1] ?? '—')}</strong>
                </div>
            `).join('');
        }
        kpiModal.hidden = false;
        document.body.classList.add('kpi-modal-open');
    }

    function closeKpiModal() {
        if (!kpiModal) return;
        kpiModal.hidden = true;
        document.body.classList.remove('kpi-modal-open');
    }

    window.kapisKpiModal = { open: openKpiModal, close: closeKpiModal };

    document.querySelectorAll('.kpi-card.proj-card').forEach((card) => {
        function show() {
            const key = card.dataset.kpi || '';
            const extra = typeof window.kapisKpiDetails === 'function' ? window.kapisKpiDetails(key, card) : null;
            openKpiModal(extra || detailsFromCard(card));
        }
        card.addEventListener('click', show);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                show();
            }
        });
    });

    document.getElementById('kpiModalClose')?.addEventListener('click', closeKpiModal);
    kpiModal?.addEventListener('click', (e) => {
        if (e.target === kpiModal) closeKpiModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeKpiModal();
    });
})();
