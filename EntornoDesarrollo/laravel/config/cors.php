<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'], // Agregamos más rutas
    'allowed_methods' => ['*'],
    // Cambia '*' por tu URL específica para mayor seguridad, 
    // pero si quieres probar YA, dejar '*' está bien.
    'allowed_origins' => ['https://panel-frontend-1079064952465.us-central1.run.app'], 
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true, // <--- ESTO ES LO MÁS IMPORTANTE
];
