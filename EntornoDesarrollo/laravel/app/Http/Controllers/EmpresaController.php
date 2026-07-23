<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class EmpresaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL del webhook de n8n para producción
        $this->n8nUrl = env('N8N_WEBHOOK_EMPRESAS_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-empresas');
    }

    /**
     * Proxy genérico: reenvía la acción y los datos hacia n8n
     */
    public function proxy(Request $request)
    {
        $response = Http::post($this->n8nUrl, $request->all());
        
        return response()->json($response->json(), $response->status());
    }
}
