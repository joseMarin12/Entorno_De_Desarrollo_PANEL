<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\AutenticadorController;

Artisan::call('route:clear');
Artisan::call('config:clear');

Route::post('/login', [AutenticadorController::class, 'login']);

Route::get('/', function () {
    return view('welcome');
});
