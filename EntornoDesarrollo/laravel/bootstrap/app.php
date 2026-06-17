<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 🚀 1. AGREGAR ESTA LÍNEA: Activa las cabeceras CORS automáticas de Laravel
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        // 2. Exceptuar la ruta de login de la verificación CSRF
        $middleware->validateCsrfTokens(except: [
            'login',
            'api/login',
            'api/usuarios'
        ]);

        // 3. Mantener la configuración de los proxies para Cloud Run
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
