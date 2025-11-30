# 🎛️ n8n Server Control - UI Management

## Tổng Quan

Giờ bạn có thể **start/stop/restart n8n server** trực tiếp từ UI mà **KHÔNG CẦN mở AI assistant**!

## 🎯 Cách Sử Dụng

### 1. Truy Cập n8n Management

Vào Admin Panel → **AI & Automation** → **🎛️ n8n Server**

Hoặc truy cập trực tiếp: `http://localhost:8080/admin/n8n`

### 2. Start n8n Server

Có 2 cách start:

#### Option A: Start Server Only

- Click nút **"Start Server"**
- Server sẽ chạy ở background
- Không tự động mở browser

#### Option B: Start & Open Browser ⭐ (Khuyến nghị)

- Click nút **"Start & Open"**
- Server sẽ start VÀ tự động mở n8n editor trong tab mới
- Tiện để bắt đầu edit workflows ngay

### 3. Mở n8n Editor

Khi server đang chạy:

- Click nút **"Open n8n Editor"**
- Hoặc click vào URL: `http://localhost:5678`
- Browser sẽ mở n8n editor trong tab mới

### 4. Monitor Status

UI hiển thị real-time:

- ✅ **Running Status**: Server đang chạy hay stopped
- ⏱️ **Uptime**: Thời gian server đã chạy
- 🔢 **Process ID**: PID của n8n process
- 📝 **Logs**: Xem logs trực tiếp từ n8n

### 5. Stop/Restart

- **Stop**: Dừng n8n server hoàn toàn
- **Restart**: Tự động stop và start lại server

## 🏗️ Kiến Trúc Hoạt Động

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │  HTTP   │  API Server │  Spawn  │  n8n Server │
│     UI      │────────▶│ (Port 3001) │────────▶│ (Port 5678) │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Luồng Hoạt Động:

1. **User clicks "Start & Open"** trên UI
2. UI gọi API: `POST http://localhost:3001/api/n8n/start`
3. API Server spawn n8n process: `npx n8n start`
4. n8n server khởi động trên port 5678
5. API Server mở browser: `http://localhost:5678`
6. User edit workflows trong n8n editor

## 📡 API Endpoints

### GET /api/n8n/status

Kiểm tra status của n8n server

```json
{
  "success": true,
  "status": {
    "running": true,
    "pid": 12345,
    "startedAt": "2025-11-22T08:00:00.000Z",
    "url": "http://localhost:5678",
    "uptime": 3600,
    "logs": [...]
  }
}
```

### POST /api/n8n/start

Start n8n server

```json
// Request body
{
  "openBrowser": true  // Optional, default: false
}

// Response
{
  "success": true,
  "message": "n8n server started successfully",
  "status": {...}
}
```

### POST /api/n8n/stop

Stop n8n server

```json
{
  "success": true,
  "message": "n8n server stopped successfully"
}
```

### POST /api/n8n/restart

Restart n8n server

```json
{
  "success": true,
  "message": "n8n server restarted successfully"
}
```

### GET /api/n8n/logs

Lấy logs của n8n

```
GET /api/n8n/logs?limit=100
```

## 🎨 UI Components

### N8nController Component

- Location: `src/components/automation/N8nController.tsx`
- Features:
  - Start/Stop/Restart buttons
  - Real-time status display
  - Live logs viewer
  - Auto-refresh status (every 5 seconds)
  - Uptime tracking

### N8nManagement Page

- Location: `src/pages/N8nManagement.tsx`
- Route: `/admin/n8n`
- Includes:
  - N8nController component
  - Quick guide cards
  - Documentation section
  - Use cases examples

## 🔧 Technical Details

### Process Management

#### Windows:

```powershell
# Start
npx n8n start

# Kill by port
netstat -ano | findstr :5678
taskkill /F /PID <pid>
```

#### Unix/Mac:

```bash
# Start
npx n8n start

# Kill by port
lsof -i :5678
kill -9 <pid>
```

### Environment Variables

n8n được start với các env vars:

```bash
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
DB_SQLITE_POOL_SIZE=10
N8N_RUNNERS_ENABLED=true
```

### Process Handling

- **Detached**: false (child process bị kill khi API server stop)
- **Shell**: true (để chạy npx command)
- **Logs**: Captured qua stdout/stderr
- **Auto-restart**: Không (phải manual restart)

## 🎓 Workflow Examples

### 1. Content Generation → Social Media

```
Trigger (Schedule)
  → OpenAI (Generate content)
  → Supabase (Save to content_queue)
  → HTTP Request (Post to social media)
```

### 2. Form Submission → Database

```
Webhook (Receive form data)
  → Validate Data
  → Supabase (Insert record)
  → Send Email (Confirmation)
```

### 3. Monitor Website → Alert

```
Schedule Trigger (Every 5 min)
  → HTTP Request (Check website)
  → IF (Response time > 2s)
  → Telegram (Send alert)
```

## 💡 Tips & Best Practices

### ✅ DO:

- Always "Activate" workflows after creation (toggle in editor)
- Test workflows với "Execute Workflow" button
- Save workflows regularly (Ctrl+S)
- Use descriptive names cho workflows và nodes
- Add notes to complex workflows

### ❌ DON'T:

- Đừng tắt server khi workflows đang chạy
- Đừng quên activate workflows sau khi edit
- Đừng hardcode credentials (dùng n8n credentials system)
- Đừng tạo infinite loops (webhooks calling webhooks)

## 🐛 Troubleshooting

### Server won't start

```bash
# Check port 5678
netstat -ano | findstr :5678

# Kill existing process
taskkill /F /PID <pid>

# Start again
```

### Browser doesn't open

- Check pop-up blocker
- Manually open: `http://localhost:5678`

### Workflows not executing

- Check workflow is "Active" (toggle ON)
- Check trigger configuration
- View execution logs in n8n editor

### Logs not showing

- Click "Refresh" button
- Enable auto-refresh
- Check browser console for errors

## 🚀 Lợi Ích

### Trước đây:

```bash
# Phải mở terminal
npm run n8n:start

# Hoặc nhờ AI assistant
"Bạn ơi, start n8n server giúp tôi"
```

### Bây giờ:

```
1. Click "Start & Open" trên UI
2. n8n editor tự động mở
3. Bắt đầu tạo workflows ngay!
```

## 📊 Monitoring

UI tự động refresh status mỗi 5 giây:

- Server running/stopped
- Uptime counter
- Process ID
- Recent logs (50 lines)

Có thể disable auto-refresh để tiết kiệm resources.

## 🔐 Security Notes

- n8n chạy trên localhost:5678 (không public)
- Chỉ accessible từ local machine
- Không expose ra internet
- API endpoints cũng chỉ local (localhost:3001)

## 📝 Files Created

### Backend:

- `api/routes/n8n.js` - API endpoints để control n8n

### Frontend:

- `src/components/automation/N8nController.tsx` - UI controller
- `src/pages/N8nManagement.tsx` - Management page

### Routes:

- Added to `api/server.js`
- Added to `src/App.tsx`
- Added to Admin Panel navigation

## 🎯 Next Steps

1. ✅ **Test UI**: Vào `/admin/n8n` và test start/stop
2. ✅ **Create Workflow**: Click "Start & Open" → Create first workflow
3. ✅ **Connect to Database**: Add Supabase node trong workflow
4. ✅ **Activate**: Toggle workflow ON
5. ✅ **Monitor**: Xem logs và status real-time

---

**Created**: November 22, 2025
**Status**: ✅ Fully Functional
**Dependencies**: Node.js, npx, n8n package
