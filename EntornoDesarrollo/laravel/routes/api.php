<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ComercialController;
use App\Http\Controllers\SeleccionadorController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\FormacionController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\DireccionesEmpresaController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\AutenticadorController;

// =========================================================================
// INTERCEPTOR FORZADO DE PREFLIGHT (OPTIONS) PARA INFRAESTRUCTURA CLOUD RUN
// =========================================================================
// Este bloque intercepta el OPTIONS al vuelo en caso de que Nginx ignore el ruteador clásico
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://panel-frontend-1079064952465.us-central1.run.app');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization, Accept, Origin, X-Token-Auth');
    header('Access-Control-Allow-Credentials: true');
    header('HTTP/1.1 200 OK');
    exit(0);
}

// 1. CAPTURA DE PREFLIGHT ESTÁNDAR DE LARAVEL (Respaldo)
Route::options('{any}', function () {
    return response()->json([], 200)
        ->header('Access-Control-Allow-Origin', 'https://panel-frontend-1079064952465.us-central1.run.app')
        ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE')
        ->header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization, Accept, Origin, X-Token-Auth')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

Route::post('/login', [AutenticadorController::class, 'login']);

// =========================================================================
// RUTAS LIBRES SOPORTANDO POST Y OPTIONS PARA CORS (Módulos de n8n)
// =========================================================================

// SELECCIONADORES (Acepta POST y OPTIONS de manera explícita)
Route::match(['post', 'options'], '/seleccionadores', [SeleccionadorController::class, 'proxy']);
Route::match(['post', 'options'], '/gestion-seleccionadores', [SeleccionadorController::class, 'proxy']);

// USUARIOS (Acepta POST y OPTIONS de manera explícita)
Route::match(['post', 'options'], '/usuarios', [UsuariosController::class, 'proxy']);
Route::match(['post', 'options'], '/gestion-usuarios', [UsuariosController::class, 'proxy']);


// =========================================================================
// RUTAS PROTEGIDAS (Para el resto de módulos con JWT viejo)
// =========================================================================
Route::middleware('verify.token')->group(function () {
    
    Route::post('/comerciales', [ComercialController::class, 'proxy']);
    Route::post('/formaciones', [FormacionController::class, 'proxy']);
    Route::post('/empresas', [EmpresaController::class, 'proxy']);
    Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
    Route::post('/asignaciones', [AsignacionController::class, 'proxy']);
    Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);

});
