<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 🔥 INTERCEPTOR BULLETPROOF DE CORS Y OPTIONS PARA CLOUD RUN
        $middleware->prepend(function (Request $request, $next) {
            $origin = $request->header('Origin');
            
            // Si la petición es un Preflight (OPTIONS), respondemos inmediatamente con 200
            if ($request->isMethod('OPTIONS')) {
                return response('', 200)
                    ->header('Access-Control-Allow-Origin', $origin ?? 'https://panel-frontend-1079064952465.us-central1.run.app')
                    ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, X-Token-Auth')
                    ->header('Access-Control-Allow-Credentials', 'true');
            }

            // Procesamos la petición normal (POST, GET, etc.)
            $response = $next($request);
            
            // Inyectamos las cabeceras a la salida para asegurar que el navegador la acepte
            if ($origin) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
                $response->headers->set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, X-Token-Auth');
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            }
            
            return $response;
        });

        // Control de redirección para la API (Evita respuestas HTML erróneas)
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
