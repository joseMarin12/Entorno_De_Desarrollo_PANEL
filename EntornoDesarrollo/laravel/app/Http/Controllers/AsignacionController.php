<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Throwable;

class AsignacionController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // 🟢 Carga dinámicamente desde .env o toma la red interna de Docker como fallback
        $urlRaw = env(
            'N8N_WEBHOOK_ASIGNACIONES', 
            'http://n8n:5678/webhook/asignaciones'
        );
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy seguro de Asignaciones: valida acciones, inyecta context auth y gestiona timeouts
     */
    public function proxy(Request $request)
    {
        try {
            $payload = $request->all();

            $allowedActions = [
                'getAsignaciones', 
                'createAsignacion', 
                'updateAsignacion', 
                'toggleAsignacionStatus',
                'getEmpresas', 
                'getTrabajadores', 
                'getComerciales'
            ];

            if (!isset($payload['action']) || !in_array($payload['action'], $allowedActions)) {
                return response()->json([
                    'error' => 'Acción no válida: ' . ($payload['action'] ?? 'null')
                ], 400);
            }

            // 🔒 Inyección de credenciales del usuario autenticado por el Middleware
            $payload['auth_user'] = [
                'id'    => $request->input('authenticated_user_id'),
                'email' => $request->input('authenticated_user_email'),
                'role'  => $request->input('authenticated_user_role')
            ];

            // Reenvío de token JWT e información de headers
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            $token = $request->header('Authorization');
            if ($token) {
                $headers['Authorization'] = $token;
            }

            // Petición a n8n con timeout de 30 segundos
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
            Log::warning("Error de conexión hacia n8n [Asignaciones]: " . $e->getMessage());

            return response()->json([
                'error'   => 'No se pudo conectar con el orquestador n8n.',
                'details' => $e->getMessage()
            ], 502);

        } catch (Throwable $e) {
            Log::error("Error crítico en AsignacionController: " . $e->getMessage(), [
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
