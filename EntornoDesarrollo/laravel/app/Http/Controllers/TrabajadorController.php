<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash; // <-- 1. Importamos la clase Hash de Laravel

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

        // Preparamos el cliente HTTP con las cabeceras básicas
        $client = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ]);

        // Si el frontend envía un Token, se lo inyectamos al cliente
        if ($token) {
            $client = $client->withHeaders(['Authorization' => $token]);
        }

        // 2. Capturamos todos los datos que vienen desde el formulario de Angular
        $data = $request->all();

        // 3. Verificamos si viene una contraseña y no está vacía para encriptarla
        if (isset($data['password']) && trim($data['password']) !== '') {
            $data['password'] = Hash::make($data['password']);
        }

        // Reenvío de la petición a n8n con los datos YA encriptados de forma segura
        $response = $client->post($this->n8nTrabajadoresUrl, $data);

        return response()->json($response->json(), $response->status());
    }
}
