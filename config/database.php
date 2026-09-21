<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 16/09/2026
 * DESCRIPTION :  MySQL settings — LAN server uses evolv, local MAMP uses root
 */

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? getenv('EVOLV_HTTP_HOST') ?: ''));
$onServer = getenv('EVOLV_ENV') === 'production' || str_contains($host, '10.103.10.33');

return [
    'driver'   => 'mysql',
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'database' => 'evolvclothing',
    'username' => $onServer ? 'evolv' : 'root',
    'password' => $onServer ? 'Evolv@123' : 'root',
    'charset'  => 'utf8mb4',
];
?>
