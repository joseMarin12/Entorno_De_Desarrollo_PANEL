<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SeleccionadorController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // Usamos la URL de producción de n8n en Hostinger, configurable desde el .env
        $this->n8nUrl = env(
            'N8N_WEBHOOK_SELECCIONADORES', 
            'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-seleccionadores'
        );
    }

    /**
     * Proxy para Seleccionadores: Reenvía acción + datos + headers a n8n
     */
    public function proxy(Request $request)
    {
        try {
            // CORRECCIÓN CRÍTICA: Capturamos la cabecera Authorization que envía Angular
            // y se la inyectamos a la petición saliente hacia n8n para que el nodo IF no falle.
            $response = Http::withHeaders([
                'Authorization' => $request->header('Authorization'),
                'Accept'        => 'application/json',
            ])->post($this->n8nUrl, $request->all());

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
