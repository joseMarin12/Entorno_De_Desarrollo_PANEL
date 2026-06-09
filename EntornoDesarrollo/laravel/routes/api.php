<?php

use App\Http\Controllers\ComercialController;
// ... (resto de tus imports)
use Illuminate\Support\Facades\Route;

// 1. AÑADE ESTO: Manejo explícito de peticiones OPTIONS para evitar el 405
Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

/*
|--------------------------------------------------------------------------
| API Routes - Auth
|--------------------------------------------------------------------------
*/
Route::prefix('api')->group(function () {
    Route::post('/login', [AutenticadorController::class, 'login']);
    // ... resto de rutas
});
/*
|--------------------------------------------------------------------------
| API Routes - Protegidas con verify.token
|--------------------------------------------------------------------------
*/
Route::middleware('verify.token')->group(function () {
    Route::post('/comerciales', [ComercialController::class, 'proxy']);
    Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);
    Route::post('/usuarios', [UsuariosController::class, 'proxy']);
    Route::post('/formaciones', [FormacionController::class, 'proxy']);
    Route::post('/empresas', [EmpresaController::class, 'proxy']);
    Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
    Route::post('/asignaciones', [\App\Http\Controllers\AsignacionController::class, 'proxy']);
    Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);
});
