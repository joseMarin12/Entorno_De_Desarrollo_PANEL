#!/bin/bash

# Configuración basada en tu docker-compose
CONTAINER_NAME="n8n"
EXPORT_DIR="./workflows"
COMMIT_MSG="Sincronización n8n: $(date +'%Y-%m-%d %H:%M:%S')"

mkdir -p $EXPORT_DIR

if [ "$1" == "push" ]; then
    echo "🚀 Exportando flujos desde el contenedor Docker..."
    # Ejecuta el export dentro de Docker y lo guarda en una carpeta temporal del contenedor
    docker exec -t $CONTAINER_NAME n8n export:workflow --all --output=/home/node/.n8n/temp_export/
    
    # Copia los archivos del contenedor a tu carpeta local 'workflows'
    docker cp $CONTAINER_NAME:/home/node/.n8n/temp_export/. $EXPORT_DIR/
    
    # Limpia el contenedor
    docker exec -t $CONTAINER_NAME rm -rf /home/node/.n8n/temp_export/

    echo "📦 Subiendo a Git..."
    git add $EXPORT_DIR/*.json
    git commit -m "$COMMIT_MSG"
    git push
    echo "✅ ¡Hecho! Flujos sincronizados en el repo."

elif [ "$1" == "pull" ]; then
    echo "📥 Trayendo cambios de Git..."
    git pull
    
    echo "🔄 Copiando archivos al contenedor e importando..."
    # Crea carpeta temporal en contenedor y copia los JSON locales
    docker exec -t $CONTAINER_NAME mkdir -p /home/node/.n8n/temp_import/
    docker cp $EXPORT_DIR/. $CONTAINER_NAME:/home/node/.n8n/temp_import/
    
    # Importa los flujos
    docker exec -t $CONTAINER_NAME n8n import:workflow --separate --input=/home/node/.n8n/temp_import/
    
    # Limpieza
    docker exec -t $CONTAINER_NAME rm -rf /home/node/.n8n/temp_import/
    echo "✅ ¡Hecho! Tu n8n local está actualizado."

else
    echo "Uso: ./sync.sh [pull | push]"
fi