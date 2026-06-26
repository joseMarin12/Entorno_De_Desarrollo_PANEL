<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\VerifyApiToken;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 🚀 1. Confiar en proxies de Cloud Run (Mantiene HTTPS y método POST)
        $middleware->trustProxies(at: '*');

        // 🚀 2. Blindaje API: Forzar respuesta JSON siempre
        $middleware->prependToGroup('api', function ($request, $next) {
            $request->headers->set('Accept', 'application/json');
            return $next($request);
        });

        // 🚀 3. Configuración CORS Global para tu Angular
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        // 🚀 4. Desactivar CSRF solo para rutas API
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // 🌟 Alias del middleware de autenticación
        $middleware->alias([
            'verify.token' => VerifyApiToken::class,
        ]);

        // Evitar redirecciones automáticas de Laravel en la API
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
