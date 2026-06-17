return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // Solo aplicará a las rutas necesarias (añade aquí más si usas /api/*)
    'paths' => ['login', 'api/*', 'sanctum/csrf-cookie'],

    // Solo permitimos los métodos que tu app realmente utiliza
    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],

    // RESTRICCIÓN TOTAL: Solo tu URL de Angular puede hablar con el backend
    'allowed_origins' => [
        'https://panel-frontend-1079064952465.us-central1.run.app'
    ],

    'allowed_origins_patterns' => [],

    // Solo permitimos los encabezados estándar de peticiones HTTP y autenticación
    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization', 'Accept', 'X-XSRF-TOKEN'],

    'exposed_headers' => [],

    // Cachea la respuesta del OPTIONS por 24 horas para que el navegador no sature a Laravel
    'max_age' => 86400,

    // Manténlo en true solo si manejas cookies o sesiones compartidas (Sanctum)
    'supports_credentials' => true,
];
