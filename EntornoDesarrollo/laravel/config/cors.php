<?php

return [
    // Rutas que permiten CORS
    'paths' => ['api/*', 'login', 'sanctum/csrf-cookie'],
    
    // Métodos HTTP permitidos
    'allowed_methods' => ['*'],
    
    // Orígenes permitidos - ACTUALIZA ESTO SEGÚN AMBIENTE
    'allowed_origins' => [
        'http://localhost:4200',  // Local
        'https://panel-frontend-1079064952465.us-central1.run.app',  // GCP Production
    ],
    
    // Orígenes por patrón (para desarrollo flexible)
    'allowed_origins_patterns' => [
        // Descomenta para desarrollo
        // '#^http://localhost.*#',
        // '#^https://.*\.us-central1\.run\.app$#',
    ],
    
    // Headers permitidos en solicitudes
    'allowed_headers' => ['*'],
    
    // Headers que Angular puede leer de la respuesta
    'exposed_headers' => ['X-Total-Count', 'Authorization'],
    
    // Max age del cache de preflight
    'max_age' => 0,
    
    // Permitir credenciales (cookies, authorization headers)
    'supports_credentials' => true,
];
