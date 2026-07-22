<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UsuariosController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Prioriza la variable de entorno y usa la URL pública de Hostinger como fallback
        $this->n8nUrl = env('N8N_WEBHOOK_USUARIOS_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/usuarios');
    }

    /**
     * Proxy genérico: reenvía datos + cabecera de autenticación a n8n de forma segura
     */
    public function proxy(Request $request)
    {
        try {
            // 1. Preparamos las cabeceras base
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            // 2. Capturamos e inyectamos el token Authorization si viene desde Angular
            $token = $request->header('Authorization');
            if ($token) {
                $headers['Authorization'] = $token;
            }

            // 3. Petición hacia n8n con timeout de seguridad (15 segundos)
            $response = Http::withHeaders($headers)
                ->timeout(15)
                ->post($this->n8nUrl, $request->all());

            // 4. Validamos que la respuesta sea JSON legítimo
            $responseData = $response->json();

            // Si n8n responde con cuerpo vacío pero código 200, retornamos un array vacío válido
            if (is_null($responseData)) {
                $responseData = [];
            }

            return response()->json($responseData, $response->status());

        } catch (\Exception $e) {
            // Log local en Laravel para depuración en Cloud Run
            Log::error('Error en UsuariosController Proxy: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error de comunicación con el servicio de automatización (n8n).',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
