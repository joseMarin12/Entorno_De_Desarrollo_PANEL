<?php

// --- FILTRO CORS RESTRINGIDO EN INFRAESTRUCTURA ---
$allowedOrigin = 'https://panel-frontend-1079064952465.us-central1.run.app';

if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowedOrigin) {
    
    // Si coincide el origen del frontend, inyectamos los encabezados seguros
    header("Access-Control-Allow-Origin: $allowedOrigin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");

    // Si es un Preflight (OPTIONS), respondemos de inmediato y matamos el proceso
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header("HTTP/1.1 204 No Content");
        exit(0);
    }
}
// --------------------------------------------------


/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * @package  Laravel
 * @author   Taylor Otwell <taylor@laravel.com>
 */

define('LARAVEL_START', microtime(true));

// Registrar el cargador automático de Composer
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

// Arrancar Laravel y procesar la petición
$app = require_once __DIR__.'/../bootstrap/app.php';

if (method_exists($app, 'handleRequest')) {
    // Estructura moderna (Laravel 11+)
    $app->handleRequest(Illuminate\Http\Request::capture());
} else {
    // Estructura tradicional (Laravel 9/10)
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle(
        $request = Illuminate\Http\Request::capture()
    )->send();
    $kernel->terminate($request, $response);
}
