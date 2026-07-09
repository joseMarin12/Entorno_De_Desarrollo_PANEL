<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ComercialController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // La URL de Hostinger se establece como la ruta por defecto (fallback).
        // Si en tu entorno local necesitas usar tu Docker, añade en tu .env local la variable:
        // N8N_WEBHOOK_COMERCIALES=http://localhost:5678/webhook/gestion-comerciales
        $this->n8nUrl = env('N8N_WEBHOOK_COMERCIALES', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-comerciales');
    }

    /**
     * Proxy genérico: reenvía la acción + datos a n8n
     */
    public function proxy(Request $request)
    {
        try {
            // Reenvío de datos estructurados con un límite de espera de 30 segundos
            $response = Http::timeout(30)->post($this->n8nUrl, $request->all());
            
            return response()->json($response->json(), $response->status());
            
        } catch (\Exception $e) {
            // En caso de caída de n8n, se registra en los logs de Laravel en Cloud Run sin romper la app
            Log::error('Error de comunicación con n8n en ComercialController: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'El servicio de automatización comercial temporalmente no responde.',
                'dev_details' => $e->getMessage()
            ], 502); // 502 Bad Gateway
        }
    }
}
