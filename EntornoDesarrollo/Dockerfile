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
RUN composer install --no-interaction --optimize-autoloader --no-dev
RUN php artisan key:generate --force

# --- UNIFICACIÓN BUSCADORA DESDE LA NUEVA RUTA ---
RUN mkdir -p /tmp/angular-dist
COPY --from=angular-build /app/angular/dist/ /tmp/angular-dist/
RUN TARGET_DIR=$(find /tmp/angular-dist -name "index.html" -exec dirname {} \; | head -n 1) && \
    if [ -n "$TARGET_DIR" ]; then \
        cp -r $TARGET_DIR/* /var/www/html/public/; \
    fi

RUN chown -R www-data:www-data /var/www/html /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8080
ENV PORT 8080
RUN sed -i "s/Listen 80/Listen 8080/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

# Comando nativo y correcto para iniciar Apache en Cloud Run
CMD ["apache2-foreground"]
