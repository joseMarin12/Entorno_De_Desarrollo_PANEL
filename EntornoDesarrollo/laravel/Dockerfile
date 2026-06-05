# Usa la versión oficial de PHP con Apache incluido (Mantiene abierto el puerto de forma nativa)
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

# Habilita el módulo de reescritura de Apache para soportar las rutas de Laravel
RUN a2enmod rewrite

# Configura la carpeta pública de Laravel como la raíz de Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Directorio de trabajo
WORKDIR /var/www/html

# Copiamos los archivos
COPY . .

# Crea el entorno básico si no existe para que no de error
RUN cp .env.example .env || true

# Instala las dependencias de código
RUN composer install --no-interaction --optimize-autoloader --no-dev || true

# Genera la llave de seguridad obligatoria
RUN php artisan key:generate --force || true

# Da permisos correctos a las carpetas de almacenamiento para Apache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true

# Configuración obligatoria del puerto 8080 para Cloud Run
EXPOSE 8080
ENV PORT 8080
RUN sed -i "s/Listen 80/Listen 8080/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

CMD ["apache2-foreground"]
