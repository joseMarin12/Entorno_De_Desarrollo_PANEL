# Usa la versión oficial de PHP con Apache incluido
FROM php:8.2-apache

# Instala extensiones necesarias para Laravel y Postgres
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

# Habilita módulos de Apache
RUN a2enmod rewrite

# CONFIGURACIÓN CRÍTICA: Escuchar en puerto 8080 ANTES de cualquier otra cosa
RUN mkdir -p /etc/apache2/ports.d && \
    echo "Listen 8080" > /etc/apache2/ports.d/custom.conf && \
    sed -i 's/^Listen 80$/# Listen 80 disabled/' /etc/apache2/ports.conf

# Configura la carpeta pública de Laravel como la raíz de Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

RUN echo '<Directory /var/www/html/public/> \n\
    DirectoryIndex index.html index.php \n\
    Options FollowSymLinks \n\
    AllowOverride All \n\
    Require all granted \n\
</Directory>' >> /etc/apache2/apache2.conf

# Directorio de trabajo
WORKDIR /var/www/html

# Copia archivos
COPY . .

# Crea .env si no existe
RUN cp .env.example .env || true

# Instala dependencias
RUN composer install --no-interaction --optimize-autoloader --no-dev || true

# Genera la llave
RUN php artisan key:generate --force || true

# ⭐ CACHEA CONFIGURACIÓN Y RUTAS
RUN php artisan config:clear || true
RUN php artisan config:cache || true
RUN php artisan route:clear || true
RUN php artisan route:cache || true

# Permisos
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true
RUN chown -R www-data:www-data /var/www/html || true

# Asegura que Apache escuche en 8080
ENV PORT=8080
EXPOSE 8080

CMD ["apache2-foreground"]
