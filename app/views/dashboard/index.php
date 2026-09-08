<?php
// AUTHOR : NANDHAKUMAR S V
// DATE : 03/09/2026
// DESCRIPTION : Kapis hub — Sales, Material, Planning
?>

<!-- KAPIS DASHBOARD CARDS -->
<div class="dash-cards">
    <?php foreach ($dashboards as $slug => $d): ?>
    <a class="dash-card" href="<?= e(url($slug)) ?>" style="--card-color: <?= e($d['primary']) ?>">
        <div class="icon-wrap" style="background: <?= e($d['primary']) ?>">
            <span class="material-icons-round"><?= e($d['nav_icon']) ?></span>
        </div>
        <h3><?= e($d['title']) ?></h3>
        <p><?= e($d['subtitle'] ?? '') ?></p>
        <span class="cta">
            Open dashboard
            <span class="material-icons-round" style="font-size:1rem">arrow_forward</span>
        </span>
    </a>
    <?php endforeach; ?>
</div>

<!-- QUICK LINKS -->
<div style="margin-top: 1.25rem;">
    <div class="quick-row">
        <a class="quick-btn" href="<?= e(url('sales')) ?>">
            <span class="material-icons-round">point_of_sale</span>
            <span>Sales</span>
        </a>
        <a class="quick-btn" href="<?= e(url('material')) ?>">
            <span class="material-icons-round">texture</span>
            <span>Material</span>
        </a>
        <a class="quick-btn" href="<?= e(url('planning')) ?>">
            <span class="material-icons-round">event_note</span>
            <span>Planning</span>
        </a>
    </div>
</div>
