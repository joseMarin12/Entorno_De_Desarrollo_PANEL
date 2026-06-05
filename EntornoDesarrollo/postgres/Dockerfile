FROM postgres:16

# Copiamos los archivos de inicialización que tiene tu colaborador en su carpeta
COPY ./init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY ./init-n8n-db.sql /docker-entrypoint-initdb.d/02-init-n8n-db.sql

EXPOSE 5432
