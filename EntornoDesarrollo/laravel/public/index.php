<?php

// 🌟 INTERCEPTOR GLOBAL DE EMERGENCIA PARA CORS (OPTIONS / PREFLIGHT)
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://panel-frontend-1079064952465.us-central1.run.app');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, Origin, X-Token-Auth');
    header('Access-Control-Allow-Credentials: true');
    header('HTTP/1.1 200 OK');
    exit(0);
}

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determinar si la aplicación está en mantenimiento...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Registrar el autocargador de Composer...
require __DIR__.'/../vendor/autoload.php';

// Arrancar Laravel y procesar la petición...
$app = require_once __DIR__.'/../bootstrap/app.php';

if (method_exists($app, 'handleRequest')) {
    $app->handleRequest(Request::capture());
} else {
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle($request = Request::capture())->send();
    $kernel->terminate($request, $response);
}
