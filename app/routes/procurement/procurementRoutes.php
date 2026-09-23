<?php
/** @var Router $router */
$router->get('sales/procurement', [ProcurementController::class, 'data']);
$router->get('sales/procurement-pr', [ProcurementController::class, 'prData']);
