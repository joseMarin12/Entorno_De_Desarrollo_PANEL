<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TrabajadorController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        $this->n8nUrl = env('N8N_WEBHOOK_TRABAJADORES', 'http://n8n:5678/webhook/gestion-trabajadores');
    }

    
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
