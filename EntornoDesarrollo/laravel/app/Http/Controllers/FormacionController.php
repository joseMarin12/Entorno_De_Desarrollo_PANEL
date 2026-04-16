<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FormacionController extends Controller
{
    private string $n8nUrl = 'http://n8n:5678/webhook/formaciones';
    private string $n8nUrlPut = 'http://n8n:5678/webhook/acdd3a76-1a5b-457a-8ec9-8b81a5ef35e5/formaciones';
    private string $n8nUrlDelete = 'http://n8n:5678/webhook/2c485b24-d491-4e8b-bc3c-13f7b4c2e910/formaciones';

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

        return response()->json(['data' => $response->json()]);
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

        return response()->json(['data' => $response->json()], 201);
    }

    private function update(Request $request)
    {
        $id = $request->input('formacionId');
        $data = $request->input('formacionData', []);

        // Tu n8n usa un webhook PUT en la ruta /formaciones/{id}
        $response = Http::put("{$this->n8nUrlPut}/{$id}", $data);

        if ($response->failed()) {
            return response()->json(['error' => 'Error al actualizar formación'], 500);
        }

        return response()->json(['data' => $response->json()]);
    }

    private function toggle(Request $request)
    {
        $id = $request->input('formacionId');

        // Tu n8n usa un webhook DELETE en la ruta /formaciones/{id} 
        // (que ahora sabemos que internamente hace un Toggle lógico)
        $response = Http::delete("{$this->n8nUrlDelete}/{$id}");

        if ($response->failed()) {
            return response()->json(['error' => 'Error al cambiar estado'], 500);
        }

        return response()->json(['data' => $response->json()]);
    }
}