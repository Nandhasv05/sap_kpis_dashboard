<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 02/09/2026
// DESCRIPTION : Application config — LAN server vs local MAMP

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? getenv('EVOLV_HTTP_HOST') ?: ''));
$onServer = getenv('EVOLV_ENV') === 'production' || str_contains($host, '10.103.10.33');

return [
    'name'       => 'KPIS',
    'url'        => $onServer ? 'http://10.103.10.33/KPIS/' : 'http://localhost:8888/KPIS/',
    'env'        => $onServer ? 'production' : 'local',
    'base_path'  => '',
];
?>
