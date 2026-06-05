# Usa la imagen oficial de PHP con Apache
FROM php:8.2-apache

# Instala extensiones necesarias para Laravel y limpia caché
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql gd \
    && apt-get clean && rm -rf /var/lib/lists/*

# Habilita el módulo de reescritura de Apache para Laravel
RUN a2enmod rewrite

# Configura la carpeta pública de Laravel como la raíz de Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copia los archivos del proyecto al contenedor
WORKDIR /var/www/html
COPY . .

# Da permisos correctos a las carpetas de Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expone el puerto 8080 para Cloud Run
EXPOSE 8080
ENV PORT 8080

# Modifica el puerto de Apache para que escuche en el 8080
RUN sed -i "s/Listen 80/Listen 8080/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

CMD ["apache2-foreground"]
