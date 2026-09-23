<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 26/08/2026
// DESCRIPTION : Public front controller for the app
/**
 * Kapis — public front controller
 */

declare(strict_types=1);

// START DEFINES
if (!defined('EVOLV_ROOT')) {
    define('EVOLV_ROOT', dirname(__DIR__));
}

// START REQUIRES
require EVOLV_ROOT . '/app/core/helpers.php';
require EVOLV_ROOT . '/app/core/Controller.php';
require EVOLV_ROOT . '/app/core/Router.php';

// START VARIABLES
/**
 * URL base for assets/links, e.g. /KPIS or /evolvclothing/public
 * Ignores Windows filesystem paths leaked into SCRIPT_NAME (CLI).
 */
evolv_boot_app_base();

$allowedDash = ['sales', 'material', 'planning'];
$dash = strtolower(trim((string) ($_GET['d'] ?? '')));
if ($dash === 'production') {
    header('Location: ' . kapis_dash_url('planning'));
    exit;
}
if (in_array($dash, $allowedDash, true)) {
    $routePath = '/' . $dash;
} else {
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $routePath = parse_url($uri, PHP_URL_PATH) ?: '/';
    if (preg_match('#^/(?:KPIS|Kapis)(/|$)#i', $routePath)) {
        $routePath = kapis_strip_url_prefix($routePath);
    }
    $base = (string) ($GLOBALS['app_base'] ?? '');
    if ($base !== '' && !kapis_is_app_base($base) && str_starts_with($routePath, $base)) {
        $routePath = substr($routePath, strlen($base)) ?: '/';
    }
    $routePath = preg_replace('#/index\.php(/|$)#', '/', $routePath) ?: '/';
    $routePath = preg_replace('#/+#', '/', $routePath) ?: '/';
    if ($routePath === '/' || $routePath === '') {
        $routePath = '/sales';
    }
}

if ($routePath === '/production') {
    header('Location: ' . kapis_dash_url('planning'));
    exit;
}

// START ROUTER
$router = new Router();
require EVOLV_ROOT . '/app/routes/web.php';

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $routePath);
