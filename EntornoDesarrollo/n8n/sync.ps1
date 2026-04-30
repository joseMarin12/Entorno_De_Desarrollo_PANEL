param([string]$Action)

$ContainerName = "n8n"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceWorkflowsDir = Join-Path $ScriptDir "workflows"
$RuntimeWorkflowsDir = Join-Path $ScriptDir "workflows_runtime"
$CredentialTemplatePath = Join-Path $ScriptDir "credentials\postgres.auto.json"
$TempExportDir = "/home/node/temp_export"
$TempImportDir = "/home/node/temp_import"
$ProjectId = $env:N8N_PROJECT_ID

function Publish-And-ActivateRepoWorkflows {
    $workflowFiles = Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File

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

function Normalize-WorkflowValue {
    param(
        [object]$Value,
        [string[]]$FieldsToIgnore,
        [string]$Path = '$'
    )

    if ($null -eq $Value) { return $null }

    if ($Value -is [string]) { return (Normalize-ComparableText -Text $Value -Path $Path) }

    if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [string] -and $Value -isnot [System.Collections.IDictionary]) {
        $items = @()
        foreach ($item in $Value) {
            $items += ,(Normalize-WorkflowValue -Value $item -FieldsToIgnore $FieldsToIgnore -Path ($Path + '[]'))
        }
        return $items
    }

    $props = $Value.PSObject.Properties
    if ($props.Count -gt 0) {
        $ordered = [ordered]@{}
        foreach ($propName in ($props.Name | Sort-Object)) {
            if ($propName -in $FieldsToIgnore) { continue }

            # Do not compare credentials; each local environment resolves them.
            if ($propName -eq 'credentials') { continue }

            # Ignore environment-specific credential ids in comparison.
            if ($propName -eq 'id' -and $Path -like '*.credentials.*') { continue }

            $ordered[$propName] = Normalize-WorkflowValue -Value $Value.$propName -FieldsToIgnore $FieldsToIgnore -Path ($Path + '.' + $propName)
        }
        return $ordered
    }

    return $Value
}

function Remove-WorkflowCredentials {
    param(
        [object]$Workflow
    )

    if ($null -eq $Workflow) { return $Workflow }

    if ($Workflow.nodes) {
        foreach ($node in $Workflow.nodes) {
            if ($node.PSObject.Properties.Name -contains 'credentials') {
                $node.PSObject.Properties.Remove('credentials')
            }
        }
    }

    return $Workflow
}

function Get-ComparableWorkflow {
    param(
        [object]$Workflow,
        [string[]]$FieldsToIgnore
    )

    $shape = [ordered]@{
        name = $null
        nodes = @()
        connections = $null
        settings = $null
    }

    if ($null -ne $Workflow) {
        $shape.name = Normalize-WorkflowValue -Value $Workflow.name -FieldsToIgnore $FieldsToIgnore -Path '$.name'
        $shape.nodes = Normalize-WorkflowValue -Value $Workflow.nodes -FieldsToIgnore $FieldsToIgnore -Path '$.nodes'
        $shape.connections = Normalize-WorkflowValue -Value $Workflow.connections -FieldsToIgnore $FieldsToIgnore -Path '$.connections'
        $shape.settings = Normalize-WorkflowValue -Value $Workflow.settings -FieldsToIgnore $FieldsToIgnore -Path '$.settings'
    }

    return $shape
}

function Has-PotentialMojibake {
    param([string]$Text)

    if ([string]::IsNullOrEmpty($Text)) { return $false }

    foreach ($ch in $Text.ToCharArray()) {
        $code = [int][char]$ch
        if ($code -eq 0x00C3 -or $code -eq 0x00C2 -or $code -eq 0x00E2) {
            return $true
        }
    }

    return $false
}

function Normalize-ComparableText {
    param(
        [string]$Text,
        [string]$Path = '$'
    )

    if ([string]::IsNullOrEmpty($Text)) { return $Text }

    $normalized = $Text.Normalize([System.Text.NormalizationForm]::FormKC)

    $candidate = $normalized
    for ($i = 0; $i -lt 3; $i++) {
        if (-not (Has-PotentialMojibake $candidate)) {
            break
        }

        try {
            $latin1 = [System.Text.Encoding]::GetEncoding(28591)
            $bytes = $latin1.GetBytes($candidate)
            $repaired = [System.Text.Encoding]::UTF8.GetString($bytes)
            if ([string]::IsNullOrEmpty($repaired) -or $repaired -eq $candidate) {
                break
            }
            $candidate = $repaired.Normalize([System.Text.NormalizationForm]::FormKC)
        }
        catch {
            break
        }
    }

    $candidate = Remove-MojibakeResidue $candidate
    $candidate = Remove-Diacritics $candidate

    if ($Path -like '*.jsCode' -or $Path -like '*.query' -or $Path -like '*.responseBody') {
        return (Normalize-CodeLikeText $candidate)
    }

    return $candidate
}

