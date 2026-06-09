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
        // URL del webhook de n8n para login
        $this->n8nUrl = env('N8N_WEBHOOK_LOGIN_URL', 'http://n8n:5678/webhook/login');
    }

    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Log para debugging
            Log::info('Login attempt', ['email' => $request->email]);

            $response = Http::timeout(30)
                ->post($this->n8nUrl, [
                    'email' => $request->email,
                    'password' => $request->password,
                ]);

            return response()->json($response->json(), $response->status());
            
        } catch (\Exception $e) {
            Log::error('Login error', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error en el servidor: ' . $e->getMessage()
            ], 500);
        }
    }
}
