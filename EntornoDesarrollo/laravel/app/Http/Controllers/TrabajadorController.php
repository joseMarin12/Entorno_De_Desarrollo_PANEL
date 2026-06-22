<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TrabajadorController extends Controller
{
    private string $n8nTrabajadoresUrl;

    public function __construct()
    {
        // Apuntamos al webhook específico de Hostinger para gestión de trabajadores
        $this->n8nTrabajadoresUrl = env('N8N_WEBHOOK_TRABAJADORES_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-trabajadores');
    }

    /**
     * Proxy para Gestión de Trabajadores
     */
    public function proxy(Request $request)
    {
        // 1. Capturamos el token de autenticación que envía Angular
        $token = $request->header('Authorization');

        // 2. Inicializamos el cliente HTTP con las cabeceras base requeridas
        $client = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ]);

        // 3. Reenviamos el token a n8n para que el nodo JWT Verify lo valide correctamente
        if ($token) {
            $client->withHeaders(['Authorization' => $token]);
        }

        // 4. Hacemos el puente (POST) hacia n8n enviando todo el payload del formulario
        $response = $client->post($this->n8nTrabajadoresUrl, $request->all());

        // 5. Devolvemos la respuesta exacta de n8n con su código de estado HTTP correspondiente
        return response()->json($response->json(), $response->status());
    }
}