function Remove-MojibakeResidue {
    param([string]$Text)

    if ([string]::IsNullOrEmpty($Text)) { return $Text }

    $builder = New-Object System.Text.StringBuilder
    foreach ($ch in $Text.ToCharArray()) {
        $code = [int][char]$ch
        if ($code -eq 0x00C2 -or $code -eq 0x00C3 -or $code -eq 0xFFFD) {
            continue
        }
        [void]$builder.Append($ch)
    }

    return $builder.ToString()
}

function Normalize-CodeLikeText {
    param([string]$Text)

    if ([string]::IsNullOrEmpty($Text)) { return $Text }

    $normalized = $Text -replace "`r`n", "`n"
    $normalized = $normalized -replace "`r", "`n"

    $lines = $normalized -split "`n"
    $trimmedLines = @()
    foreach ($line in $lines) {
        $trimmedLines += $line.TrimEnd()
    }

    return ([string]::Join("`n", $trimmedLines)).Trim()
}

function Remove-Diacritics {
    param([string]$Text)

    if ([string]::IsNullOrEmpty($Text)) { return $Text }

    $decomposed = $Text.Normalize([System.Text.NormalizationForm]::FormD)
    $builder = New-Object System.Text.StringBuilder

    foreach ($ch in $decomposed.ToCharArray()) {
        $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
        if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($ch)
        }
    }

    return $builder.ToString().Normalize([System.Text.NormalizationForm]::FormC)
}

if (-not (Test-Path $SourceWorkflowsDir)) {
    New-Item -ItemType Directory -Path $SourceWorkflowsDir | Out-Null
}

if (-not (Test-Path $RuntimeWorkflowsDir)) {
    New-Item -ItemType Directory -Path $RuntimeWorkflowsDir | Out-Null
}

$env:COMPOSE_CONVERT_WINDOWS_PATHS = 0

