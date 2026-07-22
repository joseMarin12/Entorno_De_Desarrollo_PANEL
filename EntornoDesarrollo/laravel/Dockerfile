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
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instala Composer de forma global
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Habilita el módulo rewrite de Apache
RUN a2enmod rewrite

# Configuración del Puerto 8080 para Cloud Run
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf
RUN for file in /etc/apache2/sites-available/*.conf; do \
      sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8080>/' "$file"; \
    done

# Configura la carpeta public de Laravel como DocumentRoot
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Habilita permisos y lectura de .htaccess para las rutas de Laravel
RUN echo '\n<Directory /var/www/html/public/>\n\
    DirectoryIndex index.html index.php\n\
    Options FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Directorio de trabajo
WORKDIR /var/www/html

# Copia los archivos del proyecto
COPY . .

# Crea el entorno inicial si no existe
RUN cp .env.example .env || true

# Instala dependencias de PHP
RUN composer install --no-interaction --optimize-autoloader --no-dev || true

# Genera la llave de la aplicación
RUN php artisan key:generate --force || true

# Limpia caché de configuración para recibir variables de GCP en runtime
RUN php artisan config:clear || true
RUN php artisan route:cache || true
RUN php artisan view:cache || true

# Permisos de carpetas para el usuario de Apache
RUN chown -R www-data:www-data /var/www/html /var/www/html/storage /var/www/html/bootstrap/cache || true
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache || true

EXPOSE 8080
ENV PORT=8080

# Arranca Apache en primer plano
CMD ["apache2-foreground"]
