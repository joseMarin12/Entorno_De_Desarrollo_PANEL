<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiToken
{
    // 🔒 Asegúrate de que el sistema que emite el token use exactamente este mismo secreto
    private const JWT_SECRET = 'passEncriptada';

    public function handle(Request $request, Closure $next): Response
    {
        // 1. Permitir siempre las peticiones OPTIONS (CORS pre-flight)
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        // 🔓 REGLA DE EXCEPCIÓN: Si la ruta es /login o api/login, saltarse la validación
        if ($request->is('login') || $request->is('api/login')) {
            return $next($request);
        }

        // Acciones que no requieren token (para endpoints basados en el parámetro 'action')
        $publicActions = ['getRole'];
        $action = $request->input('action');

        if (!in_array($action, $publicActions)) {
            // Intentar obtener el token del header Authorization o del body
            $token = $request->bearerToken() ?: $request->input('token');

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token no proporcionado',
                ], 401);
            }

            // Validar token de forma detallada
            $validation = $this->verifyJwtDetailed($token);

            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido o expirado',
                    'error_reason' => $validation['reason'] // 🌟 Revela la causa exacta en la consola de red
                ], 401);
            }

            $payload = $validation['payload'];

            // Inyectar los datos decodificados en la petición para n8n o controladores internos
            $request->merge([
                'authenticated_user_id' => $payload['id'] ?? null,
                'authenticated_user_email' => $payload['email'] ?? null,
                'authenticated_user_role' => $payload['role'] ?? null,
                'token' => $token
            ]);
        }

        return $next($request);
    }

    /**
     * Verifica la firma y expiración del token JWT manual con rastreo de errores.
     */
    private function verifyJwtDetailed(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return ['valid' => false, 'reason' => 'El token no tiene la estructura JWT de 3 partes.'];
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        // 1. Validar Firma Mecánica
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', "$headerB64.$payloadB64", self::JWT_SECRET, true)
        );

        if (!hash_equals($expectedSignature, $signatureB64)) {
            return [
                'valid' => false, 
                'reason' => 'La firma no coincide. El JWT_SECRET del backend difiere del emisor del token.'
            ];
        }

        // 2. Decodificar el Payload JSON
        $payloadJson = $this->base64UrlDecode($payloadB64);
        $payload = json_decode($payloadJson, true);
        if (!$payload || !is_array($payload)) {
            return ['valid' => false, 'reason' => 'El payload del token no es un JSON válido o está corrupto.'];
        }

        // 3. Validar Expiración con margen de tiempo (Leeway) para prevenir desincronizaciones
        if (isset($payload['exp'])) {
            $leeway = 60; // 60 segundos de tolerancia
            if (($payload['exp'] + $leeway) < time()) {
                return [
                    'valid' => false, 
                    'reason' => 'Token expirado. Exp: ' . $payload['exp'] . ' | Hora Servidor: ' . time()
                ];
            }
        }

        return ['valid' => true, 'payload' => $payload];
    }

    /**
     * Helpers de codificación Base64 URL Safe robustos
     */
    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        // Añadir de nuevo el padding de caracteres "=" si la longitud no es múltiplo de 4
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
