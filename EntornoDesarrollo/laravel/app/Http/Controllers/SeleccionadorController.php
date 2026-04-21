<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SeleccionadorController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Usamos la URL que nos pasaste como base, configurable desde el .env
        $this->n8nUrl = env('N8N_WEBHOOK_SELECCIONADORES', 'http://n8n:5678/webhook/gestion-seleccionadores');
    }

    /**
     * Proxy para Seleccionadores: Reenvía acción + datos a n8n
     */
    public function proxy(Request $request)
    {
        try {
            $response = Http::post($this->n8nUrl, $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error'   => 'n8n_response_error',
                    'status'  => $response->status(),
                    'details' => $response->json() ?? $response->body()
                ], $response->status());
            }

            return response()->json($response->json(), $response->status());

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'proxy_connection_exception',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
