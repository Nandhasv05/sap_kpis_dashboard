<?php
/** @var Router $router */
$router->get('sales', [QuotationController::class, 'index']);
$router->get('sales/data', [QuotationController::class, 'data']);
