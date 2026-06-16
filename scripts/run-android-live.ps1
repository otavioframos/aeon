param(
  [int]$Port = 5173,
  [string]$HostAddress = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$toolsRoot = if ($env:VELA_BUILD_TOOLS) { $env:VELA_BUILD_TOOLS } else { Join-Path $env:LOCALAPPDATA "VelaBuildTools" }
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $toolsRoot "android-sdk" }
$jdkCandidatesRoot = Join-Path $toolsRoot "jdk21"

if (-not (Test-Path $jdkCandidatesRoot)) {
  throw "JDK 21 was not found at $jdkCandidatesRoot. Run npm run android:apk once or install JDK 21."
}

$jdkHome = Get-ChildItem $jdkCandidatesRoot -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName "bin\javac.exe") } |
  Sort-Object Name -Descending |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $jdkHome) {
  throw "No usable JDK 21 folder was found under $jdkCandidatesRoot."
}

if (-not (Test-Path (Join-Path $sdkRoot "platform-tools\adb.exe"))) {
  throw "ADB was not found at $sdkRoot. Run npm run android:apk once or install Android platform tools."
}

$env:JAVA_HOME = $jdkHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

function Test-LocalDevServer {
  param([int]$ServerPort)

  try {
    Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$ServerPort/@vite/client" -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

$startedDevProcessId = $null

function Stop-ProcessTree {
  param([int]$ProcessId)

  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
  foreach ($child in $children) {
    Stop-ProcessTree -ProcessId $child.ProcessId
  }

  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

try {
  Push-Location $repoRoot
  try {
    if (-not (Test-LocalDevServer -ServerPort $Port)) {
      $outFile = Join-Path $env:TEMP "vela-live-vite.out.log"
      $errFile = Join-Path $env:TEMP "vela-live-vite.err.log"

      Write-Host "Starting Vite dev server on port $Port..."
      $devProcess = Start-Process `
        -FilePath "powershell" `
        -ArgumentList @("-NoProfile", "-Command", "npm run dev -- --host 0.0.0.0 --port $Port --strictPort") `
        -WorkingDirectory $repoRoot `
        -RedirectStandardOutput $outFile `
        -RedirectStandardError $errFile `
        -WindowStyle Hidden `
        -PassThru
      $startedDevProcessId = $devProcess.Id

      $ready = $false
      for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 500
        if (Test-LocalDevServer -ServerPort $Port) {
          $ready = $true
          break
        }
      }

      if (-not $ready) {
        Write-Host "Vite output:"
        Get-Content $outFile -ErrorAction SilentlyContinue
        Get-Content $errFile -ErrorAction SilentlyContinue
        throw "Vite did not start on port $Port."
      }
    }

    $devices = & adb devices
    $readyDevices = $devices | Where-Object { $_ -match "\tdevice$" }
    if (-not $readyDevices) {
      Write-Host ($devices -join [Environment]::NewLine)
      throw "No authorized Android device found. Enable USB debugging, plug the phone in, and accept the RSA prompt."
    }

    Write-Host "Running Vela on Android with live reload..."
    & npx cap run android --live-reload --host $HostAddress --port $Port --forwardPorts "$Port`:$Port"
  } finally {
    Pop-Location
  }
} catch {
  if ($startedDevProcessId) {
    Stop-ProcessTree -ProcessId $startedDevProcessId
  }

  Write-Host ""
  Write-Host "Vela live reload could not start:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 1
}
