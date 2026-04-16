<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FormacionController extends Controller
{
    private string $n8nUrl = 'http://n8n:5678/webhook/formaciones';

    // 1. El método proxy que te faltaba y que llama api.php
    public function proxy(Request $request)
    {
        $action = $request->input('action');

        // Dependiendo de lo que pida Angular, llamamos a una función u otra
        return match ($action) {
            'getAll'       => $this->index($request),
            'create'       => $this->store($request),
            'update'       => $this->update($request),
            'toggleStatus' => $this->toggle($request),
            default        => response()->json(['error' => 'Acción no válida: ' . $action], 400),
        };
    }

    private function index(Request $request)
    {
        // Tu n8n usa un webhook GET para obtener los datos
        $response = Http::get($this->n8nUrl);

        if ($response->failed()) {
            return response()->json(['error' => 'Error al obtener formaciones'], 500);
        }

        return response()->json($response->json());
    }

    private function store(Request $request)
    {
        // Extraemos los datos del envoltorio que manda Angular
        $data = $request->input('formacionData', []);

        // Tu n8n usa un webhook POST para crear
        $response = Http::post($this->n8nUrl, $data);

        if ($response->failed()) {
            return response()->json(['error' => 'Error al crear formación'], 500);
        }

        return response()->json($response->json(), 201);
    }

    private function update(Request $request)
    {
        $id = $request->input('formacionId');
        $data = $request->input('formacionData', []);

        // Tu n8n usa un webhook PUT en la ruta /formaciones/{id}
        $response = Http::put("{$this->n8nUrl}/{$id}", $data);

        if ($response->failed()) {
            return response()->json(['error' => 'Error al actualizar formación'], 500);
        }

        return response()->json($response->json());
    }

    private function toggle(Request $request)
    {
        $id = $request->input('formacionId');

        // Tu n8n usa un webhook DELETE en la ruta /formaciones/{id} 
        // (que ahora sabemos que internamente hace un Toggle lógico)
        $response = Http::delete("{$this->n8nUrl}/{$id}");

        if ($response->failed()) {
            return response()->json(['error' => 'Error al cambiar estado'], 500);
        }

        return response()->json($response->json());
    }
}