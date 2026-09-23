/* AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Header period filter + custom date range
 */
(function () {
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


    document.addEventListener('click', (e) => {
        if (periodFilter && !periodFilter.contains(e.target)) closePeriodMenu();
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

    // PERIOD TRIGGER INITIALIZE
    if (periodTrigger) {
        const pageCfg = window.SALES_PAGE || {};
        const defPeriod = pageCfg.defaultPeriod || 'this_week';
        const initial = (pageCfg.defaultFrom && pageCfg.defaultTo)
            ? { from: pageCfg.defaultFrom, to: pageCfg.defaultTo, period: defPeriod }
            : getPeriodRange(defPeriod);

        if (periodLabel) {
            periodLabel.textContent = PERIOD_LABELS[defPeriod] || 'This Week';
        }
        document.querySelectorAll('.period-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === defPeriod);
        });
        emitPeriod({ ...initial, period: defPeriod });
    }
})();
