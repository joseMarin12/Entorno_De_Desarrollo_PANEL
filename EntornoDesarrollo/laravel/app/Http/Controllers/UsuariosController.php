<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UsuariosController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL corregida hacia n8n en Hostinger
        $this->n8nUrl = env('N8N_WEBHOOK_USUARIOS_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/usuarios');
    }

    /**
     * Proxy genérico: reenvía la acción + datos a n8n delegando el CORS al middleware global
     */
    public function proxy(Request $request)
    {
        // Reenvío del payload a la URL de n8n
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->post($this->n8nUrl, $request->all());

        // Retornamos la respuesta limpia. El middleware global de Laravel le pondrá el CORS correcto sin duplicarlo.
        return response()->json($response->json(), $response->status());
    }
}
