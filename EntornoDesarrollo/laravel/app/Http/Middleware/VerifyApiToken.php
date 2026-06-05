<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiToken
{
    /**
     * Secreto compartido con n8n para firmar/verificar el JWT.
     * Debe coincidir con JWT_HASH en el nodo "verificarEmail" de n8n.
     */
    private const JWT_SECRET = 'passEncriptada';

    /**
     * Valida el JWT que Angular envía en el body de cada petición.
     * El token fue generado por n8n tras un login exitoso.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Acciones que no requieren token
        $publicActions = ['getRole'];

        $action = $request->input('action');

        if (!in_array($action, $publicActions)) {
            // Intentar obtener del header Authorization primero
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

            // Inyectar datos del usuario autenticado y el token (para n8n) en el request
            $request->merge([
                'authenticated_user_id' => $payload['id'] ?? null,
                'authenticated_user_email' => $payload['email'] ?? null,
                'authenticated_user_role' => $payload['role'] ?? null,
                'token' => $token // Lo volvemos a poner en el body para que n8n lo reciba
            ]);
        }

        return $next($request);
    }

    /**
     * Decodifica y verifica un JWT firmado con HS256.
     * Retorna el payload como array asociativo, o null si es inválido.
     */
    private function verifyJwt(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        // Verificar firma SHA256
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

        // Comprobar expiración
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
