# Opens Closet in its own window on this PC (what the desktop shortcut runs).
#
# 1. Starts the app's local server in the background, unless it is already running.
# 2. Opens Closet in a Microsoft Edge window of its own: no tabs, no address bar, and its own
#    storage, so your closet stays put however you use your normal browser.
# 3. When you close that window, stops the server again.

param([int]$Port = 5173)

$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$url = "http://localhost:$port/"
$env:PATH = [Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH', 'User')

function Test-Server {
  try { (Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { $false }
}

function Show-Problem([string]$message) {
  Add-Type -AssemblyName PresentationFramework
  [void][System.Windows.MessageBox]::Show($message, 'Closet')
  exit 1
}

$server = $null
if (-not (Test-Server)) {
  $vite = Join-Path $project 'node_modules\vite\bin\vite.js'
  if (-not (Test-Path $vite)) {
    Show-Problem "Closet isn't set up yet. Open a terminal in the 'Closet App' folder and run: npm.cmd install"
  }
  $server = Start-Process node -ArgumentList "`"$vite`"", '--port', $port, '--strictPort' `
    -WorkingDirectory $project -WindowStyle Hidden -PassThru
  for ($i = 0; $i -lt 80 -and -not (Test-Server); $i++) { Start-Sleep -Milliseconds 250 }
  if (-not (Test-Server)) {
    if (-not $server.HasExited) { taskkill /PID $server.Id /T /F | Out-Null }
    Show-Problem "Closet couldn't start. Something else may be using port $port."
  }
}

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { Show-Problem 'Closet needs Microsoft Edge or Google Chrome.' }

# Closet's own browser profile: this is where the closet itself is stored on this PC.
$windowProfile = Join-Path $env:LOCALAPPDATA 'Closet\window'
$window = Start-Process $browser -PassThru -ArgumentList @(
  "--app=$url",
  "--user-data-dir=`"$windowProfile`"",
  '--no-first-run',
  '--no-default-browser-check',
  # Let the browser quit fully when the window closes, so the server can stop too.
  '--disable-background-mode',
  '--window-size=1280,900'
)

# Only stop the server if this script started it (and so nothing else is using it).
if ($server) {
  $window.WaitForExit()
  # Edge can hand the window to a helper process, so wait until no Closet window is left.
  while (Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" |
      Where-Object { $_.CommandLine -like "*$windowProfile*" }) {
    Start-Sleep -Seconds 2
  }
  taskkill /PID $server.Id /T /F | Out-Null
}
