<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator; // 💡 Importante para evitar redirecciones ocultas

public function login(Request $request)
{
    // ⚡ PRUEBA DE FUEGO: Pon esto en la mismísima primera línea y despliega
    die(json_encode(['mensaje' => '¡Hola! El controlador SÍ se está ejecutando.']));


class AutenticadorController extends Controller // ⭐ Nombre corregido para coincidir con tus rutas
{
    public function login(Request $request)
    {
        // 1. Validamos manualmente. Si falla, devolvemos JSON directo en lugar de romper la petición
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Los datos enviados no son válidos.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // 2. Enviamos el email a n8n
            $response = Http::post('https://n8n.srv1128480.hstgr.cloud/webhook/login', [
                'email' => $request->email
            ]);

            // Convertimos la respuesta de n8n a un array de PHP
            $userData = $response->json();

            // 💡 CONTROL DE CAJA NEGRA (n8n): 
            // n8n muchas veces devuelve las respuestas envueltas dentro de una lista: [ { ... } ]
            // Si detectamos que viene un array indexado, extraemos el primer elemento automáticamente.
            if (isset($userData[0]) && is_array($userData[0])) {
                $userData = $userData[0];
            }

            // 3. Verificamos si n8n encontró al usuario o si el servicio falló
            if (empty($userData) || !isset($userData['password'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'El correo electrónico no está registrado.'
                ], 404);
            }

            // 4. Laravel compara la contraseña plana con el Hash proveniente de Supabase vía n8n
            if (Hash::check($request->password, $userData['password'])) {
                
                return response()->json([
                    'success' => true,
                    'message' => '¡Login exitoso!',
                    'redirect' => '/dashboard',
                    'user' => [
                        'name' => $userData['name'] ?? '',
                        'email' => $userData['email'] ?? $request->email
                    ]
                ], 200);
            }

            // Si la contraseña no coincide
            return response()->json([
                'success' => false,
                'message' => 'La contraseña es incorrecta.'
            ], 401);

        } catch (\Exception $e) {
            // Si el webhook de n8n está apagado o da timeout, capturamos el error aquí
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión con el servicio de autenticación.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
}
