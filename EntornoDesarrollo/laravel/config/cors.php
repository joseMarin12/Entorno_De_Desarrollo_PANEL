<?php

return [

    // 1. Le decimos que aplique estas reglas a todas las rutas de tu API
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // 2. Permitimos todos los métodos HTTP (POST, GET, OPTIONS, PUT, DELETE)
    'allowed_methods' => ['*'],

    // 3. Agregamos explícitamente la URL de tu frontend en Cloud Run
    'allowed_origins' => [
        'https://panel-frontend-1079064952465.us-central1.run.app',
    ],

    'allowed_origins_patterns' => [],

    // 4. Permitimos que el frontend envíe cabeceras (como el token Authorization o Content-Type)
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // 5. Lo cambiamos a true por si manejas cookies, sesiones o tokens de Sanctum/Passport
    'supports_credentials' => true,
];
