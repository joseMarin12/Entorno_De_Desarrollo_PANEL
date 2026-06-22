public function proxy(Request $request)
    {
        try {
            $token = $request->header('Authorization');

            // Preparamos el cliente HTTP con las cabeceras básicas
            $client = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ]);

            // Si el frontend envía un Token, se lo inyectamos al cliente
            if ($token) {
                $client = $client->withHeaders(['Authorization' => $token]);
            }

            // Capturamos todos los datos que vienen desde el formulario de Angular
            $data = $request->all();

            // Verificamos si viene una contraseña y no está vacía para encriptarla
            if (isset($data['password']) && trim($data['password']) !== '') {
                $data['password'] = Hash::make($data['password']);
            }

            // 🌟 LE AGREGAMOS UN TIMEOUT (Si Hostinger no responde en 15 segundos, cancela en vez de colgarse)
            $response = $client->timeout(15)->post($this->n8nTrabajadoresUrl, $data);

            // 🌟 VALIDACIÓN DE RESPUESTA: n8n suele responder texto plano si el flujo está vacío
            $responseData = $response->json();
            if (is_null($responseData)) {
                // Si n8n devolvió texto plano, lo envolvemos en un formato JSON amigable para Angular
                $responseData = ['message' => $response->body() ?: 'Petición procesada por n8n'];
            }

            return response()->json($responseData, $response->status());

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            // Captura si Hostinger está caído, el webhook está desactivado o bloquea a Cloud Run
            return response()->json([
                'error' => 'No se pudo conectar con el servidor de n8n en Hostinger',
                'details' => $e->getMessage()
            ], 502); // 502 Bad Gateway es el error correcto aquí

        } catch (\Throwable $e) {
            // Captura cualquier otro error interno de PHP/Laravel y te lo muestra en Angular
            return response()->json([
                'error' => 'Error interno en el TrabajadorController de Laravel',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
