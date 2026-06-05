# === ETAPA 1: Compilar la interfaz de Angular ===
FROM node:18-alpine AS angular-build
WORKDIR /app
COPY ./angular/package*.json ./
RUN npm ci
COPY ./angular/ .
RUN npm run build -- --configuration=production

# === ETAPA 2: Configurar el servidor de Laravel (Apache + PHP) ===
FROM php:8.2-apache

# Instala extensiones necesarias para Laravel y bases de datos
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libpq-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql pdo_pgsql pgsql gd \
    && apt-get clean && rm -rf /var/lib/lists/*

# Instala Composer de forma global
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Habilita el módulo de reescritura de Apache
RUN a2enmod rewrite

# Configura la carpeta pública de Laravel como la raíz de Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Directorio de trabajo en el servidor
WORKDIR /var/www/html

# Copiamos el contenido del Backend de Laravel
COPY ./laravel/ .

# Borramos el Dockerfile interno viejo si existe para evitar choques
RUN rm -f ./Dockerfile

# Creamos el archivo .env desde el ejemplo para que Laravel no falle
RUN cp .env.example .env

# Instala las dependencias de código de Laravel
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Genera la llave de seguridad obligatoria de Laravel
RUN php artisan key:generate

# --- AQUÍ OCURRE LA MAGIA DEL PROYECTO UNIFICADO ---
# Copiamos todo lo que compile Angular a una carpeta temporal interna
COPY --from=angular-build /app/dist/ /tmp/angular-dist/

# Movemos los archivos de la subcarpeta interna directamente a la raíz pública de Laravel
RUN cp -r /tmp/angular-dist/*/. /var/www/html/public/ 2>/dev/null || cp -r /tmp/angular-dist/* /var/www/html/public/

# Configuración de puertos requerida por Google Cloud Run
EXPOSE 8080
ENV PORT 8080
RUN sed -i "s/Listen 80/Listen 8080/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

CMD ["apache2-foreground"]
