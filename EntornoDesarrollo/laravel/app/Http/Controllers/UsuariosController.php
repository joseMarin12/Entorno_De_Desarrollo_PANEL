<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UsuariosController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        // URL corregida según tu configuración real en Hostinger
        $this->n8nUrl = env('N8N_WEBHOOK_USUARIOS_URL', 'https://n8n.srv1128480.hstgr.cloud/webhook/usuarios');
    }

    /**
     * Proxy genérico: reenvía la acción + datos a n8n con cabeceras CORS forzadas
     */
    public function proxy(Request $request)
    {
        // Reenvío seguro del payload a la URL exacta de n8n
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->post($this->n8nUrl, $request->all());

        // Retornamos la respuesta inyectando los encabezados CORS requeridos por Cloud Run y Angular
        return response()->json($response->json(), $response->status())
            ->header('Access-Control-Allow-Origin', 'https://panel-frontend-1079064952465.us-central1.run.app')
            ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Token-Auth')
            ->header('Access-Control-Allow-Credentials', 'true');
    }
}
