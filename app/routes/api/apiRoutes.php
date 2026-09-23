<?php
/** @var Router $router */
$router->get('api/sales', [QuotationController::class, 'data']);
