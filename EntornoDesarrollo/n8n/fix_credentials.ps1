$ContainerName = "n8n"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportDir = Join-Path $ScriptDir "workflows"

Write-Host "Reparando credenciales de workflows..." -ForegroundColor Cyan

$credSql = 'SELECT id FROM credentials_entity WHERE type = ''postgres'' LIMIT 1;'
$credResult = docker exec postgres_db psql -U admin -d n8n -At -c $credSql 2>$null
$postgresCredId = ""
if ($credResult) {
    $postgresCredId = $credResult.Trim()
}

if (-not $postgresCredId) {
    Write-Host "ERROR: no se encontro credencial postgres" -ForegroundColor Red
    exit 1
}

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

Write-Host "Total workflows actualizados: $changedCount" -ForegroundColor Green
