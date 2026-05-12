<?php

use App\Http\Controllers\ComercialController;
use App\Http\Controllers\SeleccionadorController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\FormacionController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\DireccionesEmpresaController;
use Illuminate\Support\Facades\Route;

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


Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);

Route::post('/usuarios', [UsuariosController::class, 'proxy']);
Route::post('/formaciones', [FormacionController::class, 'proxy']);
Route::post('/empresas', [EmpresaController::class, 'proxy']);
Route::post('/direcciones-empresas', [DireccionesEmpresaController::class, 'proxy']);
Route::post('/asignaciones', [\App\Http\Controllers\AsignacionController::class, 'proxy']);
Route::post('/trabajadores', [TrabajadorController::class, 'proxy']);

