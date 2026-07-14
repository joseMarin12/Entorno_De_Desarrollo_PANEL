<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DireccionesEmpresaController extends Controller
{
    // 🚀 URL de producción de n8n en Hostinger para gestión de direcciones
    private string $n8nUrl = 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-direcciones';

    /**
     * Proxy genérico: valida, inyecta seguridad y reenvía la acción + datos a n8n
     */
    public function proxy(Request $request)
    {
        $payload = $request->all();

        // 📋 Lista de acciones permitidas desde tu servicio de Angular
        $allowedActions = [
            'getDirecciones',
            'getPaises',
            'getProvincias',
            'getLocalidades',
            'createDireccion',
            'updateDireccion',
            'toggleDireccionStatus'
        ];

        // Validación de la acción entrante
        if (!isset($payload['action']) || !in_array($payload['action'], $allowedActions)) {
            return response()->json(['error' => 'Acción de dirección no válida: ' . ($payload['action'] ?? 'null')], 400);
        }

        // 🔒 INYECCIÓN DE SEGURIDAD AUDITABLE:
        // Añadimos al payload los datos del usuario que tu middleware VerifyApiToken ya validó.
        $payload['auth_user'] = [
            'id'    => $request->input('authenticated_user_id'),
            'email' => $request->input('authenticated_user_email'),
            'role'  => $request->input('authenticated_user_role')
        ];

        // Envío seguro hacia la nube de Hostinger
        $response = Http::post($this->n8nUrl, $payload);

        $json = $response->json();
        if ($json !== null) {
            return response()->json($json, $response->status());
        }

        return response()->json(['error' => 'Error de conexión con el webhook de direcciones en n8n'], 500);
    }
}
