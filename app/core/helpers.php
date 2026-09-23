<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Helpers for the Kapis application
 */

/*
 * Base path function
 */
function base_path(string $path = ''): string
{
    $root = dirname(__DIR__, 2);
    return $path === '' ? $root : $root . DIRECTORY_SEPARATOR . ltrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path), DIRECTORY_SEPARATOR);
}

/*
 * Config function
 */
function config(string $file): array
{
    static $cache = [];
    if (!isset($cache[$file])) {
        $path = base_path('config/' . $file . '.php');
        $cache[$file] = file_exists($path) ? require $path : [];
    }
    return $cache[$file];
}

/*
 * URL function
 */
function url(string $path = ''): string
{
    $base = $GLOBALS['app_base'] ?? '';
    $path = ltrim($path, '/');
    if ($path === '') {
        return $base === '' ? '/' : rtrim($base, '/') . '/';
    }
    return rtrim($base, '/') . '/' . $path;
}

/*
 * Asset function
 */
function asset(string $path): string
{
    $rel = ltrim($path, '/');
    $href = url($rel);
    $file = base_path('public/' . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel));
    if (is_file($file)) {
        $href .= (str_contains($href, '?') ? '&' : '?') . 'v=' . filemtime($file);
    }
    return $href;
}

/*
 * Escape function
 */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/*
 * Evolv HTTP host function
 */
function evolv_http_host(): string
{
    return strtolower((string) ($_SERVER['HTTP_HOST'] ?? getenv('EVOLV_HTTP_HOST') ?: ''));
}

/** True on the internal LAN box http://10.103.10.33/ */
/*
 * Evolv is LAN server function
 */
function evolv_is_lan_server(): bool
{
    if (getenv('EVOLV_ENV') === 'production') {
        return true;
    }
    $host = evolv_http_host();
    return str_contains($host, '10.103.10.33');
}

/** Public URL prefix. Incoming /Kapis/ is still accepted. */
/*
 * Kapis app base function
 */
function kapis_app_base(): string
{
    return '/KPIS';
}

/*
 * Kapis is app base function
 */
function kapis_is_app_base(string $base): bool
{
    $base = rtrim($base, '/');
    return strcasecmp($base, '/KPIS') === 0 || strcasecmp($base, '/Kapis') === 0;
}

/*
 * Kapis strip url prefix function
 */
function kapis_strip_url_prefix(string $path): string
{
    $stripped = preg_replace('#^/(?:KPIS|Kapis)(?=/|$)#i', '', $path);
    return ($stripped === null || $stripped === '') ? '/' : $stripped;
}

/*
 * Kapis dash url function
 */
function kapis_dash_url(string $slug): string
{
    $slug = strtolower(trim($slug, '/'));
    $allowed = ['sales', 'material', 'planning'];
    if (!in_array($slug, $allowed, true)) {
        $slug = 'sales';
    }
    $base = rtrim((string) ($GLOBALS['app_base'] ?? kapis_app_base()), '/');
    if ($base === '') {
        $base = kapis_app_base();
    }
    return $base . '/index.php?d=' . rawurlencode($slug);
}

/*
 * Kapis evol home url function
 */
function kapis_evol_home_url(): string
{
    return '/EVOL/portal_dashboard.php';
}

/*
 * Kapis evol login url function
 */
function kapis_evol_login_url(): string
{
    return '/EVOL/login.php';
}

/*
 * Evolv boot app base function
 */
function evolv_boot_app_base(): void
{
    $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    $scriptDir = dirname($scriptName);
    if ($scriptDir === '/' || $scriptDir === '.' || $scriptDir === '\\' || !str_starts_with($scriptDir, '/')) {
        $GLOBALS['app_base'] = '';
    } else {
        $GLOBALS['app_base'] = rtrim($scriptDir, '/');
    }

    $uri = str_replace('\\', '/', (string) (parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: ''));
    if (preg_match('#^/(?:KPIS|Kapis)(/|$)#i', $uri)) {
        $GLOBALS['app_base'] = kapis_app_base();
    }
}

function kapis_autoload(string $class): void
{
    static $loaded = [];
    if (isset($loaded[$class])) {
        return;
    }

    $relatives = [
        "app/core/{$class}.php",
        "app/controller/quotation/{$class}.php",
        "app/controller/saleorder/{$class}.php",
        "app/controller/bom/{$class}.php",
        "app/controller/material/{$class}.php",
        "app/controller/procurement/{$class}.php",
        "app/controller/customer/{$class}.php",
        "app/controller/dashboard/{$class}.php",
        "app/controller/report/{$class}.php",
        "app/controller/meeting/{$class}.php",
        "app/controller/error/{$class}.php",
        "app/models/quotation/{$class}.php",
        "app/models/saleorder/{$class}.php",
        "app/models/bom/{$class}.php",
        "app/models/material/{$class}.php",
        "app/models/procurement/{$class}.php",
        "app/models/customer/{$class}.php",
        "app/models/dashboard/{$class}.php",
        "app/models/report/{$class}.php",
        "app/services/quotation/{$class}.php",
        "app/services/saleorder/{$class}.php",
        "app/services/bom/{$class}.php",
        "app/services/material/{$class}.php",
        "app/services/procurement/{$class}.php",
        "app/services/customer/{$class}.php",
    ];

    foreach ($relatives as $relative) {
        $file = base_path($relative);
        if (is_file($file)) {
            $loaded[$class] = true;
            require_once $file;
            return;
        }
    }
}

spl_autoload_register('kapis_autoload');