if ($Action -eq "push") {
    Write-Host "Exportando workflows desde n8n..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    docker exec $ContainerName rm -rf $TempExportDir
    docker exec $ContainerName mkdir -p $TempExportDir
    docker exec $ContainerName n8n export:workflow --all --published --separate --pretty --output=$TempExportDir/

    $tempLocalDir = Join-Path $env:TEMP ("n8n_export_" + [Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tempLocalDir | Out-Null
    docker cp "${ContainerName}:${TempExportDir}/." "$tempLocalDir/"

    $fieldsToIgnore = @('updatedAt', 'createdAt', 'shared', 'versionMetadata', 'versionId', 'activeVersionId', 'versionCounter')
    $tempFiles = Get-ChildItem -Path $tempLocalDir -Filter "*.json" -File
    $unchangedCount = 0
    $copiedCount = 0

    foreach ($tempFile in $tempFiles) {
        try {
            $tempRaw = Get-Content -LiteralPath $tempFile.FullName -Raw
            $tempJson = $tempRaw | ConvertFrom-Json
            $tempSanitized = Remove-WorkflowCredentials -Workflow $tempJson
            $workflowName = [string]$tempJson.name

            if ([string]::IsNullOrWhiteSpace($workflowName)) {
                Write-Host "  Aviso: workflow sin nombre en $($tempFile.Name), omitido" -ForegroundColor DarkYellow
                continue
            }

            $localFile = Join-Path $SourceWorkflowsDir "$workflowName.json"
            $hasChanges = $true
            $tempNormalized = Get-ComparableWorkflow -Workflow $tempSanitized -FieldsToIgnore $fieldsToIgnore | ConvertTo-Json -Depth 100 -Compress

            if (Test-Path $localFile) {
                $localRaw = Get-Content -LiteralPath $localFile -Raw
                $localJson = $localRaw | ConvertFrom-Json
                $localNormalized = Get-ComparableWorkflow -Workflow $localJson -FieldsToIgnore $fieldsToIgnore | ConvertTo-Json -Depth 100 -Compress

                if ($tempNormalized -eq $localNormalized) {
                    $hasChanges = $false
                    $unchangedCount++
                    Write-Host "  Sin cambios (metadata/encoding ignored): $workflowName.json" -ForegroundColor DarkCyan
                }
            }

            if ($hasChanges) {
                $sanitizedText = $tempSanitized | ConvertTo-Json -Depth 100
                [System.IO.File]::WriteAllText($localFile, $sanitizedText, (New-Object System.Text.UTF8Encoding($false)))
                Write-Host "  Actualizado (sin credentials): $workflowName.json" -ForegroundColor Yellow
                $copiedCount++
            }
        }
        catch {
            Write-Host "  Aviso procesando $($tempFile.Name): $_" -ForegroundColor DarkYellow
        }
    }

    if (Test-Path $tempLocalDir) {
        Remove-Item -LiteralPath $tempLocalDir -Recurse -Force
    }

    if ($unchangedCount -gt 0) {
        Write-Host "JSON sin cambios funcionales: $unchangedCount" -ForegroundColor Cyan
    }
    if ($copiedCount -gt 0) {
        Write-Host "JSON actualizados (cambios funcionales): $copiedCount" -ForegroundColor Yellow
    }

    Write-Host "OK: workflows exportados" -ForegroundColor Green
    Pop-Location
}
elseif ($Action -eq "pull") {
    Write-Host "Usando workflows locales (sin git pull)..." -ForegroundColor Cyan
    Push-Location $ScriptDir

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
            $projectSql = 'SELECT id FROM project ORDER BY id LIMIT 1;'
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

    # Keep runtime workflows separated from source-controlled workflows.
    Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $SourceWorkflowsDir -Filter "*.json" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $RuntimeWorkflowsDir $_.Name) -Force
    }

    $stagingDir = Join-Path $env:TEMP ("n8n_import_" + [Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $stagingDir | Out-Null

    $workflowsForImport = Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File
    $autoNamedCount = 0
    $invalidJsonCount = 0

    foreach ($workflowFile in $workflowsForImport) {
        $targetFile = Join-Path $stagingDir $workflowFile.Name

        try {
            $rawJson = Get-Content -LiteralPath $workflowFile.FullName -Raw
            $workflowJson = $rawJson | ConvertFrom-Json

            if (-not $workflowJson.name -or [string]::IsNullOrWhiteSpace([string]$workflowJson.name)) {
                $randomName = "workflow-auto-" + [Guid]::NewGuid().ToString("N").Substring(0, 8)
                $workflowJson | Add-Member -MemberType NoteProperty -Name "name" -Value $randomName -Force
                $jsonText = $workflowJson | ConvertTo-Json -Depth 100
                [System.IO.File]::WriteAllText($targetFile, $jsonText, (New-Object System.Text.UTF8Encoding($false)))
                $autoNamedCount++
                Write-Host "  Name aleatorio en copia temporal: $($workflowFile.Name) -> '$randomName'" -ForegroundColor Cyan
            }
            else {
                Copy-Item -LiteralPath $workflowFile.FullName -Destination $targetFile -Force
            }
        }
        catch {
            $invalidJsonCount++
            Write-Host "  Aviso: JSON invalido, omitido en importacion: $($workflowFile.Name)" -ForegroundColor DarkYellow
        }
    }

    # Repair postgres credential ids in staging files using current n8n credentials by name.
    $credMapSql = 'SELECT id, name FROM credentials_entity WHERE type = ''postgres'' ORDER BY id;'
    $credMapRows = docker exec postgres_db psql -U admin -d n8n -At -F "|" -c $credMapSql 2>$null
    $defaultPostgresCredId = $postgresCredId
    $postgresCredByName = @{}

    if ($credMapRows) {
        foreach ($line in ($credMapRows -split "`r?`n")) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $parts = $line -split '\|', 2
            $id = ""
            $name = ""
            if ($parts.Count -ge 1) { $id = [string]$parts[0] }
            if ($parts.Count -ge 2) { $name = [string]$parts[1] }
            if ([string]::IsNullOrWhiteSpace($id)) { continue }

            if ([string]::IsNullOrWhiteSpace($defaultPostgresCredId)) {
                $defaultPostgresCredId = $id
            }

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $postgresCredByName[$name.Trim()] = $id
            }
        }
    }

    $fixedCredRefsCount = 0
    if (-not [string]::IsNullOrWhiteSpace($defaultPostgresCredId)) {
        $stagedForCredFix = Get-ChildItem -Path $stagingDir -Filter "*.json" -File
        foreach ($sf in $stagedForCredFix) {
            try {
                $wfJson = Get-Content -LiteralPath $sf.FullName -Raw | ConvertFrom-Json
                $changedCreds = $false

                if ($wfJson.nodes) {
                    foreach ($node in $wfJson.nodes) {
                        if ($node.credentials -and $node.credentials.postgres) {
                            $credName = ""
                            if ($node.credentials.postgres.name) {
                                $credName = [string]$node.credentials.postgres.name
                            }

                            $targetCredId = $defaultPostgresCredId
                            if (-not [string]::IsNullOrWhiteSpace($credName) -and $postgresCredByName.ContainsKey($credName.Trim())) {
                                $targetCredId = $postgresCredByName[$credName.Trim()]
                            }

                            if ($node.credentials.postgres.id -ne $targetCredId) {
                                $node.credentials.postgres.id = $targetCredId
                                $changedCreds = $true
                            }
                        }
                    }
                }

                if ($changedCreds) {
                    $jsonText = $wfJson | ConvertTo-Json -Depth 100
                    [System.IO.File]::WriteAllText($sf.FullName, $jsonText, (New-Object System.Text.UTF8Encoding($false)))
                    $fixedCredRefsCount++
                }
            }
            catch {
                Write-Host "  Aviso reparando credenciales en staging ($($sf.Name)): $_" -ForegroundColor DarkYellow
            }
        }
    }

    if ($fixedCredRefsCount -gt 0) {
        Write-Host "Referencias de credenciales postgres reparadas en staging: $fixedCredRefsCount" -ForegroundColor Cyan
    }

    if ($autoNamedCount -gt 0) {
        Write-Host "Preparacion completada: workflows con name aleatorio (solo temporal) = $autoNamedCount" -ForegroundColor Cyan
    }
    if ($invalidJsonCount -gt 0) {
        Write-Host "Aviso: JSON invalidos omitidos = $invalidJsonCount" -ForegroundColor Yellow
    }

    Write-Host "Comprobando duplicados por nombre en n8n..." -ForegroundColor Yellow
    $archivedCount = 0
    $unpublishedCount = 0
    $deletedArchivedDuplicates = 0
    $stagedFiles = Get-ChildItem -Path $stagingDir -Filter "*.json" -File
    foreach ($sf in $stagedFiles) {
        try {
            $sfJson = Get-Content -LiteralPath $sf.FullName -Raw | ConvertFrom-Json
            $wfName = [string]$sfJson.name
            if ([string]::IsNullOrWhiteSpace($wfName)) { continue }

            $escapedName = $wfName -replace "'", "''"
            $countSql = "SELECT COUNT(*)::int FROM workflow_entity WHERE name = '$escapedName' AND `"isArchived`" = false;"
            $countResult = ($countSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
            $existingCount = 0
            if ($countResult -match '^\d+$') { $existingCount = [int]$countResult.Trim() }

            if ($existingCount -gt 0) {
                $idsSql = "SELECT id FROM workflow_entity WHERE name = '$escapedName' AND `"isArchived`" = false;"
                $idsResult = ($idsSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
                if ($idsResult) {
                    foreach ($wfId in ($idsResult -split "`r?`n")) {
                        if ([string]::IsNullOrWhiteSpace($wfId)) { continue }
                        try {
                            docker exec $ContainerName n8n unpublish:workflow --id=$wfId | Out-Null
                            $unpublishedCount++
                        }
                        catch {
                            Write-Host "  Aviso: no se pudo unpublish id=$wfId ('$wfName'): $_" -ForegroundColor DarkYellow
                        }
                    }
                }

                $archiveSql = "UPDATE workflow_entity SET `"isArchived`" = true WHERE name = '$escapedName' AND `"isArchived`" = false;"
                $archiveResult = ($archiveSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
                if ($archiveResult -match 'UPDATE\s+([1-9]\d*)') {
                    $archivedCount += [int]$Matches[1]
                }

                $deleteArchivedSql = "DELETE FROM workflow_entity WHERE name = '$escapedName' AND `"isArchived`" = true;"
                $deleteArchivedResult = ($deleteArchivedSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
                if ($deleteArchivedResult -match 'DELETE\s+([1-9]\d*)') {
                    $deletedArchivedDuplicates += [int]$Matches[1]
                }

                Write-Host "  Unpublish+archivado de $existingCount workflow(s) antiguos con nombre: '$wfName'" -ForegroundColor DarkYellow
            }
        }
        catch {
            Write-Host "  Aviso al comprobar duplicados de $($sf.Name): $_" -ForegroundColor DarkYellow
        }
    }
    if ($unpublishedCount -gt 0) {
        Write-Host "Workflows despublicados por duplicado: $unpublishedCount" -ForegroundColor Yellow
    }
    if ($archivedCount -gt 0) {
        Write-Host "Workflows antiguos archivados: $archivedCount" -ForegroundColor Yellow
    }
    else {
        Write-Host "Sin duplicados que archivar." -ForegroundColor Cyan
    }
    if ($deletedArchivedDuplicates -gt 0) {
        Write-Host "Copias archivadas eliminadas por duplicado: $deletedArchivedDuplicates" -ForegroundColor Yellow
    }

    Write-Host "Importando workflows en n8n..." -ForegroundColor Yellow
    docker exec $ContainerName rm -rf $TempImportDir
    docker exec $ContainerName mkdir -p $TempImportDir
    docker cp "$stagingDir/." "${ContainerName}:${TempImportDir}/"

    if ([string]::IsNullOrWhiteSpace($ProjectId)) {
        docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/ --overwrite
    }
    else {
        docker exec $ContainerName n8n import:workflow --separate --input=$TempImportDir/ --projectId=$ProjectId --overwrite
    }

    $unarchivedAfterImport = 0
    foreach ($sf in $stagedFiles) {
        try {
            $sfJson = Get-Content -LiteralPath $sf.FullName -Raw | ConvertFrom-Json
            $wfId = [string]$sfJson.id
            if ([string]::IsNullOrWhiteSpace($wfId)) { continue }

            $escapedId = $wfId -replace "'", "''"
            $unarchiveSql = "UPDATE workflow_entity SET `"isArchived`" = false WHERE id = '$escapedId' AND `"isArchived`" = true;"
            $unarchiveResult = ($unarchiveSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
            if ($unarchiveResult -match 'UPDATE\s+([1-9]\d*)') {
                $unarchivedAfterImport += [int]$Matches[1]
            }
        }
        catch {
            Write-Host "  Aviso al desarchivar importado $($sf.Name): $_" -ForegroundColor DarkYellow
        }
    }
    if ($unarchivedAfterImport -gt 0) {
        Write-Host "Workflows desarchivados tras import: $unarchivedAfterImport" -ForegroundColor Yellow
    }

    # Persist effective runtime JSON (including repaired credential ids) separately from source workflows.
    Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $stagingDir -Filter "*.json" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $RuntimeWorkflowsDir $_.Name) -Force
    }

    if (Test-Path $stagingDir) {
        Remove-Item -LiteralPath $stagingDir -Recurse -Force
    }

    Write-Host "Importacion completada. workflows queda intacto; runtime actualizado en workflows_runtime." -ForegroundColor Cyan
    Pop-Location
}
elseif ($Action -eq "publish") {
    Write-Host "Republicando workflows (unpublish + publish)..." -ForegroundColor Cyan
    Push-Location $ScriptDir

    $workflowFiles = Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File
    $okCount = 0
    $errorCount = 0

    foreach ($workflowFile in $workflowFiles) {
        try {
            $workflowJson = Get-Content -LiteralPath $workflowFile.FullName -Raw | ConvertFrom-Json
            if ($workflowJson.isArchived -eq $true) { continue }

            $resolvedId = $workflowJson.id

            if (-not $resolvedId -and $workflowJson.name) {
                $escapedWfName = ([string]$workflowJson.name) -replace "'", "''"
                $idByNameSql = "SELECT id FROM workflow_entity WHERE lower(name) = lower('$escapedWfName') AND `"isArchived`" = false ORDER BY `"updatedAt`" DESC LIMIT 1;"
                $resolvedId = ($idByNameSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
                if ($resolvedId) {
                    Write-Host "  Resolviendo id por nombre para '$($workflowJson.name)': $resolvedId" -ForegroundColor Yellow
                }
            }

            if (-not $resolvedId) {
                $fileBaseName = [System.IO.Path]::GetFileNameWithoutExtension($workflowFile.Name)
                if (-not [string]::IsNullOrWhiteSpace($fileBaseName)) {
                    $escapedFileName = $fileBaseName -replace "'", "''"
                    $idByFileNameSql = "SELECT id FROM workflow_entity WHERE lower(name) = lower('$escapedFileName') AND `"isArchived`" = false ORDER BY `"updatedAt`" DESC LIMIT 1;"
                    $resolvedId = ($idByFileNameSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
                    if ($resolvedId) {
                        Write-Host "  Resolviendo id por nombre de archivo '$fileBaseName': $resolvedId" -ForegroundColor Yellow
                    }
                }
            }

            if (-not $resolvedId) {
                Write-Host "  Omitido (sin id): $($workflowFile.Name)" -ForegroundColor DarkYellow
                continue
            }

            docker exec $ContainerName n8n unpublish:workflow --id=$resolvedId | Out-Null
            docker exec $ContainerName n8n publish:workflow --id=$resolvedId | Out-Null
            docker exec $ContainerName n8n update:workflow --id=$resolvedId --active=true | Out-Null

            $checkActiveSql = "SELECT CASE WHEN `"active`" THEN 1 ELSE 0 END FROM workflow_entity WHERE id = '$resolvedId' LIMIT 1;"
            $activeResult = ($checkActiveSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
            $isActive = ($activeResult -match '^\s*1\s*$')

            if (-not $isActive) {
                Write-Host "  Aviso: no quedo activo al primer intento, reintentando: $($workflowJson.name) [$resolvedId]" -ForegroundColor Yellow
                docker exec $ContainerName n8n unpublish:workflow --id=$resolvedId | Out-Null
                docker exec $ContainerName n8n publish:workflow --id=$resolvedId | Out-Null
                docker exec $ContainerName n8n update:workflow --id=$resolvedId --active=true | Out-Null
            }

            $okCount++
            Write-Host "  Republicado y activo: $($workflowJson.name) [$resolvedId]" -ForegroundColor Green
        }
        catch {
            $errorCount++
            Write-Host "  Error republicando $($workflowFile.Name): $_" -ForegroundColor Red
        }
    }

    Write-Host "OK: republicacion completada. Exitos=$okCount Errores=$errorCount" -ForegroundColor Green
    Write-Host "Reiniciando contenedor n8n para limpiar estado de webhooks en memoria..." -ForegroundColor Yellow
    docker restart $ContainerName | Out-Null
    Write-Host "n8n reiniciado." -ForegroundColor Green
    Pop-Location
}
elseif ($Action -eq "purge-archived") {
    $countSql = 'SELECT COUNT(*)::int FROM workflow_entity WHERE "isArchived" = true;'
    $countResult = ($countSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
    $totalArchived = 0
    if ($countResult -match '^\d+$') { $totalArchived = [int]$countResult.Trim() }

    if ($totalArchived -eq 0) {
        Write-Host "No hay workflows archivados en n8n." -ForegroundColor Cyan
    }
    else {
        $listSql = 'SELECT name FROM workflow_entity WHERE "isArchived" = true ORDER BY name;'
        $listResult = ($listSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null)
        Write-Host "Workflows archivados que se eliminaran ($totalArchived):" -ForegroundColor Yellow
        $listResult | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkYellow }

        Write-Host ""
        Write-Host "ATENCION: esta accion es IRREVERSIBLE. Los flujos borrados no podran recuperarse." -ForegroundColor Red
        $confirm = Read-Host "Escribe CONFIRMAR para continuar o cualquier otra tecla para cancelar"

        if ($confirm -ceq "CONFIRMAR") {
            $deleteSql = 'DELETE FROM workflow_entity WHERE "isArchived" = true;'
            ($deleteSql | docker exec -i postgres_db psql -U admin -d n8n -At 2>$null) | Out-Null
            Write-Host "OK: $totalArchived workflows archivados eliminados permanentemente." -ForegroundColor Green
        }
        else {
            Write-Host "Operacion cancelada. No se ha eliminado nada." -ForegroundColor Cyan
        }
    }
}
else {
    Write-Host "Uso: .\sync.ps1 -Action push|pull|publish|purge-archived" -ForegroundColor Yellow
}
