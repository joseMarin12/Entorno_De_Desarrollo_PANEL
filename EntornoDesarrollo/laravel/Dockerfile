FROM php:8.2-cli

# Instala librerías necesarias
RUN apt-get update && apt-get install -y \
    libpq-dev zip unzip git curl \
    && docker-php-ext-install pdo pdo_pgsql

# Trae Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# Crea el entorno básico de Laravel para que no falle al arrancar
RUN cp .env.example .env || true

# Instala los paquetes de código
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Genera la llave de seguridad obligatoria
RUN php artisan key:generate --force

# REGLA DE ORO: Configura el puerto 8080 exigido por Cloud Run
EXPOSE 8080

# Arranca el servidor integrado apuntando al puerto correcto y a la carpeta pública
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]
