<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Exception;

class FormacionController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL de Hostinger configurada como fallback limpio y configurable por entorno
        $this->n8nUrl = env('N8N_WEBHOOK_FORMACIONES_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-formaciones');
    }

    /**
     * Proxy seguro: Filtra acciones válidas y reenvía a n8n controlando caídas de conexión
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

        // 1. Validación temprana de acciones en la petición
        if (!isset($payload['action']) || !in_array($payload['action'], $allowedActions)) {
            return response()->json([
                'error' => true,
                'message' => 'Acción no válida o no permitida: ' . ($payload['action'] ?? 'null')
            ], 400);
        }

        try {
            // 2. Envío a n8n con cabeceras explícitas y límite de espera de 30s
            $response = Http::timeout(30)
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->post($this->n8nUrl, $payload);

            // 3. Validación de respuesta del orquestador n8n
            if ($response->failed() || empty($response->body())) {
                return response()->json([
                    'error' => true,
                    'message' => 'El orquestador n8n (Formaciones) no devolvió una respuesta válida.',
                    'status_orquestador' => $response->status()
                ], 500);
            }

            return response()->json($response->json(), $response->status());

        } catch (Exception $e) {
            // Evita de raíz el cierre del canal asíncrono (message channel closed) en Angular
            return response()->json([
                'error' => true,
                'message' => 'Excepción controlada en el Proxy de Formaciones de Laravel.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
