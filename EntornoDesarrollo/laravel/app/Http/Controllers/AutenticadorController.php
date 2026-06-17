<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AutenticadorController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Limpiamos la URL de cualquier espacio accidental al cargarla
        $this->n8nUrl = trim(env('N8N_WEBHOOK_LOGIN_URL', ''));
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        try {
            // Enviamos la petición a n8n
            $response = Http::timeout(30)
                ->withHeaders(['Accept' => 'application/json'])
                ->post($this->n8nUrl, [
                    'email' => $request->email,
                    'password' => $request->password,
                ]);

            // Obtenemos el cuerpo de la respuesta
            $responseData = $response->json();
            $status = $response->status();

            // Log de depuración para ver qué está pasando
            Log::info('Respuesta de n8n', ['status' => $status, 'data' => $responseData]);

            // Retornamos exactamente lo que n8n nos envía
            return response()->json($responseData, $status);
            
        } catch (\Exception $e) {
            Log::error('Error crítico en el login', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión: ' . $e->getMessage()
            ], 500);
        }
    }
}
