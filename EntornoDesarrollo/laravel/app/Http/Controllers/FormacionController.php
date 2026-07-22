<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class FormacionController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Carga y limpia la URL del webhook desde las variables de entorno con fallback a Hostinger
        $urlRaw = env(
            'N8N_WEBHOOK_FORMACIONES_URL', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-formaciones'
        );
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy seguro para Formaciones: Filtra acciones válidas y reenvía a n8n controlando caídas
     */
    public function proxy(Request $request)
    {
        $payload = $request->all();

        $allowedActions = [
            'getFormaciones', 'createFormacion', 'updateFormacion', 
            'toggleFormacionStatus', 'getTrabajadores', 'addTrabajadorToFormacion', 
            'removeTrabajadorFromFormacion', 'getArea', 'getModalidad', 
            'getEjecucion', 'getResponsable'
        ];

        // 1. Validación temprana de la acción enviada en la petición
        if (!isset($payload['action']) || !in_array($payload['action'], $allowedActions, true)) {
            return response()->json([
                'error'   => true,
                'message' => 'Acción no válida o no permitida: ' . ($payload['action'] ?? 'null')
            ], 400);
        }

        try {
            // 2. Preparamos las cabeceras base e inyectamos el token Authorization enviado por Angular
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            $authHeader = $request->header('Authorization');
            if ($authHeader) {
                $headers['Authorization'] = $authHeader;
            }

            // 3. Envío a n8n con límite de espera de 30 segundos
            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($this->n8nUrl, $payload);

            // 4. Validación de la respuesta entregada por n8n
            if ($response->failed() || empty($response->body())) {
                return response()->json([
                    'error'   => true,
                    'message' => 'El orquestador n8n (Formaciones) no devolvió una respuesta válida.',
                    'status'  => $response->status(),
                    'details' => $response->json() ?? $response->body()
                ], $response->status() >= 400 ? $response->status() : 500);
            }

            $responseData = $response->json() ?? [];

            return response()->json($responseData, $response->status());

        } catch (Exception $e) {
            // Log local en Cloud Run para trazabilidad
            Log::error("Error en FormacionController Proxy. URL: [{$this->n8nUrl}]. Detalle: " . $e->getMessage());

            return response()->json([
                'error'   => true,
                'message' => 'Excepción controlada en el Proxy de Formaciones de Laravel.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
