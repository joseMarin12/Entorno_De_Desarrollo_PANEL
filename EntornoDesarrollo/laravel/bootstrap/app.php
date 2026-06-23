<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\VerifyApiToken; // 🌟 Importamos la clase con su nombre real

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 🌟 Apuntamos el alias 'verify.token' a la clase VerifyApiToken
        $middleware->alias([
            'verify.token' => VerifyApiToken::class,
        ]);

        // Control de redirección estándar para invitados en la API
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*')) {
                return null; 
            }
            return '/login';
        });

    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
