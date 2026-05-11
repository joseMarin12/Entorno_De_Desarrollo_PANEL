<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AsignacionController extends Controller
{
    private string $n8nUrl = 'http://n8n:5678/webhook/asignaciones';

    public function proxy(Request $request)
    {
        $payload = $request->all();

        $allowedActions = [
            'getAsignaciones', 
            'createAsignacion', 
            'updateAsignacion', 
            'toggleAsignacionStatus', // Para el borrado lógico
            'getEmpresas', 
            'getTrabajadores', 
            'getComerciales'
        ];

        if (!isset($payload['action']) || !in_array($payload['action'], $allowedActions)) {
            return response()->json(['error' => 'Acción no válida: ' . ($payload['action'] ?? 'null')], 400);
        }

        $response = Http::post($this->n8nUrl, $payload);

        $json = $response->json();
        if ($json !== null) {
            return response()->json($json, $response->status());
        }

        return response()->json(['error' => 'Error de conexión con n8n'], 500);
    }
}
