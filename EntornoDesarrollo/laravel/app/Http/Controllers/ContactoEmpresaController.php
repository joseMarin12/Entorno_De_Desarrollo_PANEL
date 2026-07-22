<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Throwable;

class ContactoEmpresaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        $urlRaw = env(
            'N8N_WEBHOOK_CONTACTOS_EMPRESA', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-contactos'
        );
        $this->n8nUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy seguro para Contactos de Empresa: valida acciones, inyecta auth_user y reenvía a n8n
     */
    public function proxy(Request $request)
    {
        try {
            $payload = $request->all();

            $allowedActions = [
                'getContactos', 
                'getContactosEmpresa', 
                'createContacto', 
                'createContactoEmpresa', 
                'updateContacto', 
                'updateContactoEmpresa', 
                'toggleContactoStatus', 
                'toggleContactoEmpresaStatus',
                'getEmpresas' // Lookup de empresas asociadas
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

            // Reenvío de encabezados y Token JWT
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            $token = $request->header('Authorization');
            if ($token) {
                $headers['Authorization'] = $token;
            }

            // Petición a n8n con timeout preventivo de 30 segundos
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
            Log::warning("Fallo de conexión hacia n8n [ContactoEmpresa]: " . $e->getMessage());

            return response()->json([
                'error'   => 'No se pudo establecer comunicación con el servidor n8n.',
                'details' => $e->getMessage()
            ], 502);

        } catch (Throwable $e) {
            Log::error("Error crítico en ContactoEmpresaController: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'error'   => 'Error interno en el servidor backend (Laravel Proxy).',
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine()
            ], 500);
        }
    }
}
