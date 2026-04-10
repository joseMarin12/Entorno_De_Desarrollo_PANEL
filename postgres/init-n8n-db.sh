#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" -c "CREATE DATABASE n8n;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" -c "GRANT ALL PRIVILEGES ON DATABASE n8n TO $POSTGRES_USER;"