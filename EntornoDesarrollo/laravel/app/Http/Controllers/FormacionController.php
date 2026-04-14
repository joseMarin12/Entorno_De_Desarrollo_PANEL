<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FormacionController extends Controller
{
    private string $n8nBase = 'http://localhost:5678/webhook';

    public function index()
    {
        $response = Http::get("{$this->n8nBase}/formaciones");

        if ($response->failed()) {
            return response()->json(['error' => 'Error al obtener formaciones'], 500);
        }

        return response()->json($response->json());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'curso'    => 'required|string|max:100',
            'id_estado' => 'required|integer',
        ]);

        $response = Http::post("{$this->n8nBase}/formaciones", $request->all());

        if ($response->failed()) {
            return response()->json(['error' => 'Error al crear formación'], 500);
        }

        return response()->json($response->json(), 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'curso'     => 'required|string|max:100',
            'id_estado' => 'required|integer',
        ]);

        $response = Http::put("{$this->n8nBase}/formaciones/{$id}", $request->all());

        if ($response->failed()) {
            return response()->json(['error' => 'Error al actualizar formación'], 500);
        }

        return response()->json($response->json());
    }

    public function destroy(int $id)
    {
        $response = Http::delete("{$this->n8nBase}/formaciones/{$id}");

        if ($response->failed()) {
            return response()->json(['error' => 'Error al eliminar formación'], 500);
        }

        return response()->json(['message' => 'Formación eliminada']);
    }
}