<?php

return [

    // CORRECCIÓN 1: Forzamos a Laravel a escuchar 'formaciones' fuera y dentro de api/*
    'paths' => [
        'api/*', 
        'formaciones/*', 
        'formaciones', 
        'sanctum/csrf-cookie'
    ],

    'allowed_methods' => ['*'],

    // CORRECCIÓN 2: Añadimos localhost para que te permita hacer pruebas de desarrollo
    'allowed_origins' => [
        'https://panel-frontend-1079064952465.us-central1.run.app',
        'http://localhost:4200',  // Angular Local
        'http://localhost:8000',  // Laravel Local si aplica
        'http://localhost',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
