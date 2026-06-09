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
                
                // 🛡️ EXCEPCIÓN CSRF: Permite que Angular le pegue a /login sin el token web
                $middleware->validateCsrfTokens(except: [
                    'login',
                ]);
                
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
