# ⚡ MCP Supabase - Quick Start Guide

> Hướng dẫn nhanh 5 phút để cài đặt MCP Supabase và bắt đầu sử dụng

## 🎯 Mục Đích

MCP Supabase cho phép AI Assistant (Cursor) tương tác trực tiếp với Supabase database, giúp:
- ✅ Kết nối ổn định với Supabase
- ✅ AI tự động query, tạo bảng, migrate database
- ✅ Code nhanh hơn với AI hỗ trợ database operations

## ⚡ Cài Đặt Nhanh (5 Phút)

### Bước 1: Lấy Supabase Personal Access Token

1. Đăng nhập [Supabase Dashboard](https://app.supabase.com)
2. Click vào **Settings** (⚙️) → **Access Tokens**
3. Click **Generate New Token**
4. Copy token (⚠️ chỉ hiển thị 1 lần!)

### Bước 2: Cấu Hình MCP trong Cursor

**Windows:**
```
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**Mac:**
```
~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Nội dung file:**

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
        "SUPABASE_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

**Thay `YOUR_TOKEN_HERE` bằng token bạn vừa copy!**

### Bước 3: Restart Cursor

1. Đóng hoàn toàn Cursor
2. Mở lại Cursor
3. ✅ Done!

## 🧪 Test Kết Nối

### Cách 1: Hỏi AI

Hỏi AI trong Cursor:
```
Liệt kê các bảng trong Supabase database
```

Nếu MCP đã cấu hình đúng, AI sẽ tự động query và trả về danh sách tables.

### Cách 2: Chạy Script Test

```bash
npm run test:mcp-supabase
```

Hoặc:
```bash
node scripts/test-mcp-supabase.js
```

## 🎯 Sử Dụng

Sau khi cài đặt, bạn có thể yêu cầu AI:

### Quản Lý Database

```
- "Tạo bảng users với các cột: id, name, email"
- "Thêm cột age vào bảng users"
- "Liệt kê tất cả bảng trong database"
- "Xem cấu trúc bảng projects"
```

### Query Data

```
- "Lấy 10 projects đầu tiên từ database"
- "Đếm số lượng users"
- "Tìm projects có status = 'active'"
```

### Migrations

```
- "Tạo migration để thêm bảng products"
- "Generate SQL script để backup bảng users"
```

## 📚 Tài Liệu Đầy Đủ

Xem file chi tiết: [`SETUP_MCP_SUPABASE.md`](./SETUP_MCP_SUPABASE.md)

## ❓ Troubleshooting

### MCP không hoạt động?

1. ✅ Kiểm tra token có đúng không
2. ✅ Kiểm tra đã restart Cursor chưa
3. ✅ Kiểm tra file config có đúng đường dẫn không
4. ✅ Xem logs trong Cursor DevTools (`Ctrl+Shift+I`)

### Lỗi "Invalid token"?

1. Tạo lại Personal Access Token
2. Copy lại token vào config
3. Restart Cursor

### AI không query được?

1. Kiểm tra token có quyền truy cập project không
2. Kiểm tra project reference có đúng không
3. Test bằng script: `npm run test:mcp-supabase`

## 🔒 Bảo Mật

- ✅ **Đừng commit token vào Git!**
- ✅ File config nên nằm ngoài project folder
- ✅ Sử dụng Personal Access Token (không phải Service Role Key cho production)

---

**Cần giúp đỡ?** Xem [SETUP_MCP_SUPABASE.md](./SETUP_MCP_SUPABASE.md) để biết chi tiết!
