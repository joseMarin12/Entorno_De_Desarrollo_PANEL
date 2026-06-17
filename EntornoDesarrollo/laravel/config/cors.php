<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'login', 'logout'],

    'allowed_methods' => ['*'],

    // 🚀 CORREGIDO: Especificamos tu dominio exacto de Angular en lugar del comodín '*'
    // Esto evita que se duplique o se mezcle con las cabeceras del proxy de Cloud Run
    'allowed_origins' => ['https://panel-frontend-1079064952465.us-central1.run.app'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // 🚀 CORREGIDO: Cambiado a true para permitir el intercambio seguro de tokens/sesiones
    'supports_credentials' => true,

];
