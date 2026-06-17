<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AutenticadorController;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/login', [AutenticadorController::class, 'login']);
