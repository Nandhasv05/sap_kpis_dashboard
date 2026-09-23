<?php
/** @var Router $router */

$router->get('/', [DashboardController::class, 'index']);
$router->get('meeting', [MeetingController::class, 'launch']);
$router->get('reports', [ReportController::class, 'index']);

$types = [
    'inventory', 'planning', 'production', 'quality',
    'retail', 'orders', 'procurement', 'sustainability',
];
foreach ($types as $type) {
    $router->get($type, function () use ($type) {
        (new DashboardController())->show($type);
    });
}

$router->get('sale', function () {
    header('Location: ' . url('sales'));
    exit;
});
