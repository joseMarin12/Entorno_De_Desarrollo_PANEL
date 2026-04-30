<?php

use App\Http\Controllers\ComercialController;
use App\Http\Controllers\SeleccionadorController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\FormacionController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\AutenticadorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Auth
|--------------------------------------------------------------------------
*/
Route::post('/login', [AutenticadorController::class, 'login']);

/*
|--------------------------------------------------------------------------
| API Routes - Protegidas con verify.token
|--------------------------------------------------------------------------
*/
Route::middleware('verify.token')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | API Routes - Comerciales
    |--------------------------------------------------------------------------
    | Laravel actúa como proxy: recibe la petición de Angular y la reenvía
    | al webhook de n8n que gestiona el CRUD contra PostgreSQL.
    |
    | Endpoint único:
    |   POST /api/comerciales
    |   Body: { action: string, ...datos }
    |
    | Acciones soportadas (las maneja n8n):
    |   - getComerciales
    |   - createComercial
    |   - updateComercial
    |   - toggleComercialStatus
    */
    Route::post('/comerciales', [ComercialController::class, 'proxy']);

    /*
    |--------------------------------------------------------------------------
    | API Routes - Seleccionadores
    |--------------------------------------------------------------------------
    | Laravel actúa como proxy: reenvía la petición a n8n.
    */
    Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);

    /*
    |--------------------------------------------------------------------------
    | API Routes - Usuarios
    |--------------------------------------------------------------------------
    */
    Route::post('/usuarios', [UsuariosController::class, 'proxy']);

    /*
    |--------------------------------------------------------------------------
    | API Routes - Formaciones
    |--------------------------------------------------------------------------
    */
    Route::post('/formaciones', [FormacionController::class, 'proxy']);

    /*
    |--------------------------------------------------------------------------
    | API Routes - Empresas
    |--------------------------------------------------------------------------
    */
    Route::post('/empresas', [EmpresaController::class, 'proxy']);

    /*
    |--------------------------------------------------------------------------
    | API Routes - Asignaciones
    |--------------------------------------------------------------------------
    */
    Route::post('/asignaciones', [\App\Http\Controllers\AsignacionController::class, 'proxy']);
});
