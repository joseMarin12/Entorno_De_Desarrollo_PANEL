<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\VerifyToken; // 🌟 Importamos tu middleware personalizado

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 🌟 REGISTRO DE ALIAS: Aquí enlazamos el nombre 'verify.token' con su clase real
        $middleware->alias([
            'verify.token' => VerifyToken::class,
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
