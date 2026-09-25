# tools/make-icons.ps1 — renders the app icons (icons/) from the 忍 badge: 192, 512, a
# maskable 512 (full orange, glyph in the 80 % safe zone) and the 180 apple-touch-icon.
# Windows only (System.Drawing, Yu Gothic Bold). Placeholder art; see HANDOFF.md §7.
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force $out | Out-Null
$orange = [System.Drawing.Color]::FromArgb(255, 0xf0, 0x69, 0x1f)
$ink = [System.Drawing.Color]::FromArgb(255, 0x1b, 0x0f, 0x06)
$bg = [System.Drawing.Color]::FromArgb(255, 0x0d, 0x11, 0x17)

function Draw([int]$size, [string]$path, [bool]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.Color]::Transparent)
  if ($maskable) {
    # Maskable: the whole square is the badge colour; the glyph sits inside the 80% safe zone.
    $g.Clear($orange)
    $glyph = $size * 0.56
  } else {
    # Same look as the favicon: an orange disc (r 30/32) on the app's dark background.
    $g.Clear($bg)
    $r = $size * 30 / 64
    $c = $size / 2
    $brush = New-Object System.Drawing.SolidBrush $orange
    $g.FillEllipse($brush, $c - $r, $c - $r, 2 * $r, 2 * $r)
    $glyph = $size * 0.56
  }
  $font = New-Object System.Drawing.Font('Yu Gothic', [single]$glyph, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $ib = New-Object System.Drawing.SolidBrush $ink
  # Centre the glyph by its real outline (Yu Gothic's line box has a big descent).
  $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $gp.AddString([string][char]0x5FCD, $font.FontFamily, [int]$font.Style, [single]$glyph, (New-Object System.Drawing.PointF 0, 0), (New-Object System.Drawing.StringFormat))
  $b = $gp.GetBounds()
  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate(($size - $b.Width) / 2 - $b.X, ($size - $b.Height) / 2 - $b.Y)
  $gp.Transform($m)
  $g.FillPath($ib, $gp)
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "$path ($size x $size)"
}
Draw 192 "$out\icon-192.png" $false
Draw 512 "$out\icon-512.png" $false
Draw 512 "$out\icon-512-maskable.png" $true
Draw 180 "$out\apple-touch-icon.png" $false
