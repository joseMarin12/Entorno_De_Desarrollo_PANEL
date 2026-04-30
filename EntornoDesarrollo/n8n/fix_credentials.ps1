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

$credSql = 'SELECT id, name FROM credentials_entity WHERE type = ''postgres'' ORDER BY id;'
$credResult = docker exec postgres_db psql -U admin -d n8n -At -F "|" -c $credSql 2>$null
$defaultPostgresCredId = ""
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
        }

        if (-not [string]::IsNullOrWhiteSpace($name)) {
            $postgresCredByName[$name.Trim()] = $id
        }
    }
}

if (-not $defaultPostgresCredId) {
    Write-Host "ERROR: no se encontro credencial postgres" -ForegroundColor Red
    exit 1
}

$workflows = Get-ChildItem -Path $RuntimeWorkflowsDir -Filter "*.json" -File
$changedCount = 0

foreach ($workflow in $workflows) {
    try {
        $json = Get-Content -LiteralPath $workflow.FullName -Raw | ConvertFrom-Json
        $changed = $false

        if ($json.nodes) {
            foreach ($node in $json.nodes) {
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
