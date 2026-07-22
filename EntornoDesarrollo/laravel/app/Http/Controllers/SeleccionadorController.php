<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SeleccionadorController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Prioriza la variable de entorno con fallback al webhook HTTPS en Hostinger
        $this->n8nUrl = env(
            'N8N_WEBHOOK_SELECCIONADORES', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-seleccionadores'
        );
    }

    /**
     * Proxy para Seleccionadores: Reenvía acción + datos + cabeceras a n8n de forma segura
     */
    public function proxy(Request $request)
    {
        try {
            // 1. Preparamos las cabeceras base
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            // 2. Inyectamos la cabecera Authorization enviada por Angular
            $token = $request->header('Authorization');
            if ($token) {
                $headers['Authorization'] = $token;
            }

            // 3. Enviamos la petición hacia n8n con timeout de 15 segundos
            $response = Http::withHeaders($headers)
                ->timeout(15)
                ->post($this->n8nUrl, $request->all());

            // 4. Manejo de fallos en la respuesta de n8n
            if ($response->failed()) {
                return response()->json([
                    'error'   => 'n8n_response_error',
                    'status'  => $response->status(),
                    'details' => $response->json() ?? $response->body()
                ], $response->status());
            }

            $responseData = $response->json() ?? [];

            return response()->json($responseData, $response->status());

        } catch (\Exception $e) {
            Log::error('Error en SeleccionadorController Proxy: ' . $e->getMessage());

            return response()->json([
                'error'   => 'proxy_connection_exception',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
