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
        // 🟢 Carga desde .env manteniendo como fallback la URL interna de Docker de deployment
        $urlRaw = env(
            'N8N_WEBHOOK_ASIGNACIONES', 
            'http://n8n:5678/webhook/asignaciones'
        );
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy de seguridad para Asignaciones en la rama deployment
     */
    public function proxy(Request $request)
    {
        try {
            $payload = $request->all();

            $allowedActions = [
                'getAsignaciones', 
                'createAsignacion', 
                'updateAsignacion', 
                'toggleAsignacionStatus', // Para el borrado lógico
                'getEmpresas', 
                'getTrabajadores', 
                'getComerciales'
            ];

            if (!isset($payload['action']) || !in_array($payload['action'], $allowedActions)) {
                return response()->json([
                    'error' => 'Acción no válida: ' . ($payload['action'] ?? 'null')
                ], 400);
            }

            // 🔒 INYECCIÓN DE SEGURIDAD:
            // Añadimos datos del usuario autenticado por el middleware VerifyApiToken
            $payload['auth_user'] = [
                'id'    => $request->input('authenticated_user_id'),
                'email' => $request->input('authenticated_user_email'),
                'role'  => $request->input('authenticated_user_role')
            ];

            // 1. Preparación de cabeceras y propagación del Token JWT
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            $token = $request->header('Authorization');
            if ($token) {
                $headers['Authorization'] = $token;
            }

            // 2. Envío a n8n con tiempo límite de 30 segundos
            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($this->n8nUrl, $payload);

            // 3. Normalización de respuesta (JSON o texto plano)
            $responseData = $response->json();
            if (is_null($responseData)) {
                $responseData = [
                    'message' => $response->body() ?: 'Petición procesada exitosamente por n8n'
                ];
            }

            return response()->json($responseData, $response->status());

        } catch (ConnectionException $e) {
            Log::warning("Fallo de conexión hacia n8n [Asignaciones - Deployment]: " . $e->getMessage());

            return response()->json([
                'error'   => 'No se pudo conectar con el servicio interno de n8n.',
                'details' => $e->getMessage()
            ], 502);

        } catch (Throwable $e) {
            Log::error("Error crítico en AsignacionController [Deployment]: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'error'   => 'Excepción controlada en el Proxy de Asignaciones de Laravel.',
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine()
            ], 500);
        }
    }
}
