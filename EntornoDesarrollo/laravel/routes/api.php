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
use App\Http\Controllers\DocumentoController; // 🚀 EL FIX: Importamos el nuevo controlador de documentos
use App\Http\Middleware\VerifyApiToken;

// =========================================================================
// RUTA DE AUTENTICACIÓN (LOGIN)
// =========================================================================
// ⚠️ IMPORTANTE: En tu servicio de Angular, la URL debe ser obligatoriamente:
// ${environment.apiUrl}/api/login
Route::post('/login', [AutenticadorController::class, 'login']);

// =========================================================================
// RUTAS LIBRES (Módulos de n8n)
// =========================================================================
// ⚠️ IMPORTANTE: En Angular las debes llamar como /api/seleccionadores y /api/usuarios

// SELECCIONADORES
Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);
Route::post('/gestion-seleccionadores', [SeleccionadorController::class, 'proxy']);

// USUARIOS (Registro / Gestión libre)
Route::post('/usuarios', [UsuariosController::class, 'proxy']);
Route::post('/gestion-usuarios', [UsuariosController::class, 'proxy']);

// =========================================================================
// RUTAS PROTEGIDAS (Verificación por Token Middleware)
// =========================================================================
// 🚀 EL FIX: Cambiamos 'verify.token' por [VerifyApiToken::class] para asegurar que Laravel lo reconozca siempre
Route::middleware([VerifyApiToken::class])->group(function () {
    
    Route::post('/comerciales', [ComercialController::class, 'proxy']);
    Route::post('/formaciones', [FormacionController::class, 'proxy']);
    Route::post('/empresas', [EmpresaController::class, 'proxy']);
    Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
    Route::post('/asignaciones', [AsignacionController::class, 'proxy']);
    Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);
    
    // 🚀 NUEVA RUTA PROTEGIDA: Gestión de Documentos y Firmas
    Route::post('/documentos', [DocumentoController::class, 'proxy']);

});
