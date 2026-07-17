<?php
declare(strict_types=1);

require dirname(__DIR__) . '/app/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Metoden tillåts inte.');
}

function return_with_error(string $message): never
{
    $_SESSION['form_error'] = $message;
    header('Location: /om-lots/kontakt/?fel=1', true, 303);
    exit;
}

$token = (string)($_POST['csrf_token'] ?? '');
if ($token === '' || !hash_equals((string)($_SESSION['csrf_token'] ?? ''), $token)) {
    return_with_error('Formuläret hann gå ut. Ladda om sidan och försök igen.');
}

if (trim((string)($_POST['website'] ?? '')) !== '') {
    header('Location: /tack/', true, 303);
    exit;
}

$lastSubmit = (int)($_SESSION['last_contact_submit'] ?? 0);
if ($lastSubmit > time() - 20) {
    return_with_error('Vänta en kort stund innan du skickar igen.');
}

$name = trim((string)($_POST['name'] ?? ''));
$organisation = trim((string)($_POST['organisation'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$subject = trim((string)($_POST['subject'] ?? 'Förfrågan från webbplatsen'));
$message = trim((string)($_POST['message'] ?? ''));
$consent = (string)($_POST['consent'] ?? '') === '1';

if ($name === '' || mb_strlen($name) > 120) return_with_error('Kontrollera namnet.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 180) return_with_error('Kontrollera e-postadressen.');
if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) return_with_error('Meddelandet behöver vara mellan 10 och 5 000 tecken.');
if (!$consent) return_with_error('Godkänn behandlingen av uppgifterna för att skicka formuläret.');

$clean = static fn(string $value): string => str_replace(["\r", "\n", "\0"], ' ', $value);
$mailSubject = 'Webbförfrågan: ' . mb_substr($clean($subject), 0, 140);
$body = "Ny förfrågan från lotsab.se\n\n"
    . "Namn: {$name}\nOrganisation: {$organisation}\nE-post: {$email}\nTelefon: {$phone}\nÄrende: {$subject}\n\nMeddelande:\n{$message}\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: LOTS webbplats <' . $clean((string)config('from_email')) . '>',
    'Reply-To: ' . $clean($email),
    'X-Mailer: LOTS-Custom-Site'
];

$sent = mail((string)config('contact_email'), $mailSubject, $body, implode("\r\n", $headers));
$_SESSION['last_contact_submit'] = time();
unset($_SESSION['csrf_token']);

if (!$sent) {
    if ((bool)config('log_failed_mail', true)) {
        $record = date('c') . "\t" . $clean($email) . "\t" . $clean($subject) . "\n";
        @file_put_contents(dirname(__DIR__) . '/app/storage/contact-errors.log', $record, FILE_APPEND | LOCK_EX);
    }
    return_with_error('Meddelandet kunde inte skickas. Ring 08-711 22 11 eller mejla info@lotsab.se.');
}

header('Location: /tack/', true, 303);
exit;
