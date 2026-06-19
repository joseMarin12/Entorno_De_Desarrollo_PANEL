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

// 1. MANEJO GLOBAL DE CORS PARA PETICIONES OPTIONS (PREFLIGHT)
Route::options('{any}', function () {
    return response()->json([], 200)
        ->header('Access-Control-Allow-Origin', 'https://panel-frontend-1079064952465.us-central1.run.app')
        ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE')
        ->header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization, Accept, Origin');
})->where('any', '.*');

Route::post('/login', [AutenticadorController::class, 'login']);

// =========================================================================
// RUTAS LIBRES (Módulos conectados a n8n)
// =========================================================================

// SELECCIONADORES
Route::post('/seleccionadores{slash?}', [SeleccionadorController::class, 'proxy'])->where('slash', '/?');
Route::post('/gestion-seleccionadores{slash?}', [SeleccionadorController::class, 'proxy'])->where('slash', '/?');

// USUARIOS
Route::post('/usuarios{slash?}', [UsuariosController::class, 'proxy'])->where('slash', '/?');
Route::post('/gestion-usuarios{slash?}', [UsuariosController::class, 'proxy'])->where('slash', '/?');


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
