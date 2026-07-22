<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ComercialController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Obtiene la URL del env y remueve comillas accidentales que puedan venir del contenedor
        $urlRaw = env('N8N_WEBHOOK_COMERCIALES', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-comerciales');
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy para Comercial: Reenvía acción + datos + headers a n8n de forma segura
     */
    public function proxy(Request $request)
    {
        try {
            // 1. Cabeceras base necesarias para intercambio JSON
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            // 2. Capturamos el Bearer Token que envió Angular
            $authHeader = $request->header('Authorization');
            if ($authHeader) {
                $headers['Authorization'] = $authHeader;
            }

            // 3. Reenvío con timeout de 20 segundos hacia n8n
            $response = Http::timeout(20)
                ->withHeaders($headers)
                ->post($this->n8nUrl, $request->all());

            // 4. Manejo explícito en caso de error del webhook
            if ($response->failed()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'El servicio de automatización comercial devolvió un error.',
                    'details' => $response->json() ?? $response->body()
                ], $response->status());
            }

            $responseData = $response->json() ?? [];

            return response()->json($responseData, $response->status());

        } catch (\Exception $e) {
            Log::error("Error en ComercialController Proxy. URL: [{$this->n8nUrl}]. Detalle: " . $e->getMessage());

            return response()->json([
                'status'      => 'error',
                'message'     => 'El servicio de automatización comercial temporalmente no responde.',
                'dev_details' => $e->getMessage()
            ], 502);
        }
    }
}
