<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\VerifyApiToken;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 🚀 1. CONFIANZA DE PROXY PARA CLOUD RUN
        // Esto le dice a Laravel que estás detrás del balanceador de Google 
        // y evita que tus peticiones POST muten a GET.
        $middleware->trustProxies(at: '*');

        // 🌟 2. ALIAS DE TU MIDDLEWARE EXISTENTE
        // Registramos el middleware que ya tienes creado para proteger tus rutas.
        $middleware->alias([
            'verify.token' => VerifyApiToken::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
