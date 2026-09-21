<?php
declare(strict_types=1);

if (!defined('EVOLV_ROOT')) {
    define('EVOLV_ROOT', dirname(__DIR__));
}
require EVOLV_ROOT . '/app/core/helpers.php';
require EVOLV_ROOT . '/app/core/portal_auth.php';
evolv_boot_app_base();

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $error = (string) (portal_login($_POST['username'] ?? '', $_POST['password'] ?? '') ?? '');
    if ($error === '') {
        header('Location: ' . (function_exists('kapis_dash_url') ? kapis_dash_url('sales') : url()));
        exit;
    }
}

if (portal_user()) {
    header('Location: ' . (function_exists('kapis_dash_url') ? kapis_dash_url('sales') : url()));
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Sign in — KPIS</title>
    <link rel="icon" type="image/png" href="<?= e(asset('assets/logo.png')) ?>">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: 'DM Sans', sans-serif;
            background: linear-gradient(165deg, #f3f7f5 0%, #e4eee8 100%);
            color: #122315;
        }
        .card {
            width: min(420px, calc(100% - 32px));
            background: #fff;
            border-radius: 18px;
            padding: 32px 28px;
            box-shadow: 0 18px 40px rgba(18, 35, 21, 0.08);
        }
        h1 { margin: 0 0 6px; font-size: 1.6rem; }
        p { margin: 0 0 22px; color: #5b6b60; }
        label { display: block; font-size: 13px; font-weight: 600; margin: 0 0 6px; }
        input {
            width: 100%;
            border: 1px solid #d5e0d9;
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 14px;
            font: inherit;
        }
        button {
            width: 100%;
            border: 0;
            border-radius: 10px;
            padding: 12px;
            background: #1b5e4b;
            color: #fff;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
        }
        .err {
            background: #fef2f2;
            color: #b91c1c;
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 14px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <form class="card" method="post" action="<?= e(url('login.php')) ?>">
        <h1>Sign in</h1>
        <p>KPIS · Sales, Material, Planning, Production</p>
        <?php if ($error !== ''): ?>
            <div class="err"><?= e($error) ?></div>
        <?php endif; ?>
        <label for="username">Username</label>
        <input id="username" name="username" required value="<?= e((string) ($_POST['username'] ?? '')) ?>">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" required>
        <button type="submit">Log In</button>
    </form>
</body>
</html>
