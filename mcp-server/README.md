# Longsang Workspace MCP Server

## 🎯 Mục đích

MCP Server cho phép bạn điều khiển VS Code Copilot từ xa thông qua Web UI hoặc các ứng dụng khác.

**Use case chính:** Khi bạn đi công tác, dùng điện thoại test app và phát hiện bug, bạn có thể gửi tin nhắn qua Web UI và Copilot sẽ thực hiện fix bug cho bạn tại nhà.

## 🚀 Quick Start

### Cách 1: Chạy riêng MCP Server
```bash
cd mcp-server
./START_MCP.bat    # Windows
./START_MCP.ps1    # PowerShell
```

### Cách 2: Chạy cùng hệ thống (Recommended)
```bash
cd ..
./start-all.ps1
```

Hệ thống sẽ tự động khởi động:
- Frontend: http://localhost:8080
- API Server: http://localhost:3001
- **MCP Server: http://localhost:3002/mcp**

## 🛠️ Danh sách Tools

### File Operations
| Tool | Mô tả |
|------|-------|
| `read_file` | Đọc nội dung file |
| `write_file` | Ghi/tạo file mới |
| `edit_file` | Sửa đổi nội dung cụ thể trong file |
| `delete_file` | Xóa file |

### Search
| Tool | Mô tả |
|------|-------|
| `search_files` | Tìm kiếm text trong files |
| `list_files` | Liệt kê files/folders |

### Terminal
| Tool | Mô tả |
|------|-------|
| `run_command` | Chạy lệnh terminal (whitelisted) |

### Git
| Tool | Mô tả |
|------|-------|
| `git_status` | Xem trạng thái git |
| `git_diff` | Xem thay đổi |
| `git_log` | Xem lịch sử commit |
| `git_commit` | Stage và commit |
| `git_push` | Push lên remote |
| `git_pull` | Pull từ remote |

### Projects
| Tool | Mô tả |
|------|-------|
| `list_projects` | Liệt kê các projects |
| `get_project_info` | Chi tiết project |

### AI Brain
| Tool | Mô tả |
|------|-------|
| `brain_search` | Tìm kiếm trong knowledge base |
| `brain_add` | Thêm knowledge mới |
| `brain_list_domains` | Liệt kê domains |
| `brain_stats` | Thống kê Brain |

### 🆕 Google AI (Gemini 3)
| Tool | Mô tả |
|------|-------|
| `gemini_chat` | Chat với Gemini AI (model mới nhất) |
| `gemini_code` | Generate code với AI |
| `gemini_summarize` | Tóm tắt văn bản |
| `gemini_translate` | Dịch ngôn ngữ |

### 🆕 YouTube
| Tool | Mô tả |
|------|-------|
| `youtube_channel_stats` | Thống kê kênh YouTube |
| `youtube_list_videos` | Danh sách video |
| `youtube_upload_video` | Upload video mới |

### 🆕 Google Drive
| Tool | Mô tả |
|------|-------|
| `drive_list_files` | Danh sách files trên Drive |
| `drive_upload_file` | Upload file lên Drive |

### 🆕 Google Calendar
| Tool | Mô tả |
|------|-------|
| `calendar_list_events` | Danh sách sự kiện sắp tới |
| `calendar_create_event` | Tạo sự kiện mới |

### 🆕 SEO (Search Console)
| Tool | Mô tả |
|------|-------|
| `seo_top_queries` | Top từ khóa tìm kiếm |
| `seo_top_pages` | Top trang có traffic |

### System
| Tool | Mô tả |
|------|-------|
| `google_services_status` | Kiểm tra status các dịch vụ Google |

## 🔒 Security

### Thư mục bị chặn
- `.env`, `.env.local`, `.env.production`
- `node_modules`, `.venv`, `venv`
- `.git/objects`, `.git/hooks`
- `secrets`, `credentials`, `.aws`, `.ssh`, `private`

### File types bị chặn
- Certificates: `.pem`, `.key`, `.cert`, `.crt`
- Databases: `.sqlite`, `.db`
- Binaries: `.exe`, `.dll`, `.so`
- Media: images, videos, audio

### Commands được phép
- npm/pnpm/yarn/bun: install, run, test, build, start
- python/pip: basic operations
- git: status, log, diff, branch, checkout, pull, push, add, commit
- File ops: ls, dir, cat, find, grep

## 📝 Configuration

Cấu hình trong `.env`:
```env
# MCP Server
MCP_PORT=3002
WORKSPACE_ROOT=D:/0.PROJECTS
```

VS Code MCP config (`.vscode/mcp.json`):
```json
{
  "mcpServers": {
    "longsang-workspace": {
      "type": "http",
      "url": "http://localhost:3002/mcp"
    }
  }
}
```

## 🔧 Development

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run in development mode
```bash
python server.py
```

### Logs
Logs được lưu tại: `mcp-server/mcp-server.log`

## 📖 Resources

MCP cung cấp 2 resources:
- `workspace://structure` - Cấu trúc workspace
- `config://settings` - Cấu hình server

## 🆘 Troubleshooting

### Port đã được sử dụng
```powershell
# Kiểm tra port 3002
Get-NetTCPConnection -LocalPort 3002

# Kill process
Stop-Process -Id <PID> -Force
```

### Brain không kết nối được
Kiểm tra các biến môi trường trong `.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### MCP không hiển thị trong Copilot
1. Đảm bảo server đang chạy: http://localhost:3002/mcp
2. Reload VS Code
3. Kiểm tra `.vscode/mcp.json`
