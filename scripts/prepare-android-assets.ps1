$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$downloadApk = Join-Path $repoRoot "build\vela.apk"

if (Test-Path $downloadApk) {
  Remove-Item -LiteralPath $downloadApk -Force
}
