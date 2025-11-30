# =============================================================================
# Create Desktop Shortcut for LongSang Admin
# =============================================================================

$ErrorActionPreference = "Stop"

# Configuration
$AppName = "LongSang Admin"
$AppPath = Split-Path -Parent $PSScriptRoot
$IconPath = Join-Path $AppPath "electron\assets\icon.ico"
$StartScript = Join-Path $AppPath "start-app.bat"

# Desktop path
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "$AppName.lnk"

Write-Host "Creating Desktop Shortcut for $AppName..." -ForegroundColor Cyan
Write-Host ""

# Create batch file for easy launching
$BatchContent = @"
@echo off
title LongSang Admin - Starting...
cd /d "$AppPath"
echo.
echo  ========================================
echo   Starting LongSang Admin Desktop
echo  ========================================
echo.
echo  Starting services...
call npm run desktop:dev
pause
"@

# Write batch file
Set-Content -Path $StartScript -Value $BatchContent -Encoding ASCII
Write-Host "[OK] Created start script: $StartScript" -ForegroundColor Green

# Create VBS launcher (completely silent, best UX)
$VBSLauncherPath = Join-Path $AppPath "LongSang-Admin.vbs"
$VBSContent = @"
' LongSang Admin - Silent Launcher
Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = "$AppPath"
objShell.Run "cmd /c npm run desktop:dev", 0, False
"@

Set-Content -Path $VBSLauncherPath -Value $VBSContent -Encoding ASCII
Write-Host "[OK] Created silent launcher: $VBSLauncherPath" -ForegroundColor Green

# Create the desktop shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $VBSLauncherPath
$Shortcut.WorkingDirectory = $AppPath
$Shortcut.Description = "Launch LongSang Admin Desktop App"

# Set icon if exists
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}

$Shortcut.Save()

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Desktop Shortcut Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now double-click LongSang Admin on your desktop" -ForegroundColor Yellow
Write-Host "Or run start-app.bat from the project folder" -ForegroundColor White
Write-Host ""
Write-Host "Tip: Pin it to your taskbar for faster access!" -ForegroundColor Gray
Write-Host ""

# Also add to Start Menu
$StartMenuPath = [Environment]::GetFolderPath("Programs")
$StartMenuShortcut = Join-Path $StartMenuPath "$AppName.lnk"

$Shortcut2 = $WshShell.CreateShortcut($StartMenuShortcut)
$Shortcut2.TargetPath = $VBSLauncherPath
$Shortcut2.WorkingDirectory = $AppPath
$Shortcut2.Description = "Launch LongSang Admin Desktop App"
if (Test-Path $IconPath) {
    $Shortcut2.IconLocation = $IconPath
}
$Shortcut2.Save()

Write-Host "[OK] Also added to Start Menu!" -ForegroundColor Green
