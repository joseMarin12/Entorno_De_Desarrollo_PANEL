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

// Manejo Global de CORS Options
Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

Route::post('/login', [AutenticadorController::class, 'login']);

// =========================================================================
// RUTAS LIBRES (Delegamos la validación del token al nodo IF de n8n)
// =========================================================================

// SELECCIONADORES (Soporta /seleccionadores, /gestion-seleccionadores con o sin slash final)
Route::post('/seleccionadores{slash?}', [SeleccionadorController::class, 'proxy'])->where('slash', '/?');
Route::post('/gestion-seleccionadores{slash?}', [SeleccionadorController::class, 'proxy'])->where('slash', '/?');

// USUARIOS (Soporta /usuarios, /gestion-usuarios con o sin slash final)
Route::post('/usuarios{slash?}', [UsuariosController::class, 'proxy'])->where('slash', '/?');
Route::post('/gestion-usuarios{slash?}', [UsuariosController::class, 'proxy'])->where('slash', '/?');


// =========================================================================
// RUTAS PROTEGIDAS (Para el resto de módulos que sigan usando el JWT viejo)
// =========================================================================
Route::middleware('verify.token')->group(function () {
    
    Route::post('/comerciales', [ComercialController::class, 'proxy']);
    Route::post('/formaciones', [FormacionController::class, 'proxy']);
    Route::post('/empresas', [EmpresaController::class, 'proxy']);
    Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
    Route::post('/asignaciones', [AsignacionController::class, 'proxy']);
    Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);

});
