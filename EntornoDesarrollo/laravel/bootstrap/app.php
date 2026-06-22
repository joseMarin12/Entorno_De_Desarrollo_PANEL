<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request; // <-- No olvides importar esto

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // Evita que la API intente redireccionar a una vista web cuando falta el token
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*')) {
                return null; // Al retornar null, Laravel responderá con un JSON 401 limpio
            }
            return '/login'; // Comportamiento normal para la web tradicional
        });

    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
