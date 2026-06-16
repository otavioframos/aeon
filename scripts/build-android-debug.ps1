$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$toolsRoot = if ($env:VELA_BUILD_TOOLS) { $env:VELA_BUILD_TOOLS } else { Join-Path $env:LOCALAPPDATA "VelaBuildTools" }
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $toolsRoot "android-sdk" }
$jdkCandidatesRoot = Join-Path $toolsRoot "jdk21"

if (-not (Test-Path $jdkCandidatesRoot)) {
  throw "JDK 21 was not found at $jdkCandidatesRoot. Install JDK 21 or set JAVA_HOME before running this script."
}

$jdkHome = Get-ChildItem $jdkCandidatesRoot -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName "bin\javac.exe") } |
  Sort-Object Name -Descending |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $jdkHome) {
  throw "No usable JDK 21 folder was found under $jdkCandidatesRoot."
}

if (-not (Test-Path (Join-Path $sdkRoot "platforms\android-36"))) {
  throw "Android SDK platform 36 was not found at $sdkRoot. Install the local Android SDK or set ANDROID_HOME."
}

$env:JAVA_HOME = $jdkHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Push-Location (Join-Path $repoRoot "android")
try {
  & .\gradlew.bat assembleDebug
} finally {
  Pop-Location
}
