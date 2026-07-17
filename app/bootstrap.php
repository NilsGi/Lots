<?php
declare(strict_types=1);

const SITE_ROOT = __DIR__ . '/..';

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    $configFile = __DIR__ . '/config.example.php';
}
$GLOBALS['site_config'] = require $configFile;

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');
header("Permissions-Policy: geolocation=(), camera=(), microphone=()");

function config(string $key, mixed $fallback = null): mixed
{
    return $GLOBALS['site_config'][$key] ?? $fallback;
}

function e(string|null $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function request_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = '/' . trim(rawurldecode($path), '/');
    return $path === '/' ? '/' : $path . '/';
}

function site_routes(): array
{
    static $routes;
    if ($routes === null) {
        $json = file_get_contents(__DIR__ . '/data/routes.json');
        $routes = is_string($json) ? (json_decode($json, true) ?: []) : [];
    }
    return $routes;
}

function site_index(): array
{
    static $items;
    if ($items === null) {
        $json = file_get_contents(SITE_ROOT . '/assets/data/search-index.json');
        $data = is_string($json) ? (json_decode($json, true) ?: []) : [];
        $items = $data['items'] ?? [];
    }
    return $items;
}

function sorted_items(array $items, string $type, string $sort): array
{
    $filtered = array_values(array_filter($items, static fn(array $item): bool => ($item['type'] ?? '') === $type));
    usort($filtered, static function (array $a, array $b) use ($sort): int {
        if ($sort === 'date') {
            return strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? ''));
        }
        return strcasecmp((string)($a['title'] ?? ''), (string)($b['title'] ?? ''));
    });
    return $filtered;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(24));
    }
    return (string)$_SESSION['csrf_token'];
}

function route_is_active(string $target, string $current): bool
{
    if ($target === '/') return $current === '/';
    return str_starts_with($current, $target);
}

function render_page(string $template, array $data): never
{
    $allowed = ['home', 'item', 'archive', 'contact', 'newsletter', 'solutions', 'thanks', 'account', 'not-found'];
    if (!in_array($template, $allowed, true)) $template = 'item';
    extract($data, EXTR_SKIP);
    ob_start();
    require __DIR__ . '/views/' . $template . '.php';
    $pageContent = (string)ob_get_clean();
    require __DIR__ . '/views/layout.php';
    exit;
}

function content_fragment(array $route): string
{
    $file = basename((string)($route['contentFile'] ?? ''));
    if ($file === '') return '';
    $path = __DIR__ . '/content/' . $file;
    return is_file($path) ? (string)file_get_contents($path) : '';
}

function item_card(array $item): string
{
    $image = !empty($item['image'])
        ? '<div class="card__image"><img src="' . e((string)$item['image']) . '" alt="" loading="lazy"></div>'
        : '<div class="card__image card__image--empty"><span>LOTS</span></div>';
    $date = !empty($item['dateFormatted']) ? '<time>' . e((string)$item['dateFormatted']) . '</time>' : '';
    return '<a class="card" href="' . e((string)$item['path']) . '">' . $image
        . '<div class="card__body"><div class="card__meta"><span>' . e((string)($item['category'] ?? $item['typeLabel'] ?? 'LOTS')) . '</span>' . $date . '</div>'
        . '<h2>' . e((string)$item['title']) . '</h2><p>' . e((string)$item['excerpt']) . '</p><strong>Läs mer <span aria-hidden="true">→</span></strong></div></a>';
}
