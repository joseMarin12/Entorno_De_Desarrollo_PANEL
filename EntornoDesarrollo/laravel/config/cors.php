return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // 1. Asegúrate de incluir '*' o específicamente 'login' si tu ruta no empieza con api/
    'paths' => ['api/*', 'login', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // 2. Coloca aquí la URL exacta de tu frontend (sin la barra / al final)
    'allowed_origins' => [
        'https://panel-frontend-1079064952465.us-central1.run.app'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Déjalo en true si usas cookies/Sanctum para sesiones
];
