<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log; // 🌟 Importamos la clase Log para registrar fallos en Google Cloud

class TrabajadorController extends Controller
{
    private string $n8nTrabajadoresUrl;

    public function __construct()
    {
        // Vinculamos directamente tu webhook de n8n Hostinger
        $this->n8nTrabajadoresUrl = 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-trabajadores';
    }

    public function proxy(Request $request)
    {
        try {
            $token = $request->header('Authorization');

            // Preparamos el cliente HTTP con las cabeceras básicas
            $client = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ]);

            // Si el frontend envía un Token, se lo inyectamos al cliente
            if ($token) {
                $client = $client->withHeaders(['Authorization' => $token]);
            }

            // Capturamos todos los datos que vienen desde el formulario de Angular
            $data = $request->all();

            // Verificamos si viene una contraseña y no está vacía para encriptarla
            if (isset($data['password']) && trim($data['password']) !== '') {
                $data['password'] = Hash::make($data['password']);
            }

            // Enviamos la petición a n8n con un tiempo de espera de 15 segundos
            $response = $client->timeout(15)->post($this->n8nTrabajadoresUrl, $data);

            // Validamos si n8n respondió un JSON válido o texto plano
            $responseData = $response->json();
            if (is_null($responseData)) {
                // Si es texto plano (ej: "Workflow started"), lo envolvemos en un JSON para Angular
                $responseData = ['message' => $response->body() ?: 'Petición procesada por n8n'];
            }

            return response()->json($responseData, $response->status());

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            // Queda registrado en el historial de logs de Cloud Run
            Log::warning('Fallo de conexión hacia n8n Hostinger: ' . $e->getMessage());

            return response()->json([
                'error' => 'No se pudo conectar con el servidor de n8n en Hostinger',
                'details' => $e->getMessage()
            ], 502);

        } catch (\Throwable $e) {
            // Registramos el error fatal con el archivo y línea exacta en la consola de Google Cloud
            Log::error('Error crítico en TrabajadorController: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'error' => 'Error interno en el TrabajadorController de Laravel',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
