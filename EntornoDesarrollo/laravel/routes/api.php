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
use App\Http\Controllers\DocumentoController; 
use App\Http\Middleware\VerifyApiToken;

// =========================================================================
// RUTA DE AUTENTICACIÓN (LOGIN)
// =========================================================================
// URL final en Angular: ${environment.apiUrl}/api/login
Route::post('/login', [AutenticadorController::class, 'login']);

// =========================================================================
// RUTAS LIBRES (Módulos de n8n / Gestión pública)
// =========================================================================
// SELECCIONADORES
Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);
Route::post('/gestion-seleccionadores', [SeleccionadorController::class, 'proxy']);

// USUARIOS
Route::post('/usuarios', [UsuariosController::class, 'proxy']);
Route::post('/gestion-usuarios', [UsuariosController::class, 'proxy']);

// =========================================================================
// RUTAS PROTEGIDAS (Verificación por Token Middleware)
// =========================================================================
Route::middleware([VerifyApiToken::class])->group(function () {
    
    Route::post('/comerciales', [ComercialController::class, 'proxy']);
    Route::post('/formaciones', [FormacionController::class, 'proxy']);
    Route::post('/empresas', [EmpresaController::class, 'proxy']);
    Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
    Route::post('/asignaciones', [AsignacionController::class, 'proxy']);
    Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);
    
    // Gestión de Documentos y Firmas
    Route::post('/documentos', [DocumentoController::class, 'proxy']);
});
