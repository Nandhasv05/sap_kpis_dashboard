<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 23/09/2026
// DESCRIPTION : Load domain + web + api routes

/** @var Router $router */

require base_path('app/routes/web/webRoutes.php');
require base_path('app/routes/quotation/quotationRoutes.php');
require base_path('app/routes/saleorder/saleorderRoutes.php');
require base_path('app/routes/bom/bomRoutes.php');
require base_path('app/routes/material/materialRoutes.php');
require base_path('app/routes/procurement/procurementRoutes.php');
require base_path('app/routes/customer/customerRoutes.php');
require base_path('app/routes/api/apiRoutes.php');
