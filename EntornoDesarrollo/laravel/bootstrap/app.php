<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
   ->withMiddleware(function (Middleware $middleware) {
    
    // 1. Exceptuar la ruta de login de la verificación CSRF
    $middleware->validateCsrfTokens(except: [
        'login', // Si tu ruta es /login
        'api/login' // Ponlo así también si llegas a usar el prefijo api
    ]);

    // 2. Mantener la configuración de los proxies (la que arregló el 405)
    $middleware->trustProxies(at: '*');
})
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
