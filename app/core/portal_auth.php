<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Portal auth class
 */

/*
 * Portal auth class
 */
$candidates = array(
    dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'portal_auth.php',
    dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'portal_auth.php',
    (string) ($_SERVER['DOCUMENT_ROOT'] ?? '') . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'portal_auth.php',
    '/var/www/html/includes/portal_auth.php',
    '/var/www/html/Evolv-Application/includes/portal_auth.php',
    '/home/evolv/evolvclothing/includes/portal_auth.php',
);
/*
 * Portal auth candidates
 */
foreach ($candidates as $candidate) {
    if ($candidate !== '' && is_file($candidate)) {
        require_once $candidate;
        return;
    }
}

http_response_code(500);
echo 'portal_auth.php not found. Copy includes/portal_auth.php onto this server.';
exit;
