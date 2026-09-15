<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 03/09/2026
// DESCRIPTION : Kapis layout — filter bar + Sales / Material / Planning

$activeNav = $activeNav ?? 'sales';
$pageTitle = $pageTitle ?? 'KPIS';
$primaryColor = $primaryColor ?? '#1b5e4b';
$primaryDark = $primaryDark ?? '#0f3d32';
$brandName = config('app')['name'] ?? 'KPIS';

$portalAuth = base_path('app/core/portal_auth.php');
require_once $portalAuth;
portal_require_login();
$portalUser = portal_user();
$portalName = $portalUser['username'] ?? 'User';
$portalRole = $portalUser['role'] ?? '';
$portalInitial = strtoupper(substr((string) $portalName, 0, 2));
$portalHome = function_exists('kapis_evol_home_url') ? kapis_evol_home_url() : '/EVOL/portal_dashboard.php';
$dashboardName = $pageTitle;
if ($dashboardName !== '' && !preg_match('/dashboard$/i', $dashboardName)) {
    $dashboardName .= ' Dashboard';
}
$logoUrl = asset('assets/logo.png');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($pageTitle) ?> — <?= e($brandName) ?></title>
    <link rel="icon" type="image/png" href="<?= e($logoUrl) ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
    <link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>">
    <style>
        :root {
            --primary: <?= e($primaryColor) ?>;
            --primary-dark: <?= e($primaryDark) ?>;
        }
        .kapis-splash {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            background: #fff;
        }
    </style>
    <?php if (!empty($extraHead)) echo $extraHead; ?>
</head>
<body class="kapis-lite">
    <div class="kapis-splash" id="kapisSplash">
        <div class="kapis-splash-spin" aria-hidden="true">
            <img src="<?= e($logoUrl) ?>" alt="">
        </div>
        <p class="kapis-splash-label">Loading</p>
    </div>
    <div class="loading-bar" id="loadingBar"></div>

    <div class="kapis-bar">
        <div class="kapis-bar-left">
            <a href="<?= e(url()) ?>" class="kapis-brand" aria-label="evolv" title="evolv">
                <img src="<?= e($logoUrl) ?>" alt="evolv">
            </a>
            <a href="<?= e($portalHome) ?>" class="kapis-home" aria-label="Portal home" title="Back to Portal Home">
                <span class="material-icons-round">home</span>
            </a>
        </div>

        <div class="kapis-bar-right">
            <div class="period-filter" id="periodFilter">
                <button type="button" class="period-trigger" id="periodTrigger" aria-haspopup="listbox" aria-expanded="false" title="Filter by date condition">
                    <span class="material-icons-round">calendar_today</span>
                    <span id="periodTriggerLabel"><?= e($periodLabel ?? 'This Week') ?></span>
                    <span class="material-icons-round chev">expand_more</span>
                </button>
                <div class="period-menu" id="periodMenu" role="listbox" hidden>
                    <button type="button" class="period-option" data-period="today">Today</button>
                    <button type="button" class="period-option" data-period="yesterday">Yesterday</button>
                    <button type="button" class="period-option active" data-period="this_week">This Week</button>
                    <button type="button" class="period-option" data-period="prev_week">Previous Week</button>
                    <button type="button" class="period-option" data-period="this_month">This Month</button>
                    <button type="button" class="period-option" data-period="prev_month">Previous Month</button>
                    <button type="button" class="period-option" data-period="custom">Custom Date</button>
                </div>
            </div>

            <div class="account" id="account">
                <button type="button" class="avatar" id="accountBtn" aria-label="Account" aria-expanded="false" aria-haspopup="menu">
                    <?= e($portalInitial) ?>
                </button>
                <div class="account-menu" id="accountMenu" hidden>
                    <div class="account-who">
                        <b><?= e($portalName) ?></b>
                        <span><?= e($portalRole !== '' ? $portalRole : 'Signed in') ?></span>
                    </div>
                    <a href="<?= e($portalHome) ?>">
                        <span class="material-icons-round">home</span>
                        Portal home
                    </a>
                    <a class="out" href="<?= e(url('logout.php')) ?>">
                        <span class="material-icons-round">logout</span>
                        Logout
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="custom-date-modal" id="customDateModal" hidden>
        <div class="custom-date-card">
            <h3>Custom date</h3>
            <p class="custom-date-hint">Choose a range of at most 6 months.</p>
            <div class="custom-date-fields">
                <div class="md-field">
                    <label for="headerDateFrom">From</label>
                    <input type="date" id="headerDateFrom">
                </div>
                <div class="md-field">
                    <label for="headerDateTo">To</label>
                    <input type="date" id="headerDateTo">
                </div>
            </div>
            <p class="custom-date-error" id="customDateError" hidden></p>
            <div class="custom-date-actions">
                <button type="button" class="md-btn md-btn-ghost" id="customDateCancel">Cancel</button>
                <button type="button" class="md-btn md-btn-filled ripple-btn" id="customDateApply">Apply</button>
            </div>
        </div>
    </div>

    <div class="kpi-modal" id="kpiModal" hidden>
        <div class="kpi-modal-card">
            <div class="kpi-modal-head">
                <div class="kpi-modal-icon" id="kpiModalIcon">
                    <span class="material-icons-round" id="kpiModalIconName">insights</span>
                </div>
                <div>
                    <p class="kpi-modal-eyebrow">KPI details</p>
                    <h3 id="kpiModalTitle">—</h3>
                </div>
                <button type="button" class="icon-btn" id="kpiModalClose" aria-label="Close details">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <div class="kpi-modal-hero">
                <div class="label" id="kpiModalLabel">Value</div>
                <div class="value" id="kpiModalValue">—</div>
                <p id="kpiModalNote"></p>
            </div>
            <div class="kpi-modal-grid" id="kpiModalBody"></div>
        </div>
    </div>

    <main class="page-content">
        <?= $content ?>
    </main>

    <script src="<?= e(asset('js/app.js')) ?>"></script>
    <?php if (!empty($extraScripts)) echo $extraScripts; ?>
</body>
</html>
