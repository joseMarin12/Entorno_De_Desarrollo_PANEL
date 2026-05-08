<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DocumentoFirmaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL del webhook de n8n para el flujo de firmas
        // Puedes cambiar N8N_WEBHOOK_FIRMAS en tu .env si es necesario
        $this->n8nUrl = env('N8N_WEBHOOK_FIRMAS', 'http://n8n:5678/webhook/firmas-trabajadores');
    }

    /**
     * Proxy para solicitar una firma a Signaturit a través de n8n
     */
    public function solicitarFirmaProxy(Request $request)
    {
        // Validamos mínimamente (opcional)
        $request->validate([
            'action' => 'required|string',
            'url_pdf' => 'required|url',
            'trabajador_email' => 'required|email',
        ]);

        // Reenviamos la petición a n8n
        $response = Http::post($this->n8nUrl, $request->all());

        return response()->json($response->json(), $response->status());
    }
}
