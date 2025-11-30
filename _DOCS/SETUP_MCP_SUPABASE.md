# 🚀 Hướng Dẫn Cài Đặt MCP Supabase

> **MCP (Model Context Protocol) Supabase** cho phép AI Assistant (Cursor/Claude) tương tác trực tiếp với Supabase database, giúp kết nối ổn định và tự động hóa các tác vụ quản lý database.

## 📋 Tổng Quan

MCP Supabase server cung cấp:
- ✅ Kết nối ổn định với Supabase
- ✅ Quản lý database qua AI (tạo bảng, truy vấn SQL, migrate)
- ✅ Tự động hóa các tác vụ database thường dùng
- ✅ Tích hợp với Cursor AI để code nhanh hơn

## 🛠️ Cài Đặt

### Bước 1: Chuẩn Bị Thông Tin Supabase

Bạn cần có các thông tin sau từ Supabase Dashboard:

1. **Supabase URL**: `https://diexsbzqwsbpilsymnfb.supabase.co`
2. **Service Role Key**: Lấy từ Settings → API → service_role key
3. **Project Reference**: `diexsbzqwsbpilsymnfb` (từ config.toml)

### Bước 2: Cài Đặt MCP Supabase Server

MCP Supabase có thể chạy theo 2 cách:

#### Cách 1: Cài đặt Global (Khuyến nghị)

```bash
# Cài đặt qua npx (không cần cài đặt permanent)
# Sẽ tự động tải và chạy khi cần
```

#### Cách 2: Cài đặt Local cho Project

```bash
npm install -D @modelcontextprotocol/server-supabase
```

### Bước 3: Cấu Hình Trong Cursor

Tạo hoặc cập nhật file cấu hình MCP trong Cursor:

**Windows/Linux:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**Mac:** `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

Hoặc thêm vào file cấu hình workspace của Cursor (nếu có).

### Bước 4: Cấu Hình MCP Settings

Tạo file cấu hình MCP với nội dung:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--access-token",
        "YOUR_SUPABASE_ACCESS_TOKEN"
      ],
      "env": {
        "SUPABASE_URL": "https://diexsbzqwsbpilsymnfb.supabase.co",
        "SUPABASE_SERVICE_KEY": "YOUR_SERVICE_ROLE_KEY"
      }
    }
  }
}
```

**Lưu ý:** 
- Thay `YOUR_SUPABASE_ACCESS_TOKEN` bằng Personal Access Token từ Supabase
- Thay `YOUR_SERVICE_ROLE_KEY` bằng Service Role Key (⚠️ Bảo mật cao!)

### Bước 5: Lấy Supabase Personal Access Token

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Vào **Settings** → **Access Tokens**
3. Tạo Personal Access Token mới
4. Copy token (chỉ hiển thị 1 lần, lưu lại cẩn thận)

### Bước 6: Khởi Động Lại Cursor

Sau khi cấu hình xong:
1. Đóng hoàn toàn Cursor
2. Mở lại Cursor
3. MCP Supabase sẽ tự động kết nối

## 🔍 Kiểm Tra Kết Nối

Sau khi cài đặt, bạn có thể:

1. **Kiểm tra trong Cursor:**
   - Mở Command Palette (`Ctrl+Shift+P`)
   - Tìm "MCP" hoặc "Model Context Protocol"
   - Xem danh sách MCP servers đã kết nối

2. **Test với AI:**
   - Hỏi AI: "Liệt kê các bảng trong database Supabase"
   - AI sẽ sử dụng MCP Supabase để truy vấn trực tiếp

## 🎯 Các Tính Năng Của MCP Supabase

### 1. Quản Lý Database Schema
- Liệt kê tất cả tables
- Xem cấu trúc bảng (columns, types, constraints)
- Tạo migration scripts

### 2. Query Database
- Chạy SELECT queries
- Lấy dữ liệu từ bất kỳ bảng nào
- Phân tích dữ liệu

### 3. Quản Lý Functions
- Liệt kê Edge Functions
- Xem code của functions
- Deploy functions

### 4. Quản Lý Projects
- Lấy thông tin project
- Xem settings và config

## ⚙️ Cấu Hình Nâng Cao

### Giới Hạn Truy Cập Theo Project

Nếu bạn chỉ muốn cho phép truy cập 1 project cụ thể:

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
        "SUPABASE_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

### Sử Dụng Service Role Key

⚠️ **Cảnh báo:** Service Role Key có quyền admin, chỉ dùng trong development!

```json
{
  "env": {
    "SUPABASE_URL": "https://diexsbzqwsbpilsymnfb.supabase.co",
    "SUPABASE_SERVICE_KEY": "eyJhbGc..."
  }
}
```

## 🔒 Bảo Mật

1. **Không commit tokens vào Git:**
   - Thêm file config vào `.gitignore`
   - Sử dụng environment variables

2. **Sử dụng Personal Access Token:**
   - Tốt hơn Service Role Key
   - Có thể revoke dễ dàng

3. **Giới hạn quyền:**
   - Chỉ cho phép project cần thiết
   - Sử dụng `--project-ref` flag

## 🐛 Troubleshooting

### MCP không kết nối được

1. Kiểm tra Cursor đã restart chưa
2. Kiểm tra token có hợp lệ không
3. Kiểm tra internet connection
4. Xem logs trong Cursor DevTools (`Ctrl+Shift+I`)

### Lỗi "Invalid token"

1. Tạo lại Personal Access Token
2. Kiểm tra token có bị hết hạn không
3. Đảm bảo token có đủ quyền

### MCP chạy chậm

1. Kiểm tra network connection
2. Kiểm tra Supabase project status
3. Thử restart Cursor

## 📚 Tài Liệu Tham Khảo

- [MCP Supabase Server](https://mcp.so/server/supabase/supabase-community)
- [Model Context Protocol Docs](https://modelcontextprotocol.io)
- [Supabase Access Tokens](https://supabase.com/docs/guides/platform/access-tokens)

## ✅ Checklist Cài Đặt

- [ ] Đã có Supabase URL và Project Reference
- [ ] Đã tạo Personal Access Token
- [ ] Đã cấu hình MCP settings trong Cursor
- [ ] Đã restart Cursor
- [ ] Đã test kết nối với AI
- [ ] Đã verify các tính năng hoạt động

## 💡 Lời Khuyên

1. **Bắt đầu với Personal Access Token** trước khi dùng Service Role Key
2. **Test với queries đơn giản** trước khi làm việc phức tạp
3. **Backup database** trước khi cho phép AI thực hiện migrations
4. **Giới hạn quyền** chỉ với project cần thiết

---

**Ngày tạo:** 2025-01-29  
**Phiên bản:** 1.0.0  
**Tác giả:** LongSang Team
