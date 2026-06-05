# --- ETAPA 1: Compilar la aplicación de Angular ---
FROM node:18-alpine AS build
WORKDIR /app

# Copiamos los archivos de configuración de Angular
COPY ./angular/package*.json ./

# Instalamos las dependencias de Angular
RUN npm ci

# Copiamos todo el código de la carpeta angular
COPY ./angular/ .

# Compilamos el proyecto para producción
RUN npm run build -- --configuration=production

# --- ETAPA 2: Servir la aplicación con Nginx ---
FROM nginx:alpine

# Copiamos la configuración de Nginx para soportar rutas de Angular
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados de Angular al servidor web
# NOTA: Revisa si tu proyecto compila dentro de una subcarpeta (ej. dist/tu-app-name)
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
