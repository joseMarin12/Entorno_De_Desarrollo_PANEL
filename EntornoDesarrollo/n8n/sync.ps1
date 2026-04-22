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
elseif ($args[0] -eq "publish") {
    Write-Host "Publicando workflows en lote en n8n..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    $TempPublishDir = "/home/node/temp_publish"

    # 1. Exportar todos los workflows como JSON para poder leer isArchived.
    docker exec $ContainerName rm -rf $TempPublishDir
    docker exec $ContainerName mkdir -p $TempPublishDir
    docker exec $ContainerName n8n export:workflow --all --separate --pretty --output=$TempPublishDir/ | Out-Null

    # 2. Traer los JSONs al host para inspeccionarlos.
    $TempLocalDir = Join-Path $env:TEMP "n8n_publish_check"
    if (Test-Path $TempLocalDir) { Remove-Item -Recurse -Force $TempLocalDir }
    New-Item -ItemType Directory -Path $TempLocalDir | Out-Null
    docker cp "${ContainerName}:${TempPublishDir}/." "$TempLocalDir/"

    $allFiles = Get-ChildItem -Path $TempLocalDir -Filter "*.json" -File

    if (-not $allFiles -or $allFiles.Count -eq 0) {
        Write-Host "No se encontraron workflows para publicar." -ForegroundColor Yellow
        Pop-Location
        exit 0
    }

    $ok = 0
    $fail = 0
    $skipped = 0

    foreach ($file in $allFiles) {
        $content = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
        if (-not $content) { continue }

        # Saltar workflows archivados.
        if ($content.isArchived -eq $true) {
            Write-Host "Saltando '$($content.name)' (archivado)" -ForegroundColor DarkGray
            $skipped++
            continue
        }

        Write-Host "Publicando '$($content.name)' (ID=$($content.id)) ..." -ForegroundColor DarkCyan
        docker exec $ContainerName n8n publish:workflow --id=$($content.id) | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $ok++
        } else {
            $fail++
            Write-Host "No se pudo publicar '$($content.name)' (ID=$($content.id))" -ForegroundColor Red
        }
    }

    # Limpiar temporales.
    Remove-Item -Recurse -Force $TempLocalDir -ErrorAction SilentlyContinue

    Write-Host "Resultado: $ok publicado(s), $skipped archivado(s) omitido(s), $fail con error." -ForegroundColor Green
    Pop-Location
}
else {
    Write-Host "Uso: .\sync.ps1 push | pull | publish"
    Write-Host "Opcional: define N8N_PROJECT_ID para importar en un proyecto concreto."
}