<?php
$pageTitle = (string)($route['title'] ?? config('site_name'));
$description = (string)($route['description'] ?? 'Personlarm och säker kommunikation från LOTS Security AB.');
$canonical = rtrim((string)config('site_url'), '/') . ($path ?? '/');
$isHome = ($path ?? '') === '/';
?>
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#123846">
  <meta name="description" content="<?= e($description) ?>">
  <link rel="canonical" href="<?= e($canonical) ?>">
  <link rel="icon" href="/wp-content/uploads/2013/04/LOTS_favicon_2008.png" type="image/png">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:type" content="website">
  <meta property="og:title" content="<?= e($isHome ? $pageTitle : $pageTitle . ' – ' . config('site_name')) ?>">
  <meta property="og:description" content="<?= e($description) ?>">
  <meta property="og:url" content="<?= e($canonical) ?>">
  <title><?= e($isHome ? $pageTitle : $pageTitle . ' – ' . config('site_name')) ?></title>
  <link rel="stylesheet" href="/assets/css/site.css?v=3.0">
  <script defer src="/assets/js/site.js?v=3.0"></script>
</head>
<body class="template-<?= e((string)($route['template'] ?? 'item')) ?>">
  <a class="skip-link" href="#main">Hoppa till innehållet</a>
  <header class="site-header" data-header>
    <div class="container header__inner">
      <a class="brand" href="/" aria-label="LOTS Security – startsidan">
        <img src="/wp-content/uploads/LOTS-logo-web_340x156.png" alt="LOTS Security AB" width="170" height="78">
      </a>
      <nav class="desktop-nav" aria-label="Huvudmeny">
        <a<?= route_is_active('/losningar/', $path) ? ' aria-current="page"' : '' ?> href="/losningar/">Lösningar</a>
        <a<?= route_is_active('/produktkatalog/', $path) ? ' aria-current="page"' : '' ?> href="/produktkatalog/">Produkter</a>
        <a<?= route_is_active('/nyheter/', $path) ? ' aria-current="page"' : '' ?> href="/nyheter/">Kunskap</a>
        <a<?= route_is_active('/support-2/', $path) ? ' aria-current="page"' : '' ?> href="/support-2/">Support</a>
        <a<?= route_is_active('/om-lots/', $path) ? ' aria-current="page"' : '' ?> href="/om-lots/">Om LOTS</a>
      </nav>
      <a class="button button--primary header__contact" href="/om-lots/kontakt/">Kontakt</a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-navigation" data-menu-button>
        <span>Meny</span><i aria-hidden="true"></i>
      </button>
    </div>
    <nav class="mobile-nav" id="mobile-navigation" aria-label="Mobilmeny" data-mobile-nav hidden>
      <a href="/losningar/">Lösningar</a><a href="/produktkatalog/">Produkter</a><a href="/nyheter/">Kunskap</a><a href="/support-2/">Support</a><a href="/om-lots/">Om LOTS</a><a href="/om-lots/kontakt/">Kontakt</a>
      <a class="mobile-nav__phone" href="tel:+4687112211">Ring 08-711 22 11</a>
    </nav>
  </header>
  <?= $pageContent ?>
  <footer class="site-footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <img src="/wp-content/uploads/LOTS-logo-web_340x156.png" alt="LOTS Security AB" width="150" height="69" loading="lazy">
        <p>Personlarm och säker kommunikation för verksamheter i hela Sverige.</p>
      </div>
      <nav aria-label="Lösningar"><h2>Lösningar</h2><a href="/personlarm/">Personlarm</a><a href="/vard-och-omsorg/">Vård och omsorg</a><a href="/ekotekfamiljen/">Ensamarbete</a><a href="/nodlarm-for-bad-och-simhallar/">Bad och simhall</a></nav>
      <nav aria-label="Genvägar"><h2>Genvägar</h2><a href="/produktkatalog/">Produkter</a><a href="/nyheter/">Nyheter</a><a href="/support-2/">Support</a><a href="/broschyr-samling/">Broschyrer</a></nav>
      <nav aria-label="Kontakt"><h2>Kontakt</h2><a href="tel:+4687112211">08-711 22 11</a><a href="mailto:info@lotsab.se">info@lotsab.se</a><a href="/om-lots/kontakt/">Kontaktformulär</a><a href="/om-lots/">Om LOTS</a></nav>
    </div>
    <div class="container footer__bottom"><span>© <?= date('Y') ?> LOTS Security AB</span><a href="/integritetspolicy/">Integritetspolicy</a></div>
  </footer>
</body>
</html>
