FROM n8nio/n8n:latest

# Forzamos al contenedor a correr como usuario administrador (Root)
# Esto es obligatorio en Cloud Run para que n8n acepte cambiar su puerto nativo
USER root

# Cambiamos el puerto al 8080 universal de Google Cloud
ENV PORT=8080
ENV N8N_PORT=8080
EXPOSE 8080
