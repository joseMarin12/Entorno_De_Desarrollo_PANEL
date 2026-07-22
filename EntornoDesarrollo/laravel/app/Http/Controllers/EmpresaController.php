<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class EmpresaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Prioriza la variable de entorno y limpia comillas accidentales
        $urlRaw = env(
            'N8N_WEBHOOK_EMPRESAS_URL', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-empresas'
        );
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy de seguridad para Empresas: Reenvía acción + datos + headers a n8n
     */
    public function proxy(Request $request)
    {
        try {
            // 1. Cabeceras base para el intercambio de información JSON
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            // 2. 🔥 CAPTURAMOS E INYECTAMOS EL TOKEN JWT ENVIADO POR ANGULAR
            $authHeader = $request->header('Authorization');
            if ($authHeader) {
                $headers['Authorization'] = $authHeader;
            }

            // 3. Petición hacia n8n con timeout de seguridad (30 segundos)
            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($this->n8nUrl, $request->all());

            // 4. Validación de control: si n8n responde con error o cuerpo vacío
            if ($response->failed() || empty($response->body())) {
                return response()->json([
                    'error'   => true,
                    'message' => 'El orquestador n8n no devolvió una respuesta válida.',
                    'status'  => $response->status(),
                    'details' => $response->json() ?? $response->body()
                ], $response->status() >= 400 ? $response->status() : 500);
            }

            $responseData = $response->json() ?? [];

            return response()->json($responseData, $response->status());

        } catch (Exception $e) {
            // Log local en Cloud Run para depuración
            Log::error("Error en EmpresaController Proxy. URL: [{$this->n8nUrl}]. Detalle: " . $e->getMessage());

            return response()->json([
                'error'   => true,
                'message' => 'Excepción controlada en el Proxy de Laravel (Empresas).',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
