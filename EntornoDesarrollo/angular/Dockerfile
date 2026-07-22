# --- ETAPA 1: Compilar la interfaz de Angular ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx ng build --configuration=production

# --- ETAPA 2: Servir los archivos estáticos con Nginx en el puerto 8080 ---
FROM nginx:alpine

# Configuración personalizada de Nginx para escuchar en el puerto 8080 de Cloud Run
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos compilados
COPY --from=build /app/dist/mi-panel/browser/ /usr/share/nginx/html/

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
