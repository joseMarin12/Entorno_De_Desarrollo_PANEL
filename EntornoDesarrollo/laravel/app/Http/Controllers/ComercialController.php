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
        $urlRaw = env('N8N_WEBHOOK_COMERCIALES', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-comerciales');
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy genérico: reenvía la acción + datos + HEADERS a n8n
     */
    public function proxy(Request $request)
    {
        try {
            // 1. 🔥 CAPTURAMOS EL TOKEN ORIGINAL QUE ENVIÓ ANGULAR
            $authHeader = $request->header('Authorization');

            // 2. REENVÍO COMPLETO: Pasamos los datos y adjuntamos el header Authorization
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => $authHeader // <-- Aquí viaja el Bearer Token a n8n
                ])
                ->post($this->n8nUrl, $request->all());
            
            return response()->json($response->json(), $response->status());
            
        } catch (\Exception $e) {
            Log::error("Error en ComercialController. URL intentada: [{$this->n8nUrl}]. Detalle: " . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'El servicio de automatización comercial temporalmente no responde.',
                'dev_details' => $e->getMessage()
            ], 502);
        }
    }
}
