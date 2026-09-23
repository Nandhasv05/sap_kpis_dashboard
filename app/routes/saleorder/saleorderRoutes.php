<?php
/** @var Router $router */
$router->get('sales/sales-api', [SaleOrderController::class, 'data']);
