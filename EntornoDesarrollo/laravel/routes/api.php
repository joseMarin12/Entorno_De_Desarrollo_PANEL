<?php

use App\Http\Controllers\ComercialController;
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
Route::apiResource('formaciones', FormacionController::class);