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


// 🧪 ⚡ PRUEBA DE FUEGO DIAGNÓSTICO (FRENO DE MANO) ⚡ 🧪
// Si la petición es un POST (como tu login), la matamos AQUÍ MISMO para ver si el servidor responde algo.
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'interceptado_ok',
        'mensaje' => '¡Freno de mano activado! El servidor recibe el POST perfectamente en index.php',
        'origen' => $_SERVER['HTTP_ORIGIN'] ?? 'No detectado',
        'uri_solicitada' => $_SERVER['REQUEST_URI'] ?? 'No detectada'
    ]);
    exit(0);
}
// ----------------------------------------------------------------------


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
