FROM n8nio/n8n:latest

# Forzamos el puerto exigido por Google Cloud Run
ENV N8N_PORT=8080
EXPOSE 8080

# Desactivamos restricciones de permisos locales de tu colaborador
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
ENV N8N_DIAGNOSTICS_ENABLED=false

# Copiamos los scripts de sincronización que tiene tu colaborador en esa carpeta
WORKDIR /app
COPY . .
