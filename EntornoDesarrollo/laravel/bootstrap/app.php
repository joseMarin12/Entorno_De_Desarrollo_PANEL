<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    // 🚀 RESTAURADO: Registra los archivos de rutas para que Laravel reconozca tus endpoints
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 1. Exceptuar rutas de la verificación CSRF (Seguridad para peticiones externas)
        $middleware->validateCsrfTokens(except: [
            'login',
            'api/login',
            'api/usuarios' // Añadido por si tu CRUD de usuarios también recibe POST directo
        ]);

        // 2. Mantener la configuración de los proxies (Evita el error 405 en Google Cloud Run)
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
