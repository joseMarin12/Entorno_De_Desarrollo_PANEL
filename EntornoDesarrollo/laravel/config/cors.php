<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // 🚀 Usamos '*' para aplicar CORS a TODAS las rutas de Laravel
    'paths' => ['*'],

    'allowed_methods' => ['*'],

    // Mantenemos tus orígenes permitidos explícitos
    'allowed_origins' => [
        'https://panel-frontend-1079064952465.us-central1.run.app',
        'http://localhost:4200',  // Angular Local
        'http://localhost:8000',  // Laravel Local
        'http://localhost',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
