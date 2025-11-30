# ⚡ Cài Đặt MCP Supabase Ngay Bây Giờ

> Token đã sẵn sàng! Chỉ cần 3 bước để hoàn tất.

## 🚀 Cài Đặt Tự Động (Khuyến nghị)

Chạy lệnh này để tự động cấu hình:

```bash
npm run setup:mcp-supabase
```

Script sẽ:

1. ✅ Tạo file config với token của bạn
2. ✅ Tự động copy vào Cursor settings
3. ✅ Hướng dẫn các bước tiếp theo

Sau đó **restart Cursor** và test!

## 📋 Hoặc Làm Thủ Công

### Bước 1: Tìm File Config Cursor

**Windows:**

```
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**Mac:**

```
~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

### Bước 2: Copy Nội Dung

Copy file: `.vscode/mcp-supabase.config.local.json` vào đường dẫn trên.

Hoặc copy nội dung này:

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

### Bước 3: Restart Cursor

1. Đóng hoàn toàn Cursor
2. Mở lại Cursor
3. ✅ Done!

## ✅ Test

Hỏi AI trong Cursor:

```
Liệt kê các bảng trong Supabase database
```

Hoặc chạy:

```bash
npm run test:mcp-supabase
```

## 📚 Chi Tiết

Xem thêm:

- [Token Configured](./_DOCS/MCP_SUPABASE_TOKEN_CONFIGURED.md)
- [Quick Start](./_DOCS/MCP_SUPABASE_QUICKSTART.md)
- [Full Guide](./_DOCS/SETUP_MCP_SUPABASE.md)

---

**Token:** `sbp_8826363ab90440922fff6ad37577dc186d6b0796` ✅ **Status:** Sẵn
sàng cài đặt
