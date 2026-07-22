<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AutenticadorController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Apunta por defecto a Hostinger o lee la variable N8N_WEBHOOK_LOGIN_URL si está en el .env
        $this->n8nUrl = env('N8N_WEBHOOK_LOGIN_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/login');
    }

    /**
     * Proxy de Login: reenvía email y password a n8n.
     * n8n verifica credenciales y responde el JSON con el token hacia Angular.
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
