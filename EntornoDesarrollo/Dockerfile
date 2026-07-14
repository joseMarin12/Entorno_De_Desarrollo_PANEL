# === ETAPA 1: Compilar la interfaz de Angular 17 ===
FROM node:18-alpine AS angular-build
WORKDIR /app
COPY . .
WORKDIR /app/angular
RUN npm ci
RUN npm run build -- --configuration=production

# === ETAPA 2: Configurar el servidor de Laravel (Apache + PHP) ===
FROM php:8.2-apache

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

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN a2enmod rewrite

ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

RUN echo '<Directory /var/www/html/public/> \n\
    DirectoryIndex index.html index.php \n\
    Options FollowSymLinks \n\
    AllowOverride All \n\
    Require all granted \n\
</Directory>' >> /etc/apache2/apache2.conf

WORKDIR /var/www/html
COPY ./laravel/ .
RUN rm -f ./Dockerfile
RUN cp .env.example .env || true
RUN composer install --no-interaction --optimize-autoloader --no-dev --no-scripts
RUN php artisan key:generate --force

# --- UNIFICACIÓN CON LA RUTA REAL QUE ENCONTRAMOS ---
# Copiamos directamente los archivos de Angular 17 a la carpeta pública que lee Apache
COPY --from=angular-build /app/angular/dist/mi-panel/browser/ /var/www/html/public/

# Asignamos permisos correctos del sistema operativo para evitar el error Forbidden
RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html

EXPOSE 8080
ENV PORT 8080
RUN sed -i "s/Listen 80/Listen 8080/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

CMD ["apache2-foreground"]
