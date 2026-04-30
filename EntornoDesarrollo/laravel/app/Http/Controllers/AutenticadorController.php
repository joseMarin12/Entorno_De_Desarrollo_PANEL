<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AutenticadorController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL del webhook de n8n para login
        $this->n8nUrl = env('N8N_WEBHOOK_LOGIN_URL', 'http://n8n:5678/webhook/login');
    }

    /**
     * Proxy de Login: reenvía email y password a n8n.
     * n8n verifica credenciales con bcrypt y genera un JWT firmado.
     * Laravel simplemente reenvía la respuesta (que incluye el token) a Angular.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $response = Http::post($this->n8nUrl, [
            'email' => $request->email,
            'password' => $request->password,
        ]);

        return response()->json($response->json(), $response->status());
    }
}
