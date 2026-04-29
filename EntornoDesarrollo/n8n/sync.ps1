param([string]$Action)

$ContainerName = "n8n"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportDir = Join-Path $ScriptDir "workflows"
$CredentialTemplatePath = Join-Path $ScriptDir "credentials\postgres.auto.json"
$TempExportDir = "/home/node/temp_export"
$TempImportDir = "/home/node/temp_import"
$ProjectId = $env:N8N_PROJECT_ID

function Publish-And-ActivateRepoWorkflows {
    $workflowFiles = Get-ChildItem -Path $ExportDir -Filter "*.json" -File

    foreach ($workflowFile in $workflowFiles) {
        try {
            $workflowJson = Get-Content -LiteralPath $workflowFile.FullName -Raw | ConvertFrom-Json
            if (-not $workflowJson.id) { continue }
            if ($workflowJson.isArchived -eq $true) { continue }

            docker exec $ContainerName n8n publish:workflow --id=$($workflowJson.id) | Out-Null
            docker exec $ContainerName n8n update:workflow --id=$($workflowJson.id) --active=true | Out-Null
            Write-Host "  Activo: $($workflowJson.name) [$($workflowJson.id)]" -ForegroundColor Green
        }
        catch {
            Write-Host "  Error activando $($workflowFile.Name): $_" -ForegroundColor Red
        }
    }
}

if (-not (Test-Path $ExportDir)) {
    New-Item -ItemType Directory -Path $ExportDir | Out-Null
}

$env:COMPOSE_CONVERT_WINDOWS_PATHS = 0

