<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UsuariosController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        $this->n8nUrl = env('N8N_WEBHOOK_USUARIOS_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/usuarios');
    }

    /**
     * Proxy genérico: reenvía datos + cabecera de autenticación a n8n
     */
    public function proxy(Request $request)
    {
        // 1. Capturamos el token original que mandó Angular en las cabeceras
        $token = $request->header('Authorization');

        // 2. Preparamos la petición HTTP hacia n8n asegurando las cabeceras base
        $client = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ]);

        // 3. Si Angular envió un token, se lo inyectamos dinámicamente al envío hacia n8n
        if ($token) {
            $client->withHeaders(['Authorization' => $token]);
        }

        // 4. Realizamos el envío del payload completo
        $response = $client->post($this->n8nUrl, $request->all());

        return response()->json($response->json(), $response->status());
    }
}
