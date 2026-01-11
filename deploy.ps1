param(
  [string]$Target = "F:\PERSO\GAMES\Steam\steamapps\common\nanos-world\Server\Packages\fallout-ui\Client\UI"
)

$ErrorActionPreference = "Stop"

Write-Host "Building React UI..."
npm run build

if (-not (Test-Path -Path $Target)) {
  throw "Target path not found: $Target"
}

Write-Host "Deploying to: $Target"
Copy-Item -Path ".\build\index.html" -Destination $Target -Force
Copy-Item -Path ".\build\static" -Destination $Target -Recurse -Force
Get-ChildItem -Path ".\build" -File |
  Where-Object { $_.Name -ne "index.html" -and $_.Name -ne "asset-manifest.json" } |
  ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $Target -Force
  }

Write-Host "Done."
