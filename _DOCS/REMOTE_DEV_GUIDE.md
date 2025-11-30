# 🚀 LongSang Admin - Remote Development System

## Quick Start

### 1. Khởi động tất cả services

```powershell
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
.\START_ALL.ps1
```

### 2. Truy cập Web UI

Mở trình duyệt: **http://localhost:8080/workspace-chat**

### 3. Dừng tất cả services

```powershell
.\STOP_ALL.ps1
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LONGSANG ADMIN SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Frontend  │───▶│  API Server │───▶│     MCP Server      │ │
│  │  (React)    │    │  (Node.js)  │    │     (Python)        │ │
│  │  Port 8080  │    │  Port 3001  │    │     Port 3002       │ │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘ │
│                                                    │            │
│                                     ┌──────────────┼──────────┐ │
│                                     ▼              ▼          │ │
│                              ┌───────────┐  ┌────────────┐    │ │
│                              │  Supabase │  │  Google    │    │ │
│                              │  (Brain)  │  │  Services  │    │ │
│                              └───────────┘  └────────────┘    │ │
│                                                               │ │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔧 Available Tools (35 tools)

### File Operations
| Tool | Description |
|------|-------------|
| `read_file` | Đọc nội dung file |
| `write_file` | Ghi nội dung vào file |
| `edit_file` | Sửa một phần file |
| `delete_file` | Xóa file |
| `search_files` | Tìm kiếm trong files |
| `list_files` | Liệt kê files/folders |

### Git Operations
| Tool | Description |
|------|-------------|
| `git_status` | Xem trạng thái git |
| `git_diff` | Xem thay đổi |
| `git_log` | Xem lịch sử commit |
| `git_commit` | Commit changes |
| `git_push` | Push lên remote |
| `git_pull` | Pull từ remote |

### Deployment
| Tool | Description |
|------|-------------|
| `deploy_vercel` | Deploy lên Vercel |
| `full_deploy_pipeline` | Build → Commit → Push → Deploy |

### AI Brain
| Tool | Description |
|------|-------------|
| `brain_search` | Tìm kiếm knowledge base |
| `brain_add` | Thêm kiến thức mới |
| `brain_list_domains` | Liệt kê domains |
| `brain_stats` | Thống kê Brain |

### Google AI (Gemini)
| Tool | Description |
|------|-------------|
| `gemini_chat` | Chat với Gemini |
| `gemini_code` | Sinh code với Gemini |
| `gemini_summarize` | Tóm tắt văn bản |
| `gemini_translate` | Dịch văn bản |

### YouTube
| Tool | Description |
|------|-------------|
| `youtube_channel_stats` | Thống kê channel |
| `youtube_list_videos` | Liệt kê videos |
| `youtube_upload_video` | Upload video |

### Google Drive
| Tool | Description |
|------|-------------|
| `drive_list_files` | Liệt kê files |
| `drive_upload_file` | Upload file |

### Google Calendar
| Tool | Description |
|------|-------------|
| `calendar_list_events` | Xem sự kiện |
| `calendar_create_event` | Tạo sự kiện |

### SEO (Search Console)
| Tool | Description |
|------|-------------|
| `seo_top_queries` | Top từ khóa |
| `seo_top_pages` | Top trang |

---

## 💬 Example Commands

### Đọc và sửa file
```
"Đọc file src/App.tsx và thêm một component mới"
```

### Git workflow
```
"Commit tất cả thay đổi với message 'Fix bug' và push lên main"
```

### Full deployment
```
"Build project longsang-admin, commit và deploy lên production"
```

### AI assistance
```
"Hỏi Gemini cách tối ưu performance cho React app"
```

### YouTube analytics
```
"Xem thống kê channel YouTube của tôi"
```

### SEO analysis
```
"Xem top 10 từ khóa của website longsang.com"
```

---

## 🔐 Security

- Chỉ cho phép truy cập trong workspace `D:\0.PROJECTS`
- Block các file nhạy cảm (.env, .pem, .key, etc.)
- Whitelist commands được phép chạy
- Rate limiting trên API

---

## 📱 Mobile Access

Để truy cập từ điện thoại:

1. **Expose via ngrok:**
```powershell
ngrok http 8080
```

2. **Hoặc dùng Cloudflare Tunnel:**
```powershell
cloudflared tunnel --url http://localhost:8080
```

3. Mở URL ngrok/cloudflare trên điện thoại

---

## 🐛 Troubleshooting

### MCP Server crash liên tục
Server tự động restart nhờ supervisor. Kiểm tra log:
```powershell
Get-Content D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\mcp-server\mcp-server.log -Tail 50
```

### API không kết nối được MCP
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/ai/workspace-chat/mcp-reconnect" -Method POST
```

### Port đang bị chiếm
```powershell
.\STOP_ALL.ps1
.\START_ALL.ps1
```

---

## 📞 Support

- Email: longsangsabo1@gmail.com
- GitHub: https://github.com/longsangsabo2025

---

*Last updated: November 29, 2025*
