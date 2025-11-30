# Check shortcut properties
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut("C:\Users\admin\OneDrive\Desktop\LongSang Admin.lnk")

Write-Host "=== Shortcut Info ===" -ForegroundColor Cyan
Write-Host "Target Path: $($shortcut.TargetPath)"
Write-Host "Arguments: $($shortcut.Arguments)"
Write-Host "Working Directory: $($shortcut.WorkingDirectory)"
Write-Host "Window Style: $($shortcut.WindowStyle)"
Write-Host "Description: $($shortcut.Description)"
Write-Host "Hotkey: $($shortcut.Hotkey)"
Write-Host "Icon Location: $($shortcut.IconLocation)"
