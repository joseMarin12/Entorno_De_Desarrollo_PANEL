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
        $this->n8nUrl = env('N8N_WEBHOOK_COMERCIALES', 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-comerciales');
    }
    public function proxy(Request $request)
    {
        try {
            $response = Http::timeout(30)->post($this->n8nUrl, $request->all());
            
            return response()->json($response->json(), $response->status());
            
        } catch (\Exception $e) {
            Log::error('Error de comunicación con n8n en ComercialController: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'El servicio de automatización comercial temporalmente no responde.',
                'dev_details' => $e->getMessage()
            ], 502); // 502 Bad Gateway
        }
    }
}
