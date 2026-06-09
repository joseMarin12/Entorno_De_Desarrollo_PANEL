<?php

use App\Http\Controllers\ComercialController;
use App\Http\Controllers\SeleccionadorController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\FormacionController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\DireccionesEmpresaController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\AutenticadorController;
use Illuminate\Support\Facades\Route;

// Manejo de peticiones OPTIONS (CORS preflight) - DEBE IR PRIMERO
Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

Route::prefix('api')->group(function () {
    
    /*
    |--------------------------------------------------------------------------
    | Auth Routes (Sin protección)
    |--------------------------------------------------------------------------
    */
    Route::post('/login', [AutenticadorController::class, 'login']);
    
    /*
    |--------------------------------------------------------------------------
    | Protected Routes (Con verify.token)
    |--------------------------------------------------------------------------
    */
    Route::middleware('verify.token')->group(function () {
        Route::post('/comerciales', [ComercialController::class, 'proxy']);
        Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);
        Route::post('/usuarios', [UsuariosController::class, 'proxy']);
        Route::post('/formaciones', [FormacionController::class, 'proxy']);
        Route::post('/empresas', [EmpresaController::class, 'proxy']);
        Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
        Route::post('/asignaciones', [AsignacionController::class, 'proxy']);
        Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);
    });
});
