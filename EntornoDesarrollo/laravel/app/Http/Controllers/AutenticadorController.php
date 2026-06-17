<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validamos que lleguen los datos del formulario frontend
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        try {
            // 2. Enviamos el email a n8n para que busque al usuario en Supabase
            // Nota: Laravel ya no necesita enviarle la contraseña plana a n8n
            $response = Http::post('https://n8n.srv1128480.hstgr.cloud/webhook/login', [
                'email' => $request->email
            ]);

            // Convertimos la respuesta de n8n a un array de PHP
            $userData = $response->json();

            // 3. Verificamos si n8n encontró al usuario
            // Si llega un array vacío o no viene el campo password, el usuario no existe
            if (empty($userData) || !isset($userData['password'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'El correo electrónico no está registrado.'
                ], 404);
            }

            // 4. LA MAGIA: Laravel compara la contraseña plana con el Hash de Supabase
            // Hash::check toma la clave en texto plano ('admin') y la valida contra el hash ($2a$10$...)
            if (Hash::check($request->password, $userData['password'])) {
                
                // [OPCIONAL] Aquí puedes autenticar al usuario en Laravel, iniciar sesión o generar tu token JWT propio
                // auth()->loginUsingId($userData['id']); 

                return response()->json([
                    'success' => true,
                    'message' => '¡Login exitoso!',
                    'redirect' => '/dashboard',
                    'user' => [
                        'name' => $userData['name'] ?? '',
                        'email' => $userData['email']
                    ]
                ], 200);
            }

            // Si la contraseña no coincide
            return response()->json([
                'success' => false,
                'message' => 'La contraseña es incorrecta.'
            ], 401);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión con el servicio de autenticación.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