if ($Action -eq "push") {
    Write-Host "Exportando workflows desde n8n..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    docker exec $ContainerName rm -rf $TempExportDir
    docker exec $ContainerName mkdir -p $TempExportDir
    docker exec $ContainerName n8n export:workflow --all --published --separate --pretty --output=$TempExportDir/
    docker cp "${ContainerName}:${TempExportDir}/." "$ExportDir/"

    Write-Host "OK: workflows exportados" -ForegroundColor Green
    Pop-Location
}
elseif ($Action -eq "pull") {
    Write-Host "Bajando cambios de Git..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    git pull

    # Crea automaticamente la credencial Postgres si no existe ninguna.
    $credSql = 'SELECT id FROM credentials_entity WHERE type = ''postgres'' LIMIT 1;'
    $credResult = docker exec postgres_db psql -U admin -d n8n -At -c $credSql 2>$null
    $postgresCredId = ""
    if ($credResult) {
        $postgresCredId = $credResult.Trim()
    }

    if (-not $postgresCredId -and (Test-Path $CredentialTemplatePath)) {
        Write-Host "No hay credencial Postgres. Importando plantilla automatica..." -ForegroundColor Yellow

        $targetProjectId = $ProjectId
        if ([string]::IsNullOrWhiteSpace($targetProjectId)) {
            $projectSql = "SELECT id FROM project ORDER BY id LIMIT 1;"
            $projectResult = docker exec postgres_db psql -U admin -d n8n -At -c $projectSql 2>$null
            if ($projectResult) {
                $targetProjectId = $projectResult.Trim()
            }
        }

        docker cp "$CredentialTemplatePath" "${ContainerName}:/home/node/temp_import_credentials.json" | Out-Null
        if ([string]::IsNullOrWhiteSpace($targetProjectId)) {
            docker exec $ContainerName n8n import:credentials --input=/home/node/temp_import_credentials.json | Out-Null
        }
        else {
            docker exec $ContainerName n8n import:credentials --input=/home/node/temp_import_credentials.json --projectId=$targetProjectId | Out-Null
        }

        $credResult = docker exec postgres_db psql -U admin -d n8n -At -c $credSql 2>$null
        if ($credResult) {
            $postgresCredId = $credResult.Trim()
        }
    }

    # Sanea metadata minima antes de importar para evitar fallos por name NULL.
    $workflowsForImport = Get-ChildItem -Path $ExportDir -Filter "*.json" -File
    $autoNamedCount = 0

    foreach ($workflowFile in $workflowsForImport) {
        try {
            $workflowJson = Get-Content -LiteralPath $workflowFile.FullName -Raw | ConvertFrom-Json

            if (-not $workflowJson.name -or [string]::IsNullOrWhiteSpace([string]$workflowJson.name)) {
                $workflowJson | Add-Member -MemberType NoteProperty -Name "name" -Value $workflowFile.BaseName -Force
                $jsonText = $workflowJson | ConvertTo-Json -Depth 100
                [System.IO.File]::WriteAllText($workflowFile.FullName, $jsonText, (New-Object System.Text.UTF8Encoding($false)))
                $autoNamedCount++
                Write-Host "  Name autogenerado: $($workflowFile.Name) -> '$($workflowFile.BaseName)'" -ForegroundColor Cyan
            }
        }
        catch {
            Write-Host "  Aviso: JSON invalido, se mantiene sin cambios: $($workflowFile.Name)" -ForegroundColor DarkYellow
        }
    }

    if ($autoNamedCount -gt 0) {
        Write-Host "Sanitizado completado: workflows con name autogenerado = $autoNamedCount" -ForegroundColor Cyan
    }

    Write-Host "Importando workflows en n8n..." -ForegroundColor Yellow
    docker exec $ContainerName rm -rf $TempImportDir
    docker exec $ContainerName mkdir -p $TempImportDir
    docker cp "$ExportDir/." "${ContainerName}:${TempImportDir}/"

    if ([string]::IsNullOrWhiteSpace($ProjectId)) {
        docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/ --overwrite
    }
    else {
        docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/ --projectId=$ProjectId --overwrite
    }

    Write-Host "Sincronizando IDs de credenciales postgres..." -ForegroundColor Yellow
    $credResult = docker exec postgres_db psql -U admin -d n8n -At -c $credSql 2>$null
    $postgresCredId = ""
    if ($credResult) {
        $postgresCredId = $credResult.Trim()
    }

    if ($postgresCredId) {
        $workflows = Get-ChildItem -Path $ExportDir -Filter "*.json" -File
        $changedCount = 0

        foreach ($workflow in $workflows) {
            try {
                $json = Get-Content -LiteralPath $workflow.FullName -Raw | ConvertFrom-Json
                $changed = $false

                if ($json.nodes) {
                    foreach ($node in $json.nodes) {
                        if ($node.credentials -and $node.credentials.postgres -and $node.credentials.postgres.id) {
                            if ($node.credentials.postgres.id -ne $postgresCredId) {
                                $node.credentials.postgres.id = $postgresCredId
                                $changed = $true
                            }
                        }
                    }
                }

                if ($changed) {
                    $jsonText = $json | ConvertTo-Json -Depth 100
                    [System.IO.File]::WriteAllText($workflow.FullName, $jsonText, (New-Object System.Text.UTF8Encoding($false)))
                    $changedCount++
                    Write-Host "  OK: $($workflow.Name)" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "  Error procesando $($workflow.Name): $_" -ForegroundColor Red
            }
        }

        if ($changedCount -gt 0) {
            Write-Host "Reimportando workflows con credenciales corregidas..." -ForegroundColor Yellow
            docker exec $ContainerName rm -rf $TempImportDir
            docker exec $ContainerName mkdir -p $TempImportDir
            docker cp "$ExportDir/." "${ContainerName}:${TempImportDir}/"

            if ([string]::IsNullOrWhiteSpace($ProjectId)) {
                docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/ --overwrite
            }
            else {
                docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/ --projectId=$ProjectId --overwrite
            }

            Write-Host "OK: credenciales sincronizadas" -ForegroundColor Green
        }
        else {
            Write-Host "No hubo cambios de credenciales" -ForegroundColor Cyan
        }

        Write-Host "Importacion completada sin publicacion automatica." -ForegroundColor Cyan
    }
    else {
        Write-Host "Aviso: no se encontro credencial postgres en n8n" -ForegroundColor Yellow
    }

    Pop-Location
}
elseif ($Action -eq "publish") {
    Write-Host "Republicando workflows (unpublish + publish)..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    # Obtener todos los workflows registrados en n8n (formato: "id|nombre")
    $n8nList = docker exec $ContainerName n8n list:workflow 2>$null
    $n8nIdByName = @{}
    foreach ($line in $n8nList) {
        if ($line -match '^([^\|]+)\|(.+)$') {
            $n8nIdByName[$Matches[2].Trim()] = $Matches[1].Trim()
        }
    }

    $workflowFiles = Get-ChildItem -Path $ExportDir -Filter "*.json" -File
    $okCount = 0
    $errorCount = 0

    foreach ($workflowFile in $workflowFiles) {
        try {
            $workflowJson = Get-Content -LiteralPath $workflowFile.FullName -Raw | ConvertFrom-Json
            if ($workflowJson.isArchived -eq $true) { continue }

            $resolvedId = $workflowJson.id

            # Si no tiene id en el JSON local, buscar por nombre en n8n
            if (-not $resolvedId -and $workflowJson.name) {
                $resolvedId = $n8nIdByName[$workflowJson.name]
                if ($resolvedId) {
                    Write-Host "  Resolviendo id por nombre para '$($workflowJson.name)': $resolvedId" -ForegroundColor Yellow
                    # Actualizar el JSON local con el id correcto
                    $workflowJson | Add-Member -MemberType NoteProperty -Name "id" -Value $resolvedId -Force
                    $jsonText = $workflowJson | ConvertTo-Json -Depth 100
                    [System.IO.File]::WriteAllText($workflowFile.FullName, $jsonText, (New-Object System.Text.UTF8Encoding($false)))
                }
            }

            if (-not $resolvedId) {
                Write-Host "  Omitido (sin id): $($workflowFile.Name)" -ForegroundColor DarkYellow
                continue
            }

            docker exec $ContainerName n8n unpublish:workflow --id=$resolvedId | Out-Null
            docker exec $ContainerName n8n publish:workflow --id=$resolvedId | Out-Null

            $okCount++
            Write-Host "  Republicado: $($workflowJson.name) [$resolvedId]" -ForegroundColor Green
        }
        catch {
            $errorCount++
            Write-Host "  Error republicando $($workflowFile.Name): $_" -ForegroundColor Red
        }
    }

    Write-Host "OK: republicacion completada. Exitos=$okCount Errores=$errorCount" -ForegroundColor Green
    Pop-Location
}
else {
    Write-Host "Uso: .\sync.ps1 -Action push|pull|publish" -ForegroundColor Yellow
}
