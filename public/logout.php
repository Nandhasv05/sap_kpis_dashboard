<?php
declare(strict_types=1);

if (!defined('EVOLV_ROOT')) {
    define('EVOLV_ROOT', dirname(__DIR__));
}
require EVOLV_ROOT . '/app/core/helpers.php';
require EVOLV_ROOT . '/app/core/portal_auth.php';
evolv_boot_app_base();

portal_logout();
header('Location: ' . (function_exists('kapis_evol_login_url') ? kapis_evol_login_url() : '/EVOL/login.php'));
exit;
