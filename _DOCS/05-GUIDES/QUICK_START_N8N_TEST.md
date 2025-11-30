# 🚀 Quick Start - Test N8N với Portfolio

## Test Ngay (5 phút)

### 1️⃣ Start n8n
```bash
# Double-click shortcut trên Desktop: N8N-Auto-Login
# Hoặc chạy:
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
START_N8N.bat
```

### 2️⃣ Import Test Workflow

1. Mở n8n: http://localhost:5678
2. Login: `admin / longsang2025`
3. Click **"New Workflow"**
4. Click **"..." menu** → **"Import from File"**
5. Chọn file: `n8n/workflows/01-test-hello-world.json`
6. Click **"Save"** và **"Activate"**

### 3️⃣ Test Webhook

```powershell
# Test từ PowerShell
Invoke-RestMethod -Uri "http://localhost:5678/webhook/hello-test" -Method POST -Body '{"name":"LongSang","project":"Portfolio"}' -ContentType "application/json"
```

**Expected Response:**
```json
{
  "message": "Hello! Received data: {\"name\":\"LongSang\",\"project\":\"Portfolio\"}",
  "timestamp": "2025-11-23T...",
  "status": "success"
}
```

---

## 🎯 Next: Test với Portfolio Contact Form

### Workflow: "Portfolio Contact Handler"

**Scenario:** Khi ai đó submit contact form → Tự động:
1. Lưu vào Supabase
2. Gửi email thông báo cho bạn
3. Auto-reply cho người gửi
4. Log vào analytics

**Setup:**
1. Tạo workflow mới trong n8n
2. Thêm Webhook node
3. Thêm Supabase node (insert contact)
4. Thêm Email node (notify admin)
5. Thêm HTTP node (send auto-reply)

---

## 📊 Test Results Expected

✅ Webhook responds trong < 1 giây
✅ Data được lưu vào Supabase
✅ Email được gửi thành công
✅ Logs hiển thị trong n8n dashboard

---

## 🔧 Debug Commands

```powershell
# Check if n8n is running
Test-NetConnection -ComputerName localhost -Port 5678

# View n8n logs
Get-Content -Path "~/.n8n/logs/n8n.log" -Tail 50 -Wait

# Test webhook availability
curl http://localhost:5678/webhook/hello-test
```

---

## 💡 Tips

- **Test từng node riêng** trước khi chạy cả workflow
- **Sử dụng "Execute Node"** để test từng bước
- **Check execution logs** trong n8n UI
- **Start simple** rồi mới build complex workflows

**Good luck! 🎉**
