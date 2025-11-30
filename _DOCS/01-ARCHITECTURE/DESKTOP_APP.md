# 🖥️ LongSang Admin - Desktop App

## Quick Start

### Development Mode
```bash
# Chạy desktop app với auto-start n8n
npm run desktop:dev
```

App sẽ tự động:
- ✅ Khởi động n8n
- ✅ Khởi động Vite dev server
- ✅ Mở cửa sổ admin dashboard
- ✅ Tạo system tray icon

### System Tray Features
- **Double-click** tray icon: Mở admin window
- **Right-click** tray icon:
  - 🏠 Open Admin
  - 🔗 Open n8n
  - 🔄 Restart n8n
  - ❌ Quit

### Build for Production

```bash
# Build for Windows
npm run desktop:build:win

# Build for Mac
npm run desktop:build:mac

# Build for Linux
npm run desktop:build:linux
```

Output sẽ ở folder `release/`.

## Troubleshooting

### Port đã bị chiếm
App tự động detect port available. Nếu 8080 bận, sẽ dùng 8081, 8082...

### n8n không start
Kiểm tra n8n đã cài global:
```bash
npm install -g n8n
```

### Lỗi CORS với n8n
Khi chạy qua desktop app, proxy tự động được configure. Không cần config thêm.

## Files Structure

```
electron/
├── main.cjs        # Main process
└── icon.png        # App icon (add your own)
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run desktop` | Run desktop app (production build) |
| `npm run desktop:dev` | Run in development mode |
| `npm run desktop:build` | Build for all platforms |
| `npm run desktop:build:win` | Build for Windows |
| `npm run desktop:build:mac` | Build for macOS |
| `npm run desktop:build:linux` | Build for Linux |
