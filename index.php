<?php
declare(strict_types=1);

require __DIR__ . '/app/bootstrap.php';

$path = request_path();
$routes = site_routes();
$route = $routes[$path] ?? null;

if ($route === null) {
    http_response_code(404);
    $route = [
        'template' => 'not-found',
        'title' => 'Sidan hittades inte',
        'description' => 'Adressen kan vara gammal eller innehållet kan ha flyttats.'
    ];
}

$items = site_index();
$viewData = ['route' => $route, 'path' => $path, 'items' => $items];

if (($route['template'] ?? '') === 'home') {
    $viewData['products'] = array_slice(sorted_items($items, 'product', 'alpha'), 0, 3);
    $viewData['posts'] = array_slice(sorted_items($items, 'post', 'date'), 0, 3);
}

render_page((string)($route['template'] ?? 'item'), $viewData);
