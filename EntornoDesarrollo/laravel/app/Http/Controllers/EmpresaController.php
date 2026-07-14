<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Exception;

class EmpresaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL por defecto actualizada a tu servidor de Hostinger
        $this->n8nUrl = env('N8N_WEBHOOK_EMPRESAS_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-empresas');
    }

    /**
     * Proxy de seguridad: reenvía la acción + datos a n8n controlando caídas de canal
     */
    public function proxy(Request $request)
    {
        try {
            // Asignamos un timeout de 30 segundos para evitar colapsos asíncronos
            $response = Http::timeout(30)
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->post($this->n8nUrl, $request->all());

            // Validación de control: si n8n responde vacío o con código de error
            if ($response->failed() || empty($response->body())) {
                return response()->json([
                    'error' => true,
                    'message' => 'El orquestador n8n no devolvió una respuesta válida.',
                    'status_orquestador' => $response->status()
                ], 500);
            }

            return response()->json($response->json(), $response->status());

        } catch (Exception $e) {
            // Previene de raíz el error de "message channel closed" en Angular
            return response()->json([
                'error' => true,
                'message' => 'Excepción controlada en el Proxy de Laravel.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
