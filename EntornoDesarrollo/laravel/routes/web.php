<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\AutenticadorController;

// 🧹 LÍNEAS DE EMERGENCIA: Fuerzan a Cloud Run a borrar la caché vieja en cuanto lee este archivo
Artisan::call('route:clear');
Artisan::call('config:clear');

// 🚀 LA RUTA QUE BUSCA ANGULAR: Responde directamente a /login
Route::post('/login', [AutenticadorController::class, 'login']);

// Tu ruta raíz por defecto (puedes dejarla como esté)
Route::get('/', function () {
    return view('welcome');
});
