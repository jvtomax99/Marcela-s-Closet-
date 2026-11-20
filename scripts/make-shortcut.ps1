# Puts a "Closet" shortcut on the desktop and in the Start menu (run with: npm.cmd run shortcut).
# Safe to run again: it just replaces the shortcuts.

$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$launcher = Join-Path $PSScriptRoot 'open-closet.ps1'
$icon = Join-Path $PSScriptRoot 'closet.ico'

# Build a Windows icon from the app icon, with the sizes Windows asks for.
Add-Type -AssemblyName System.Drawing
$source = [System.Drawing.Image]::FromFile((Join-Path $project 'public\icon-512.png'))
$sizes = 16, 24, 32, 48, 64, 128, 256
$images = foreach ($size in $sizes) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  # Rounded corners, like other app icons on Windows 11.
  $radius = [math]::Max(2, [int]($size * 0.2))
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
  $path.AddArc($size - $radius * 2 - 1, 0, $radius * 2, $radius * 2, 270, 90)
  $path.AddArc($size - $radius * 2 - 1, $size - $radius * 2 - 1, $radius * 2, $radius * 2, 0, 90)
  $path.AddArc(0, $size - $radius * 2 - 1, $radius * 2, $radius * 2, 90, 90)
  $path.CloseFigure()
  $graphics.SetClip($path)
  $graphics.DrawImage($source, 0, 0, $size, $size)
  $graphics.Dispose()
  $stream = New-Object System.IO.MemoryStream
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
  , $stream.ToArray()
}
$source.Dispose()

$file = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter $file
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $side = if ($sizes[$i] -ge 256) { 0 } else { $sizes[$i] }
  $writer.Write([byte]$side); $writer.Write([byte]$side); $writer.Write([byte]0); $writer.Write([byte]0)
  $writer.Write([uint16]1); $writer.Write([uint16]32)
  $writer.Write([uint32]$images[$i].Length); $writer.Write([uint32]$offset)
  $offset += $images[$i].Length
}
foreach ($image in $images) { $writer.Write($image) }
[System.IO.File]::WriteAllBytes($icon, $file.ToArray())
$writer.Dispose()

$shell = New-Object -ComObject WScript.Shell
$places = @(
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('Programs')
)
foreach ($place in $places) {
  $shortcut = $shell.CreateShortcut((Join-Path $place 'Closet.lnk'))
  $shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
  $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`""
  $shortcut.WorkingDirectory = $project
  $shortcut.IconLocation = "$icon,0"
  $shortcut.Description = 'Shop your own closet'
  $shortcut.WindowStyle = 7 # start minimized, so no console window flashes up
  $shortcut.Save()
  Write-Output "Shortcut ready: $(Join-Path $place 'Closet.lnk')"
}
