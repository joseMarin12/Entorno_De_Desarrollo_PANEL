<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UsuariosController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL del webhook de n8n (ajustar según entorno)
        $this->n8nUrl = env('N8N_WEBHOOK_USUARIOS_URL', 'http://n8n:5678/webhook/usuarios');
    }

    /**
     * Proxy genérico: reenvía la acción + datos a n8n
     */

    public function proxy(Request $request)
    {
        $response = Http::post($this->n8nUrl, $request->all());
        return response()->json($response->json(), $response->status());
    }
}
