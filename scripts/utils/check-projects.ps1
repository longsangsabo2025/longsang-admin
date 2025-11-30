$projects = @{
    "portfolio" = "D:\0.PROJECTS\01-MAIN-PRODUCTS\longsang-portfolio"
    "ainewbie" = "D:\0.PROJECTS\01-MAIN-PRODUCTS\ainewbie-web"
    "ai-secretary" = "D:\0.PROJECTS\01-MAIN-PRODUCTS\ai_secretary"
    "vungtau" = "D:\0.PROJECTS\01-MAIN-PRODUCTS\vungtau-dream-homes"
    "music-video" = "D:\0.PROJECTS\01-MAIN-PRODUCTS\music-video-app"
}

foreach ($key in $projects.Keys) {
    $path = $projects[$key]
    Write-Host "`n$key : " -NoNewline -ForegroundColor Cyan
    if (Test-Path $path\package.json) {
        $pkg = Get-Content $path\package.json | ConvertFrom-Json
        if ($pkg.scripts.dev) {
            Write-Host "dev = $($pkg.scripts.dev)" -ForegroundColor Green
        } elseif ($pkg.scripts.start) {
            Write-Host "start = $($pkg.scripts.start)" -ForegroundColor Yellow
        } else {
            Write-Host "NO RUN SCRIPT" -ForegroundColor Red
        }
    } else {
        Write-Host "NO PACKAGE.JSON" -ForegroundColor Red
    }
}
