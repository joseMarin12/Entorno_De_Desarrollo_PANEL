<?php

// --- FILTRO CORS RESTRINGIDO EN INFRAESTRUCTURA ---
$allowedOrigin = 'https://panel-frontend-1079064952465.us-central1.run.app';

if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowedOrigin) {
    
    // Si coincide el origen del frontend, inyectamos los encabezados seguros
    header("Access-Control-Allow-Origin: $allowedOrigin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");

    // Si es un Preflight (OPTIONS), respondemos de inmediato y matamos el proceso
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header("HTTP/1.1 204 No Content");
        exit(0);
    }
}
// --------------------------------------------------

/**
 * Laravel - A PHP Framework For Web Artisans
 * ... resto del código ...
 */
