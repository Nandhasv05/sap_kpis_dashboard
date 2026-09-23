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


    document.addEventListener('click', (e) => {
        if (account && !account.contains(e.target)) closeAccountMenu();
    });

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
    window.kpiLoader = {
        show: function (message) {
            const label = document.getElementById('kapisSplashLabel') || splash?.querySelector('.kapis-splash-label');
            if (label) label.textContent = message || 'Loading';
            showKapisSplash();
        },
        hide: hideKapisSplash,
    };

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


    window.kapisEmptyHtml = function (title, hint) {
        const t = String(title || 'No data found');
        const h = String(hint || 'Nothing matched this filter. Try another date range or search.');
        return `<div class="kapis-empty-anim">
            <svg class="kapis-empty-scene" viewBox="0 0 160 120" aria-hidden="true">
                <g class="kapis-empty-box">
                    <rect x="28" y="48" width="84" height="52" rx="10" fill="#eef2ff" stroke="#c7d2fe" stroke-width="2"/>
                    <path d="M40 48 V40 a20 14 0 0 1 60 0 v8" fill="none" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round"/>
                    <g class="kapis-empty-dots" fill="#6366f1">
                        <circle cx="52" cy="74" r="3.2"/>
                        <circle cx="70" cy="74" r="3.2"/>
                        <circle cx="88" cy="74" r="3.2"/>
                    </g>
                </g>
                <g class="kapis-empty-glass">
                    <circle cx="108" cy="38" r="16" fill="#fff" stroke="#f59e0b" stroke-width="4"/>
                    <path d="M120 50 L132 64" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
                </g>
            </svg>
            <strong>${t.replace(/[<>]/g, '')}</strong>
            <span>${h.replace(/[<>]/g, '')}</span>
        </div>`;
    };

    window.kapisFetch = async function (url, options, timeoutMs) {
        const ctrl = new AbortController();
        const wait = timeoutMs || 32000;
        const timer = setTimeout(() => ctrl.abort(), wait);
        try {
            return await fetch(url, Object.assign({}, options || {}, { signal: ctrl.signal }));
        } catch (err) {
            if (err && err.name === 'AbortError') {
                throw new Error('Request timed out. Try a smaller date range or search by sales order.');
            }
            throw err;
        } finally {
            clearTimeout(timer);
        }
    };
})();
