<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
        ->withMiddleware(function (Middleware $middleware): void {
            // Permitir peticiones desde Angular (CORS)
            $middleware->append(\Fruitcake\Cors\HandleCors::class);
            
            // Configuración de CORS
            $middleware->statefulApi();
            
            // Registrar alias para el middleware de verificación de token
            $middleware->alias([
                'verify.token' => \App\Http\Middleware\VerifyApiToken::class,
            ]);
        })
