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
// RUTA DE AUTENTICACIÓN (LOGIN)
// =========================================================================
Route::post('/login', [AutenticadorController::class, 'login']);

// =========================================================================
// RUTAS LIBRES (Módulos de n8n)
// =========================================================================

// SELECCIONADORES
Route::match(['post', 'options'], '/seleccionadores', [SeleccionadorController::class, 'proxy']);
Route::match(['post', 'options'], '/gestion-seleccionadores', [SeleccionadorController::class, 'proxy']);

// USUARIOS
Route::match(['post', 'options'], '/usuarios', [UsuariosController::class, 'proxy']);
Route::match(['post', 'options'], '/gestion-usuarios', [UsuariosController::class, 'proxy']);

// =========================================================================
// RUTAS PROTEGIDAS (Verificación por Token Middleware)
// =========================================================================
Route::middleware('verify.token')->group(function () {
    
    Route::post('/comerciales', [ComercialController::class, 'proxy']);
    Route::post('/formaciones', [FormacionController::class, 'proxy']);
    Route::post('/empresas', [EmpresaController::class, 'proxy']);
    Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
    Route::post('/asignaciones', [AsignacionController::class, 'proxy']);
    Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);

});
