<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 26/08/2026
// DESCRIPTION : 404 not found page
$message = $message ?? 'The page you are looking for does not exist or has been moved.';
?>
<section class="error-page anim-up">
    <p class="error-code" aria-hidden="true">404</p>
    <h1 class="error-title">Page not found</h1>
    <p class="error-copy"><?= e($message) ?></p>
    <div class="error-actions">
        <a href="<?= e(url()) ?>" class="md-btn md-btn-filled ripple-btn">
            <span class="material-icons-round" style="font-size:1.1rem">home</span>
            Back to Home
        </a>
        <button type="button" class="md-btn md-btn-ghost" onclick="history.back()">Go back</button>
    </div>
</section>
