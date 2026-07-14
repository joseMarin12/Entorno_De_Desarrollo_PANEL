<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// 🚀 RUTA DE EMERGENCIA: Borra la caché interna congelada en Google Cloud Run
Route::get('/fuerza-limpieza', function() {
    \Illuminate\Support\Facades\Artisan::call('route:clear');
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
    return "🚀 Servidor Laravel limpiado de raíz. Intenta el login ahora.";
});
