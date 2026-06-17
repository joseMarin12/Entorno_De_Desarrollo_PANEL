<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiToken
{
    private const JWT_SECRET = 'passEncriptada';

    public function handle(Request $request, Closure $next): Response
    {
        // 1. Permitir siempre las peticiones OPTIONS (CORS pre-flight)
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        // 🔓 REGLA DE EXCEPCIÓN: Si la ruta es /login o api/login, saltarse la validación del token
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

            $payload = $this->verifyJwt($token);

            if ($payload === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido o expirado',
                ], 401);
            }

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
     * Verifica la firma y expiración del token JWT manual.
     */
    private function verifyJwt(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', "$headerB64.$payloadB64", self::JWT_SECRET, true)
        );

        if (!hash_equals($expectedSignature, $signatureB64)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($payloadB64), true);
        if (!$payload || !is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Helpers de codificación Base64 URL Safe
     */
    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
