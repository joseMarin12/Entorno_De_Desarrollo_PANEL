# === ETAPA 1: Compilar la interfaz de Angular 17 ===
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

# Configurar Apache para que lea index.html primero y otorgar permisos totales
RUN echo '<Directory /var/www/html/public/> \n\
    DirectoryIndex index.html index.php \n\
    Options FollowSymLinks \n\
    AllowOverride All \n\
    Require all granted \n\
</Directory>' >> /etc/apache2/apache2.conf

# Directorio de trabajo en el servidor
WORKDIR /var/www/html

# Copiamos el contenido del Backend de Laravel
COPY ./laravel/ .

# Borramos el Dockerfile interno viejo si existe
RUN rm -f ./Dockerfile

# Creamos el archivo .env desde el ejemplo
RUN cp .env.example .env

# Instala las dependencias de código de Laravel
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Genera la llave de seguridad obligatoria de Laravel
RUN php artisan key:generate

# --- UNIFICACIÓN BUSCADORA ---
# Buscamos dónde quedó el index.html dentro de dist/ y copiamos su contenido directo a public/
RUN mkdir -p /tmp/angular-dist
COPY --from=angular-build /app/dist/ /tmp/angular-dist/
RUN TARGET_DIR=$(find /tmp/angular-dist -name "index.html" -exec dirname {} \; | head -n 1) && \
    if [ -n "$TARGET_DIR" ]; then \
        cp -r $TARGET_DIR/* /var/www/html/public/; \
    fi

# Da permisos correctos a todas las carpetas del proyecto para Apache
RUN chown -R www-data:www-data /var/www/html /var/www/html/storage /var/www/html/bootstrap/cache

# Configuración de puertos requerida por Google Cloud Run
EXPOSE 8080
ENV PORT 8080
RUN sed -i "s/Listen 80/Listen 8080/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

CMD ["apache2-foreground"]
