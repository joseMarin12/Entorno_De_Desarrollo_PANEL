<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AutenticadorController extends Controller 
{
    public function login(Request $request)
    {
        // 1. Validar que la petición traiga los datos obligatorios
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de ingreso incompletos o inválidos.',
                'errors'  => $validator->errors()
            ], 400);
        }

        try {
            // 2. Hacer la petición a tu webhook de n8n
            $response = Http::post('https://n8n.srv1128480.hstgr.cloud/webhook/login', [
                'email'    => $request->email,
                'password' => $request->password
            ]);

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El servicio de autenticación externo no respondió correctamente.'
                ], 502);
            }

            $data_n8n = $response->json();

            // Validamos directamente si n8n dice que el login fue exitoso
            if (empty($data_n8n) || !isset($data_n8n['success']) || $data_n8n['success'] !== true) {
                return response()->json([
                    'success' => false,
                    'message' => 'El correo electrónico o la contraseña son incorrectos.'
                ], 401); 
            }

            // 🚀 CAPTURAMOS EL VALOR REAL DE N8N (Si no viene, por defecto es false)
            $firstLogin = $data_n8n['firstLogin'] ?? false;

            // Extraemos los datos del usuario desde el objeto 'user' que envía n8n
            $userPayload = $data_n8n['user'] ?? [];

            // Mapeamos la información limpia para construir el JWT de la API
            $userData = [
                'id'      => $userPayload['id'] ?? null,
                'name'    => $userPayload['name'] ?? '',
                'surname' => $userPayload['surname'] ?? '',
                'email'   => $userPayload['email'] ?? '',
                'roleid'  => $userPayload['roleid'] ?? ($data_n8n['roleid'] ?? 1)
            ];

            // 🚀 PASAMOS EL VALOR REAL AL JWT MANUAL
            $token = $this->generateManualJwt($userData, $firstLogin);

            // 5. LOGIN EXITOSO (Ahora Angular sí recibe el parámetro en la raíz)
            return response()->json([
                'success'    => true,
                'message'    => 'Autenticación exitosa.',
                'user'       => $userData,
                'token'      => $token,
                'firstLogin' => $firstLogin // 🚀 ¡AQUÍ ESTÁ EL CAMBIO PARA EL FRONTEND!
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error interno en el controlador de Laravel.',
                'error_developer' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Genera un token JWT manual compatible con VerifyApiToken
     * 🚀 Se modificó para recibir el parámetro $firstLogin dinámicamente
     */
    private function generateManualJwt(array $user, bool $firstLogin): string
    {
        $secret = env('JWT_SECRET', 'passEncriptada'); 

        $header = json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT'
        ]);

        $payload = json_encode([
            'id'         => $user['id'],
            'email'      => $user['email'],
            'role'       => $user['roleid'] ?? 2, 
            'exp'        => time() + (60 * 60 * 24), // Expiración en 24 horas
            'firstLogin' => $firstLogin // 🚀 YA NO ESTÁ EN FALSE FIJO, toma el valor real
        ]);

        $headerB64   = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $payloadB64  = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');

        $signature    = hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true);
        $signatureB64 = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        return "$headerB64.$payloadB64.$signatureB64";
    }
}
