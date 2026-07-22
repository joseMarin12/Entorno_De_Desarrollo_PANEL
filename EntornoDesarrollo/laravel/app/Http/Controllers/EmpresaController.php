<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Throwable;

class DireccionesEmpresaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // 🚀 Lee desde .env o toma la URL de producción de Hostinger como fallback
        $urlRaw = env(
            'N8N_WEBHOOK_DIRECCIONES_EMPRESA', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-direcciones'
        );
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy genérico: valida, inyecta seguridad y reenvía la acción + datos a n8n
     */
    public function proxy(Request $request)
    {
        try {
            $payload = $request->all();

            // 📋 Lista completa de acciones permitidas desde el servicio de Angular
            $allowedActions = [
                'getDirecciones',
                'getDireccionesEmpresa',
                'getPaises',
                'getProvincias',
                'getLocalidades',
                'createDireccion',
                'createDireccionEmpresa',
                'updateDireccion',
                'updateDireccionEmpresa',
                'toggleDireccionStatus',
                'deleteDireccion',
                'getEmpresas'
            ];

            // Validación de la acción entrante
            if (!isset($payload['action']) || !in_array($payload['action'], $allowedActions)) {
                return response()->json([
                    'error' => 'Acción de dirección no válida: ' . ($payload['action'] ?? 'null')
                ], 400);
            }

            // 🔒 INYECCIÓN DE SEGURIDAD AUDITABLE:
            // Añadimos al payload los datos del usuario que tu middleware VerifyApiToken ya validó.
            $payload['auth_user'] = [
                'id'    => $request->input('authenticated_user_id'),
                'email' => $request->input('authenticated_user_email'),
                'role'  => $request->input('authenticated_user_role')
            ];

            // Reenvío de encabezados y Token JWT
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            $token = $request->header('Authorization');
            if ($token) {
                $headers['Authorization'] = $token;
            }

            // Envío seguro hacia n8n con timeout preventivo de 30 segundos
            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($this->n8nUrl, $payload);

            $responseData = $response->json();
            if (is_null($responseData)) {
                $responseData = [
                    'message' => $response->body() ?: 'Petición procesada exitosamente por n8n'
                ];
            }

            return response()->json($responseData, $response->status());

        } catch (ConnectionException $e) {
            Log::warning("Fallo de conexión hacia n8n [DireccionesEmpresa]: " . $e->getMessage());

            return response()->json([
                'error'   => 'Error de conexión con el webhook de direcciones en n8n.',
                'details' => $e->getMessage()
            ], 502);

        } catch (Throwable $e) {
            Log::error("Error crítico en DireccionesEmpresaController: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'error'   => 'Error interno en el servidor Laravel (Proxy).',
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine()
            ], 500);
        }
    }
}
