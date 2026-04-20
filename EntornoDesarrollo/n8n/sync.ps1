# Configuración
$ContainerName = "n8n"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportDir = Join-Path $ScriptDir "workflows"
$TempExportDir = "/home/node/temp_export"
$TempImportDir = "/home/node/temp_import"
$ProjectId = $env:N8N_PROJECT_ID

# Crear carpeta local si no existe
if (-not (Test-Path $ExportDir)) {
    New-Item -ItemType Directory -Path $ExportDir | Out-Null
}

# Desactivar conversion de rutas para Docker en Windows
$env:COMPOSE_CONVERT_WINDOWS_PATHS = 0

if ($args[0] -eq "push") {
    Write-Host "Exportando flujos desde Docker..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    # 1. Preparar contenedor (limpieza profunda)
    docker exec $ContainerName rm -rf $TempExportDir
    docker exec $ContainerName mkdir -p $TempExportDir
    
    # 2. Exportar solo workflows publicados/activos (excluye archivados)
    docker exec $ContainerName n8n export:workflow --all --published --separate --pretty --output=$TempExportDir/
    
    # 3. Traer archivos a la carpeta local workflows
    docker cp "${ContainerName}:${TempExportDir}/." "$ExportDir/"

    # 4. Renombrar cada archivo usando el campo 'name' del JSON.
    # Si el nombre ya existe, se sobreescribe (se considera una actualizacion del mismo flujo).
    Get-ChildItem -Path $ExportDir -Filter "*.json" -File | ForEach-Object {
        $jsonText = Get-Content -LiteralPath $_.FullName | Out-String
        $content = $jsonText | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($content -and $content.name) {
            $safeName = $content.name -replace '[\\/:*?"<>|]', '_'
            $newPath = Join-Path $ExportDir "$safeName.json"

            if ($_.FullName -ne $newPath) {
                Move-Item -LiteralPath $_.FullName -Destination $newPath -Force
            }
        }
    }
    
    $jsonFiles = Get-ChildItem -Path $ExportDir -Filter "*.json" -File -ErrorAction SilentlyContinue

    if ($jsonFiles) {
        Write-Host "Hecho: $($jsonFiles.Count) workflow(s) exportados en '$ExportDir'." -ForegroundColor Green
        Write-Host "Recuerda hacer git add/commit/push manualmente cuando estes listo." -ForegroundColor Yellow
    } else {
        Write-Host "Error: No se generaron archivos JSON. Revisa los logs de n8n." -ForegroundColor Red
    }

    Pop-Location
}
elseif ($args[0] -eq "pull") {
    Write-Host "Bajando de Git..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    git pull
    
    Write-Host "Importando a n8n..." -ForegroundColor Yellow
    docker exec $ContainerName rm -rf $TempImportDir
    docker exec $ContainerName mkdir -p $TempImportDir
    docker cp "$ExportDir/." "${ContainerName}:${TempImportDir}/"

    # Si cada developer usa proyecto distinto, define N8N_PROJECT_ID antes de ejecutar.
    if ([string]::IsNullOrWhiteSpace($ProjectId)) {
        docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/
        Write-Host "Hecho: n8n actualizado con los flujos del repo (proyecto por defecto)." -ForegroundColor Green
    } else {
        docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/ --projectId=$ProjectId
        Write-Host "Hecho: n8n actualizado con los flujos del repo en projectId=$ProjectId." -ForegroundColor Green
    }

    Pop-Location
}
else {
    Write-Host "Uso: .\sync.ps1 push o pull"
    Write-Host "Opcional: define N8N_PROJECT_ID para importar en un proyecto concreto."
}