<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FormacionController extends Controller
{

    private string $n8nUrl = 'http://n8n:5678/webhook/gestion-formaciones';

    public function proxy(Request $request)
    {
        $payload = $request->all();

        $allowedActions = ['getFormaciones', 'createFormacion', 'updateFormacion', 'toggleFormacionStatus', 'getTrabajadores', 'addTrabajadorToFormacion', 'removeTrabajadorFromFormacion'];

        if (!in_array($payload['action'], $allowedActions)) {
            return response()->json(['error' => 'Acción no válida: ' . ($payload['action'] ?? 'null')], 400);
        }

        $response = Http::post($this->n8nUrl, $payload);

        if ($response->failed()) {
            return response()->json(['error' => 'Error de respuesta en n8n'], 500);
        }

        return response()->json($response->json(), $response->status());
    }
}