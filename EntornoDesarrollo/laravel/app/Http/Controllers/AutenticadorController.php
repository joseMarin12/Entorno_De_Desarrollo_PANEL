<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
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

            // Si n8n responde con un error HTTP (4xx o 5xx)
            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El servicio de autenticación externo no respondió correctamente.'
                ], 502);
            }

            // VARIABLE CORREGIDA: Sin espacios en blanco
            $data_n8n = $response->json();

            // 3. Verificar si n8n encontró al usuario
            if (empty($data_n8n) || !isset($data_n8n['password'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'El correo electrónico no está registrado o no es válido.'
                ], 404);
            }

            // 4. Validar la contraseña usando el Hash que nos dio n8n
            if (!password_verify($request->password, $data_n8n['password'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña ingresada es incorrecta.'
                ], 401);
            }

            // 🌟 Estructurar la información limpia del usuario
            $userData = [
                'id'      => $data_n8n['id'] ?? null,
                'name'    => $data_n8n['name'] ?? '',
                'surname' => $data_n8n['surname'] ?? '',
                'email'   => $data_n8n['email'] ?? '',
                'roleid'  => $data_n8n['roleid'] ?? null
            ];

            // 🌟 GENERAR EL JWT MANUAL (Firmado y encriptado con tu frase secreta)
            $token = $this->generateManualJwt($userData);

            // 5. LOGIN EXITOSO: Devolvemos los datos del usuario Y EL JWT al frontend
            return response()->json([
                'success' => true,
                'message' => 'Autenticación exitosa.',
                'user'    => $userData,
                'token'   => $token // 🚀 ¡Token JWT adjuntado con éxito!
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
     * Genera un token JWT manual con estructura de 3 partes compatible con VerifyApiToken
     */
    private function generateManualJwt(array $user): string
    {
        // 🔒 Clave secreta exacta del Middleware del Backend
        $secret = 'passEncriptada'; 

        // Cabecera estándar del JWT
        $header = json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT'
        ]);

        // Estructura interna del Token (Contenido útil o Claims)
        $payload = json_encode([
            'id'         => $user['id'],
            'email'      => $user['email'],
            'role'       => $user['roleid'] ?? 2, 
            'exp'        => time() + (60 * 60 * 24), // El token expira automáticamente en 24 horas
            'firstLogin' => false
        ]);

        // Adaptación Base64 compatible con transporte URL seguro (Base64UrlEncode)
        $headerB64   = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $payloadB64  = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');

        // Generar la firma criptográfica HMAC-SHA256 combinando cabecera y contenido
        $signature    = hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true);
        $signatureB64 = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        // Unificar las 3 partes reglamentarias separadas por puntos reales
        return "$headerB64.$payloadB64.$signatureB64";
    }
}
