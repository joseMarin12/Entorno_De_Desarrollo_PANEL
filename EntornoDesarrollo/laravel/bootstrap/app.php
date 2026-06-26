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
        
        // 🚀 REGLA CLOUD RUN: Confiar en los proxies de Google
        $middleware->trustProxies(at: '*');

        // 🚀 BLINDAJE API: Obligar a responder en JSON para interceptar redirecciones de validación
        $middleware->prependToGroup('api', function ($request, $next) {
            $request->headers->set('Accept', 'application/json');
            return $next($request);
        });

        // 🚀 CONFIGURACIÓN DE CORS EN LARAVEL 11+:
        // Le permite explícitamente a tu subdominio de Angular leer las respuestas de la API
        $middleware->validateCsrfTokens(except: [
            'api/*', // Desactivar CSRF para las rutas de la API, ya que usas tokens de seguridad
        ]);

        // Inyectamos las cabeceras CORS de forma global para el dominio frontend
        $middleware->web(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // 🌟 Alias único para el middleware de seguridad de tus rutas protegidas
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
