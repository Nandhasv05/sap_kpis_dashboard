/* AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Shared KPI card modal
 */
(function () {
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
