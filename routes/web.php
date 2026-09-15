<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 26/08/2026
// DESCRIPTION : Web routes for the app
require_once base_path('app/controllers/DashboardController.php');
require_once base_path('app/controllers/SalesController.php');
require_once base_path('app/controllers/MaterialController.php');
require_once base_path('app/controllers/CustomerController.php');
require_once base_path('app/controllers/ReportController.php');
require_once base_path('app/controllers/MeetingController.php');

// START ROUTER
/** @var Router $router */

$router->get('/', [DashboardController::class, 'index']);
$router->get('meeting', [MeetingController::class, 'launch']);

// START CUSTOMERS ROUTE
$router->get('customers', [CustomerController::class, 'index']);

// START REPORTS ROUTE
$router->get('reports', [ReportController::class, 'index']);

// START SALES ROUTE
$router->get('sales', [SalesController::class, 'index']);
$router->get('sales/data', [SalesController::class, 'data']);
$router->get('api/sales', [SalesController::class, 'data']);
$router->get('sales/procurement', [SalesController::class, 'procurementData']);
$router->get('sales/procurement-pr', [SalesController::class, 'procurementPrData']);
$router->get('sales/bom', [SalesController::class, 'bomData']);
$router->get('sales/material-api', [SalesController::class, 'materialApiData']);

// START MATERIAL ROUTE (ZI_SalesApi_HUB)
$router->get('material', [MaterialController::class, 'index']);
$router->get('material/data', [MaterialController::class, 'data']);

// Operational dashboards (inventory, planning, production, …)
// START OPERATIONAL DASHBOARDS
$types = [
    'inventory', 'planning', 'production', 'quality',
    'retail', 'orders', 'procurement', 'sustainability',
];
// START DASHBOARD TYPES
foreach ($types as $type) {
    $router->get($type, function () use ($type) {
        (new DashboardController())->show($type);
    });
}

// Alias
$router->get('sale', function () {
    header('Location: ' . url('sales'));
    exit;
});
