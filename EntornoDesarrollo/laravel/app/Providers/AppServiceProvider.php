<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL; // 🚀 Importamos el Facade de URLs para el forzado de esquema

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 🚀 BLOQUEO DE SEGURIDAD: Forzar a Laravel a operar internamente bajo HTTPS.
        // Resuelve los problemas de redirección proxy y mutaciones de POST a GET.
        URL::forceScheme('https');
    }
}
