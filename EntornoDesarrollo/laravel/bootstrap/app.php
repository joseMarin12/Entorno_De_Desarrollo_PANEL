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
        
        // El middleware de CORS ya se ejecuta nativa y automáticamente en Laravel 11.
        // Hemos removido la línea rota de Fruitcake aquí.
        
        // API Stateful
        $middleware->statefulApi();
        
        // Alias de middleware
        $middleware->alias([
            'verify.token' => \App\Http\Middleware\VerifyApiToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
