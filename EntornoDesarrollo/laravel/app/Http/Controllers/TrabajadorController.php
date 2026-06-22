<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TrabajadorController extends Controller
{
    private string $n8nTrabajadoresUrl;

    public function __construct()
    {
        // Vinculamos directamente tu webhook de n8n Hostinger
        $this->n8nTrabajadoresUrl = 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-trabajadores';
    }

    public function proxy(Request $request)
    {
        $token = $request->header('Authorization');

        $client = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ]);

        if ($token) {
            $client->withHeaders(['Authorization' => $token]);
        }

        // Reenvío inmediato a n8n
        $response = $client->post($this->n8nTrabajadoresUrl, $request->all());

        return response()->json($response->json(), $response->status());
    }
}
