<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Artisan; // 🚀 IMPORTANTE: Para ejecutar comandos internos

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
        // 🚀 FORZAR HTTPS: Resuelve el problema de redirecciones que mutaban POST a GET
        URL::forceScheme('https');

        // 🚀 LIMPIADOR DE CACHÉ AUTOMÁTICO PARA CLOUD RUN:
        // Cada vez que el contenedor despierte o se actualice, borrará la caché interna de rutas.
        // Esto soluciona de raíz el error 404 de URLs que sí existen en el archivo de rutas.
        if (config('app.env') === 'production' || env('CLEAR_CACHE_ON_BOOT', true)) {
            try {
                Artisan::call('route:clear');
                Artisan::call('config:clear');
            } catch (\Exception $e) {
                // Evita que falle el arranque si hay un problema menor con los permisos de consola
            }
        }
    }
}
