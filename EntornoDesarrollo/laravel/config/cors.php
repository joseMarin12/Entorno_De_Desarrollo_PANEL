<?php

return [
    // 🚀 Al dejar los paths vacíos, Laravel ignora la inyección de CORS
    // Evitando que se duplique con la cabecera que ya envía tu servidor web
    'paths' => [], 

    'allowed_methods' => [],

    'allowed_origins' => [],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
