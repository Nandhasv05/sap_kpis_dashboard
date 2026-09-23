<?php
/** @var Router $router */
$router->get('material', [MaterialController::class, 'index']);
$router->get('material/data', [MaterialController::class, 'data']);
$router->get('sales/material-api', [MaterialController::class, 'lineApi']);
