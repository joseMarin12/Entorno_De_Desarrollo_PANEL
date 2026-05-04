$ContainerName = "n8n"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceWorkflowsDir = Join-Path $ScriptDir "workflows"
$RuntimeWorkflowsDir = Join-Path $ScriptDir "workflows_runtime"

if (-not (Test-Path $RuntimeWorkflowsDir)) {
    New-Item -ItemType Directory -Path $RuntimeWorkflowsDir | Out-Null
}

# Seed runtime from source if runtime is empty.
$runtimeFiles = Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File -ErrorAction SilentlyContinue
if (-not $runtimeFiles -or $runtimeFiles.Count -eq 0) {
    Get-ChildItem -Path $SourceWorkflowsDir -Filter "*.json" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $RuntimeWorkflowsDir $_.Name) -Force
    }
}

Write-Host "Reparando credenciales en workflows_runtime..." -ForegroundColor Cyan

$preferredCredName = $env:N8N_POSTGRES_CREDENTIAL_NAME
if ([string]::IsNullOrWhiteSpace($preferredCredName)) {
    $templatePath = Join-Path $ScriptDir "credentials\postgres.auto.json"
    if (Test-Path $templatePath) {
        try {
            $templateJson = Get-Content -LiteralPath $templatePath -Raw | ConvertFrom-Json
            if ($templateJson.name) {
                $preferredCredName = [string]$templateJson.name
            }
        }
        catch {
            # Ignore template parsing errors and continue with defaults.
        }
    }
}

$credSql = 'SELECT id, name FROM credentials_entity WHERE type = ''postgres'' ORDER BY id;'
$credResult = docker exec postgres_db psql -U admin -d n8n -At -F "|" -c $credSql 2>$null
$defaultPostgresCredId = ""
$defaultPostgresCredName = ""
$postgresCredByName = @{}

if ($credResult) {
    foreach ($line in ($credResult -split "`r?`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parts = $line -split '\|', 2
        $id = ""
        $name = ""
        if ($parts.Count -ge 1) { $id = [string]$parts[0] }
        if ($parts.Count -ge 2) { $name = [string]$parts[1] }
        if ([string]::IsNullOrWhiteSpace($id)) { continue }

        if ([string]::IsNullOrWhiteSpace($defaultPostgresCredId)) {
            $defaultPostgresCredId = $id
            $defaultPostgresCredName = $name
        }

        if (-not [string]::IsNullOrWhiteSpace($name) -and -not $postgresCredByName.ContainsKey($name.Trim())) {
            $postgresCredByName[$name.Trim()] = $id
        }
    }
}

if (-not $defaultPostgresCredId) {
    Write-Host "ERROR: no se encontro credencial postgres" -ForegroundColor Red
    exit 1
}

$targetCredName = $defaultPostgresCredName
$targetCredId = $defaultPostgresCredId

if (-not [string]::IsNullOrWhiteSpace($preferredCredName) -and $postgresCredByName.ContainsKey($preferredCredName.Trim())) {
    $targetCredName = $preferredCredName.Trim()
    $targetCredId = $postgresCredByName[$targetCredName]
}
elseif ($postgresCredByName.ContainsKey("Postgres account")) {
    $targetCredName = "Postgres account"
    $targetCredId = $postgresCredByName[$targetCredName]
}

Write-Host "Credencial objetivo: '$targetCredName' [$targetCredId]" -ForegroundColor DarkCyan

$workflows = Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File
$changedCount = 0

foreach ($workflow in $workflows) {
    try {
        $json = Get-Content -LiteralPath $workflow.FullName -Raw | ConvertFrom-Json
        $changed = $false

        if ($json.nodes) {
            foreach ($node in $json.nodes) {
                $isPostgresNode = ($node.type -like "*postgres*")
                if ($isPostgresNode -or ($node.credentials -and $node.credentials.postgres)) {
                    if (-not $node.credentials) {
                        $node | Add-Member -MemberType NoteProperty -Name credentials -Value ([pscustomobject]@{}) -Force
                    }

                    if (-not $node.credentials.postgres) {
                        $node.credentials | Add-Member -MemberType NoteProperty -Name postgres -Value ([pscustomobject]@{
                            id = $targetCredId
                            name = $targetCredName
                        }) -Force
                        $changed = $true
                        continue
                    }

                    if ($node.credentials.postgres.id -ne $targetCredId) {
                        $node.credentials.postgres.id = $targetCredId
                        $changed = $true
                    }

                    if ($node.credentials.postgres.name -ne $targetCredName) {
                        $node.credentials.postgres.name = $targetCredName
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

Write-Host "Total workflows actualizados: $changedCount" -ForegroundColor Green
