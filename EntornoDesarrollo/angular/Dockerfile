# --- ETAPA 1: Compilar la interfaz de Angular ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx ng build --configuration=production

# --- ETAPA 2: Servir los archivos con Nginx en el puerto 8080 ---
FROM nginx:alpine

# Creamos la configuración para que Nginx escuche en el puerto 8080 de Cloud Run
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiamos los archivos que Angular acaba de compilar al servidor web Nginx
# Usamos el nombre 'mi-panel' que encontramos en tu archivo angular.json
COPY --from=build /app/dist/mi-panel/browser/ /usr/share/nginx/html/

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
