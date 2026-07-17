<?php $isProduct = ($route['type'] ?? '') === 'product'; $content = content_fragment($route); ?>
<main id="main">
  <section class="page-hero<?= $isProduct ? ' page-hero--product' : '' ?>">
    <div class="container page-hero__grid">
      <div><nav class="breadcrumbs" aria-label="Brödsmulor"><a href="/">Start</a><span>/</span><span><?= e((string)($route['category'] ?? 'Innehåll')) ?></span></nav><p class="eyebrow eyebrow--light"><?= e((string)($route['category'] ?? $route['typeLabel'] ?? 'LOTS')) ?></p><h1><?= e((string)$route['title']) ?></h1><?php if (!empty($route['description'])): ?><p class="page-hero__lead"><?= e((string)$route['description']) ?></p><?php endif; ?></div>
      <?php if (!empty($route['image'])): ?><div class="page-hero__image"><img src="<?= e((string)$route['image']) ?>" alt="" loading="eager"></div><?php endif; ?>
    </div>
  </section>
  <section class="content-section"><div class="container content-layout"><article class="content-body"><?= $content !== '' ? $content : '<p>Kontakta LOTS för mer information.</p>' ?></article><aside class="sidebar"><div><h2>Behöver ni hjälp?</h2><p>Vi hjälper er matcha behov, teknik och arbetssätt.</p><a class="button button--primary" href="/om-lots/kontakt/?gäller=<?= rawurlencode((string)$route['title']) ?>">Kontakta LOTS</a></div><?php if ($isProduct): ?><a class="sidebar__link" href="/produktkatalog/">← Till produktkatalogen</a><?php endif; ?></aside></div></section>
</main>
