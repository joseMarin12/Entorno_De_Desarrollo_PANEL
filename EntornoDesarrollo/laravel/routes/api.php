<?php

use App\Http\Controllers\ComercialController;
use App\Http\Controllers\SeleccionadorController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\FormacionController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\DocumentoFirmaController;
use Illuminate\Support\Facades\Route;

Route::post('/comerciales', [ComercialController::class, 'proxy']);
Route::post('/documentos-firma/solicitar-firma-proxy', [DocumentoFirmaController::class, 'solicitarFirmaProxy']);

/*
|--------------------------------------------------------------------------
| API Routes - Seleccionadores
|--------------------------------------------------------------------------
| Laravel actúa como proxy: reenvía la petición a n8n.
*/
Route::post('/seleccionadores', [SeleccionadorController::class, 'proxy']);

Route::post('/usuarios', [UsuariosController::class, 'proxy']);
Route::post('/formaciones', [FormacionController::class, 'proxy']);
Route::post('/empresas', [EmpresaController::class, 'proxy']);
Route::post('/asignaciones', [\App\Http\Controllers\AsignacionController::class, 'proxy']);
