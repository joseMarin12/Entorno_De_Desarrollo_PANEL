<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DireccionesEmpresaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Carga la URL desde .env o toma la URL por defecto
        $this->n8nUrl = env(
            'N8N_WEBHOOK_DIRECCIONES_EMPRESA', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-direcciones'
        );
    }

    /**
     * Proxy genérico: reenvía la acción + datos directamente a n8n
     */
    public function proxy(Request $request)
    {
        $response = Http::post($this->n8nUrl, $request->all());

        return response()->json($response->json() ?? [], $response->status());
    }
}
