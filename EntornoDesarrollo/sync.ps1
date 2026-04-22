param([string]$Action)
$ContainerName = "n8n"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportDir = Join-Path $ScriptDir "workflows"
if ($Action -eq "push") {
    Write-Host "Exportar: n8n -> git" -ForegroundColor Cyan
    Push-Location $ScriptDir
    docker exec $ContainerName n8n export:workflow --all --published --separate --pretty --output=/home/node/exp/
    docker cp "${ContainerName}:/home/node/exp/." "$ExportDir/"
    Pop-Location
} elseif ($Action -eq "pull") {
    Write-Host "Importar: git -> n8n" -ForegroundColor Cyan
    Push-Location $ScriptDir
    git pull
    docker cp "$ExportDir/." "${ContainerName}:/home/node/imp/"
    docker exec $ContainerName n8n import:workflow --separate --input=/home/node/imp/ --overwrite
    Pop-Location
} elseif ($Action -eq "publish") {
    Write-Host "Publicar workflows" -ForegroundColor Cyan
    Push-Location $ScriptDir
    docker exec $ContainerName n8n export:workflow --all --separate --pretty --output=/tmp/wf/ | Out-Null
    docker cp "${ContainerName}:/tmp/wf/." "/tmp/local_wf/"
    Get-ChildItem /tmp/local_wf -Filter "*.json" | ForEach-Object {
        $j = Get-Content $_.FullName -Raw | ConvertFrom-Json
        if ($j.isArchived -ne $true) {
            docker exec $ContainerName n8n publish:workflow --id=$($j.id)
        }
    }
    Pop-Location
} else {
    Write-Host "sync.ps1 push | pull | publish" -ForegroundColor Yellow
}