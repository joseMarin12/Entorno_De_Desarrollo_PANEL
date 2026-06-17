<?php

return [
    'paths' => ['api/*', 'login', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://panel-frontend-1079064952465.us-central1.run.app'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
