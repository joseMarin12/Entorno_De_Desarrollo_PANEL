<?php

use App\Http\Controllers\FormacionController;
use Illuminate\Support\Facades\Route;

Route::post('/formaciones', [FormacionController::class, 'proxy']);