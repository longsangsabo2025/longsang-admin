# ✅ MCP Supabase - Token Đã Được Cấu Hình

> Access Token đã được cung cấp và sẵn sàng sử dụng

## 🔑 Thông Tin Token

- **Token:** `sbp_8826363ab90440922fff6ad37577dc186d6b0796`
- **Project Reference:** `diexsbzqwsbpilsymnfb`
- **Supabase URL:** `https://diexsbzqwsbpilsymnfb.supabase.co`

## 📁 File Cấu Hình

Token đã được lưu trong:
- **Local Config:** `.vscode/mcp-supabase.config.local.json`
- **Cursor Config:** (cần copy vào Cursor settings)

## 🚀 Cài Đặt Nhanh

### Cách 1: Tự Động (Khuyến nghị)

```bash
node scripts/setup-mcp-supabase.js
```

Script này sẽ:
1. Tạo file config local trong project
2. Tự động tạo file config trong Cursor settings
3. Hướng dẫn các bước tiếp theo

### Cách 2: Thủ Công

1. **Copy file config vào Cursor settings:**

   **Windows:**
   ```
   %APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
   ```

   **Mac:**
   ```
   ~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   ```

2. **Nội dung file cần copy:**

   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-supabase",
           "--project-ref",
           "diexsbzqwsbpilsymnfb"
         ],
         "env": {
           "SUPABASE_URL": "https://diexsbzqwsbpilsymnfb.supabase.co",
           "SUPABASE_ACCESS_TOKEN": "sbp_8826363ab90440922fff6ad37577dc186d6b0796"
         }
       }
     }
   }
   ```

   Hoặc copy từ file: `.vscode/mcp-supabase.config.local.json`

3. **Restart Cursor**
   - Đóng hoàn toàn Cursor
   - Mở lại Cursor

## ✅ Kiểm Tra

### Test 1: Script Test

```bash
npm run test:mcp-supabase
```

### Test 2: Hỏi AI trong Cursor

```
Liệt kê các bảng trong Supabase database
```

Nếu MCP đã cấu hình đúng, AI sẽ tự động query và trả về danh sách tables.

## 🔒 Bảo Mật

- ✅ Token đã được lưu trong file local (không commit vào Git)
- ✅ File `.gitignore` đã có pattern để bảo vệ
- ⚠️ **KHÔNG** chia sẻ token này với người khác
- ⚠️ **KHÔNG** commit file chứa token vào Git

## 📋 Checklist

- [x] Token đã được cung cấp
- [x] File config local đã được tạo
- [ ] File config đã được copy vào Cursor settings
- [ ] Đã restart Cursor
- [ ] Đã test kết nối với `npm run test:mcp-supabase`
- [ ] Đã test với AI: "Liệt kê các bảng trong Supabase"

## 🐛 Troubleshooting

### MCP không kết nối được?

1. Kiểm tra file config có đúng đường dẫn không
2. Kiểm tra token có đúng không
3. Kiểm tra đã restart Cursor chưa
4. Xem logs trong Cursor DevTools (`Ctrl+Shift+I`)

### Lỗi "Invalid token"?

1. Kiểm tra token có còn hợp lệ không
2. Kiểm tra token có quyền truy cập project không
3. Tạo lại token từ Supabase Dashboard nếu cần

## 📚 Tài Liệu Tham Khảo

- [Quick Start Guide](./MCP_SUPABASE_QUICKSTART.md)
- [Full Setup Guide](./SETUP_MCP_SUPABASE.md)
- [Setup Complete](./MCP_SUPABASE_SETUP_COMPLETE.md)

---

**Ngày cấu hình:** 2025-01-29  
**Trạng thái:** ✅ Token đã sẵn sàng  
**Bước tiếp theo:** Copy config vào Cursor settings và restart
