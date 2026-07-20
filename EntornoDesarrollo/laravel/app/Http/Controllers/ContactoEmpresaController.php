<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ContactoEmpresaController extends Controller
{
    private string $n8nUrl;

    public function __construct()
    {
        $this->n8nUrl = env('N8N_WEBHOOK_CONTACTOS_URL', 'http://n8n:5678/webhook/gestion-contactos');
    }

    public function proxy(Request $request)
    {
        $response = Http::post($this->n8nUrl, $request->all());
        return response()->json($response->json(), $response->status());
    }
}
