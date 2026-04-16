<?php

use App\Http\Controllers\ComercialController;
use App\Http\Controllers\SeleccionadorController;
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

/*
|--------------------------------------------------------------------------
| API Routes - Seleccionadores
|--------------------------------------------------------------------------
| Laravel actúa como proxy: reenvía la petición a n8n.
*/
Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);

