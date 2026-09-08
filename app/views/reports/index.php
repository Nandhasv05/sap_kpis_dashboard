<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 26/08/2026
// DESCRIPTION : Reports index view for the reports
/**
 * Reports hub
 */
?>
<section class="hero">
    <h2>Ops Reports</h2>
</section>

<!-- DASHBOARD CARDS -->
<div class="dash-cards">
    <?php foreach ($cards as $card): ?>
    <a class="dash-card" href="<?= e(url($card['slug'])) ?>" style="--card-color: <?= e($card['primary']) ?>">
        <div class="icon-wrap" style="background: <?= e($card['primary']) ?>">
            <span class="material-icons-round"><?= e($card['icon']) ?></span>
        </div>
        <h3><?= e($card['title']) ?></h3>
        <p><?= e($card['subtitle']) ?></p>
        <span class="cta">
            Open report
            <span class="material-icons-round" style="font-size:1rem">arrow_forward</span>
        </span>
    </a>
    <?php endforeach; ?>
</div>
?>