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

# Instala Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Habilita módulos de Apache
RUN a2enmod rewrite

# ⭐ CONFIGURACIÓN CRÍTICA PARA CLOUD RUN - Puerto 8080
# 1. Reemplaza Puerto 80 por 8080 en ports.conf
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf

# 2. Reemplaza Puerto 80 por 8080 en configuración de sitios
RUN for file in /etc/apache2/sites-available/*.conf; do \
      sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8080>/' "$file"; \
    done

# Configura document root
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Agrega configuración de directorio
RUN echo '\n<Directory /var/www/html/public/>\n\
    DirectoryIndex index.html index.php\n\
    Options FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Directorio de trabajo
WORKDIR /var/www/html

# Copia archivos
COPY . .

# Crea .env
RUN cp .env.example .env || true

# Instala dependencias de Composer
RUN composer install --no-interaction --optimize-autoloader --no-dev || true

# Genera llave
RUN php artisan key:generate --force || true

# ⭐ CACHEA CONFIGURACIÓN Y RUTAS ANTES DE INICIAR
RUN php artisan config:clear || true
RUN php artisan config:cache || true
RUN php artisan route:clear || true
RUN php artisan route:cache || true

# Permisos
RUN chown -R www-data:www-data /var/www/html || true
RUN chmod -R 755 /var/www/html || true

# Puertos y variables
EXPOSE 8080
ENV PORT=8080
# Inicia Apache
CMD ["apache2-foreground"]
