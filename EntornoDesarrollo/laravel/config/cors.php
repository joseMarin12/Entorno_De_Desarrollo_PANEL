<?php

return [
    'paths' => ['api/*', 'login', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://panel-frontend-1079064952465.us-central1.run.app'],
    'supports_credentials' => true,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
