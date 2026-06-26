<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AsignacionController extends Controller
{
    // 🚀 URL de producción actualizada correctamente
    private string $n8nUrl = 'https://n8n.srv1128480.hstgr.cloud/webhook/asignaciones';

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

        // 🔒 INYECCIÓN DE SEGURIDAD:
        // Añadimos al payload los datos del usuario que el middleware VerifyApiToken ya validó.
        $payload['auth_user'] = [
            'id'    => $request->input('authenticated_user_id'),
            'email' => $request->input('authenticated_user_email'),
            'role'  => $request->input('authenticated_user_role')
        ];

        // Se envía la petición directamente al webhook en Hostinger
        $response = Http::post($this->n8nUrl, $payload);

        $json = $response->json();
        if ($json !== null) {
            return response()->json($json, $response->status());
        }

        return response()->json(['error' => 'Error de conexión con n8n'], 500);
    }
}
