<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Throwable;

class TrabajadorController extends Controller
{
    private string $n8nTrabajadoresUrl;

    public function __construct()
    {
        // Carga la variable de entorno con fallback a Hostinger y limpia comillas accidentales
        $urlRaw = env(
            'N8N_WEBHOOK_TRABAJADORES', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-trabajadores'
        );
        $this->n8nTrabajadoresUrl = trim(str_replace(['"', "'"], '', $urlRaw));
    }

    /**
     * Proxy de seguridad para Trabajadores: Encripta password, inyecta headers y reenvía a n8n
     */
    public function proxy(Request $request)
    {
        try {
            // 1. Preparación de cabeceras e inyección del Token JWT enviado por Angular
            $headers = [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ];

            $token = $request->header('Authorization');
            if ($token) {
                $headers['Authorization'] = $token;
            }

            // 2. Captura de datos recibidos
            $data = $request->all();

            // 3. Encriptación segura de contraseña si viene presente en el formulario
            if (isset($data['password']) && trim($data['password']) !== '') {
                $data['password'] = Hash::make($data['password']);
            }

            // 4. Envío a n8n con tiempo límite de 30 segundos
            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($this->n8nTrabajadoresUrl, $data);

            // 5. Normalización de respuesta (soporta JSON o texto plano devuelto por n8n)
            $responseData = $response->json();
            if (is_null($responseData)) {
                $responseData = [
                    'message' => $response->body() ?: 'Petición procesada exitosamente por n8n'
                ];
            }

            return response()->json($responseData, $response->status());

        } catch (ConnectionException $e) {
            // Registro de advertencia en logs de Cloud Run cuando el orquestador no responde
            Log::warning("Fallo de conexión hacia n8n Hostinger [Trabajadores]: " . $e->getMessage());

            return response()->json([
                'error'   => 'No se pudo conectar con el servidor de n8n en Hostinger.',
                'details' => $e->getMessage()
            ], 502);

        } catch (Throwable $e) {
            // Registro de error crítico en Cloud Run con trazabilidad de código
            Log::error("Error crítico en TrabajadorController: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'error'   => 'Excepción controlada en el Proxy de Trabajadores de Laravel.',
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine()
            ], 500);
        }
    }
}
