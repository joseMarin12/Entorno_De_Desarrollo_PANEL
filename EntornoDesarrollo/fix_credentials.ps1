$ContainerName = "n8n"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportDir = Join-Path $ScriptDir "workflows"
Write-Host "Reparando credenciales..." -ForegroundColor Cyan
$CredResult = docker exec postgres_db psql -U admin -d n8n -t -c "SELECT id FROM credentials_entity WHERE type='postgres' LIMIT 1" 2>$null
if (-not $CredResult) {
    Write-Host "ERROR: sin credencial" -ForegroundColor Red
    exit 1
}
$NewCredId = $CredResult.Trim()
Write-Host "Credencial: $NewCredId" -ForegroundColor Green
$Count = 0
Get-ChildItem $ExportDir -Filter "*.json" | ForEach-Object {
    $Content = Get-Content $_.FullName -Raw | ConvertFrom-Json
    $Content.nodes | Where-Object {$_.credentials.postgres.id} | ForEach-Object {
        if ($_.credentials.postgres.id -ne $NewCredId) {
            $_.credentials.postgres.id = $NewCredId
            $Count++
        }
    }
    $Content | ConvertTo-Json -Depth 100 | Set-Content $_.FullName
}
Write-Host "Actualizados: $Count" -ForegroundColor Green