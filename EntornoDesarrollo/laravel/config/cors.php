<?php
return [
    'paths' => ['api/*', 'login', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://panel-frontend-1079064952465.us-central1.run.app'],
    'allowed_headers' => ['*'],
    'supports_credentials' => true, // <-- ESTO ES LO MÁS IMPORTANTE
];
