# Paperclip AI — Hướng dẫn thực chiến

> Tài liệu này được viết từ kinh nghiệm thực tế setup + vận hành Paperclip AI trên Windows.
> Phiên bản: Paperclip v0.3.1 | Claude CLI v2.1.76 | Ngày: 2026-03-16

---

## 1. Paperclip là gì?

Paperclip AI là một **local-first AI agent orchestration framework**. Nó tạo ra một "công ty ảo" với các agent (CEO, Engineer, PM...) có thể tự quản lý task board, viết code, và fix bug thông qua Claude CLI.

- GitHub: 25.3k stars (tính đến 03/2026)
- npm: `paperclipai`
- Hoạt động hoàn toàn local, không cần cloud

---

## 2. Cài đặt

```powershell
# Cài global
npm install -g paperclipai

# Khởi tạo (tạo folder companies/, cấu hình, v.v.)
npx paperclipai init

# Start server (default port 3100)
npx paperclipai start
```

### Chỉ định port khác

```powershell
npx paperclipai start --port 3101
```

---

## 3. Yêu cầu bắt buộc

### Claude CLI phải có trong PATH

```powershell
# QUAN TRỌNG: Mỗi terminal mới PHẢI chạy lệnh này trước
$env:Path = "$(npm config get prefix);$env:Path"

# Kiểm tra
where.exe claude
# Expect: C:\Users\<user>\AppData\Roaming\npm\claude.cmd
```

### Claude CLI phải đã xác thực

```powershell
claude auth login
# Mở browser → đăng nhập Claude → xác nhận
# Yêu cầu: Claude Pro subscription
```

### Kiểm tra Claude CLI hoạt động

```powershell
claude --model claude-sonnet-4-6 -p "Reply: OK" --output-format text
```

---

## 4. Model compatibility (RẤT QUAN TRỌNG)

| Model | Claude CLI | Ghi chú |
|-------|-----------|---------|
| `claude-sonnet-4-6` | ✅ Hoạt động | Mặc định, ổn định nhất |
| `claude-opus-4-0` | ✅ Hoạt động | Đắt nhất (~$1.5/heartbeat) |
| `claude-haiku-4-5` | ✅ Hoạt động | Rẻ nhất, chạy được |
| `claude-3-5-haiku` / `haiku-3.5` | ❌ KHÔNG chạy | Lỗi "model may not exist" |

> **LƯU Ý**: Paperclip có thể **override model** khi gọi CLI. Dù bạn set `haiku-4-5` trong API, CLI log có thể hiện `sonnet`. Đây là behavior của Paperclip, không phải bug config.

---

## 5. Cấu trúc thư mục

```
paperclip-poc/                    # Thư mục gốc (nơi chạy npx paperclipai)
├── companies/
│   └── <CompanyName>/
│       ├── agents/
│       │   ├── ceo/
│       │   │   ├── AGENTS.md     # ← File chỉ dẫn cho agent (QUAN TRỌNG)
│       │   │   ├── HEARTBEAT.md
│       │   │   ├── SOUL.md
│       │   │   └── TOOLS.md
│       │   └── engineer/
│       │       ├── AGENTS.md
│       │       ├── HEARTBEAT.md
│       │       └── ...
│       └── ...
└── ...
```

---

## 6. API Reference (Local Server)

Base URL: `http://127.0.0.1:<PORT>`

### Health check
```
GET /api/health
```

### Company
```
GET  /api/companies
POST /api/companies              { "name": "MyCompany" }
```

### Issues (Task Board)
```
GET  /api/companies/:companyId/issues
POST /api/companies/:companyId/issues    { "title": "...", "description": "...", "priority": "high", "status": "todo", "assigneeAgentId": "..." }
PATCH /api/issues/:issueId               { "status": "done" }
```

Status values: `todo`, `in_progress`, `done`, `cancelled`, `blocked`

### Agents
```
GET   /api/agents
GET   /api/agents/:agentId
PATCH /api/agents/:agentId       { "name": "Dev CTO", "role": "cto", "model": "claude-haiku-4-5" }
```

### Dashboard
```
GET /api/companies/:companyId/dashboard
```

---

## 7. Chạy Agent Heartbeat

Heartbeat = 1 lần agent "thức dậy", đọc board, và thực hiện công việc.

```powershell
# PHẢI set PATH trước
$env:Path = "$(npm config get prefix);$env:Path"

# cd vào folder chứa paperclip
cd "D:\path\to\paperclip-poc"

# Chạy heartbeat
npx paperclipai heartbeat run `
  --api-base http://127.0.0.1:3101 `
  --agent-id <AGENT_UUID> `
  --timeout-ms 300000
```

### Kết quả heartbeat

- `completed` — Agent hoàn thành, có output
- `timed_out` — Hết timeout, nhưng **có thể vẫn hoàn thành** (server chạy async)
- `queued` rồi stuck — Server xử lý ở background, check lại issue status sau
- `error` — Thường do Claude CLI không tìm thấy hoặc chưa auth

### Chi phí ước tính (per heartbeat)

| Model | Cost/heartbeat |
|-------|---------------|
| opus | ~$1.50 |
| sonnet | ~$0.10 |
| haiku-4-5 | ~$0.02-0.05 |

---

## 8. Viết AGENTS.md hiệu quả

`AGENTS.md` là file quan trọng nhất — nó cho agent biết context và cách làm việc.

### Template tốt (đã test thực tế):

```markdown
You are the <Role Name> — <mô tả ngắn>.

Your job: <mô tả cụ thể nhiệm vụ>.

## workspace

All projects live under `<đường dẫn tuyệt đối>`:
- `folder1/` — Mô tả (tech stack, port)
- `folder2/` — Mô tả

## Rules

1. Check the board for todo issues. Pick the top one.
2. Read the actual code files before making changes.
3. Make small, focused changes. One issue = one fix.
4. Test your changes.
5. Mark the issue as `done` when complete.
6. If blocked, write a comment explaining why.
7. NEVER create meta-issues or bureaucratic tickets.

## Safety

- Never exfiltrate secrets or private data.
- No destructive commands unless explicitly requested.
```

### Anti-patterns (TRÁNH):

- ❌ Chỉ dẫn dài dòng, trừu tượng → agent sẽ tạo meta-tasks thay vì làm việc
- ❌ Không có workspace context → agent không biết code ở đâu
- ❌ Dùng `$AGENT_HOME` variables → agent thường không resolve đúng
- ❌ Yêu cầu "memory system", "daily notes" → waste tokens, không tạo giá trị

---

## 9. Tạo Issue hiệu quả (để agent thực sự fix được)

### Issue TỐT ✅

```json
{
  "title": "Add ADMIN_API_KEY auth to unprotected youtube-crew routes",
  "description": "File: D:\\Projects\\services\\youtube-crew\\src\\server.js\nRoutes /api/admin/trigger and /api/youtube-crew/trigger are missing ADMIN_API_KEY validation.\nFix: Add middleware that checks req.headers['x-api-key'] === process.env.ADMIN_API_KEY. Return 401 if missing.",
  "priority": "high",
  "status": "todo",
  "assigneeAgentId": "<engineer-uuid>"
}
```

Điểm tốt:
- Chỉ rõ **file path**
- Chỉ rõ **vấn đề cụ thể**
- Chỉ rõ **cách fix**

### Issue TỆ ❌

```json
{
  "title": "Improve security across all services",
  "description": "Review and improve security"
}
```

→ Agent sẽ tạo thêm sub-issues, viết reports, waste tokens.

---

## 10. Troubleshooting

### Agent báo "error" status
```powershell
# Kiểm tra Claude CLI
$env:Path = "$(npm config get prefix);$env:Path"
claude --version
claude auth status
```

### Heartbeat stuck ở "queued"
- Thường do run trước chưa cleanup
- Đợi 1-2 phút rồi thử lại
- Hoặc restart Paperclip server

### Agent không thấy issues (báo "0 assigned tasks")
- Kiểm tra `assigneeAgentId` có match agent ID không
- Kiểm tra issue status là `todo` (không phải `done`/`cancelled`)
```powershell
$issues = (Invoke-WebRequest -Uri "http://127.0.0.1:3101/api/companies/<companyId>/issues" -UseBasicParsing).Content | ConvertFrom-Json
$issues | Where-Object { $_.status -eq "todo" } | ForEach-Object { "$($_.identifier) [$($_.assigneeAgentId)] $($_.title)" }
```

### Agent tạo bureaucratic tickets thay vì code
- Viết lại `AGENTS.md` — bỏ các chỉ dẫn trừu tượng
- Thêm rule: "NEVER create meta-issues or process documents"
- Chỉ tạo issue cụ thể với file path + cách fix rõ ràng

### Paperclip server crash / không start
```powershell
# Kiểm tra port đã bị chiếm chưa
Get-NetTCPConnection -LocalPort 3101 -State Listen -ErrorAction SilentlyContinue

# Kill process chiếm port
Get-NetTCPConnection -LocalPort 3101 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Start lại
npx paperclipai start --port 3101
```

---

## 11. Workflow thực tế (đã verify)

```
1. Start server     →  npx paperclipai start --port 3101
2. Tạo company      →  POST /api/companies
3. Tạo agents       →  (Paperclip tự tạo khi init)
4. Viết AGENTS.md   →  Đưa workspace context vào
5. Tạo issue cụ thể →  POST /api/companies/:id/issues (với file path + cách fix)
6. Chạy heartbeat   →  npx paperclipai heartbeat run --agent-id <id>
7. Verify kết quả   →  Đọc file code xem đã thay đổi chưa
8. Repeat 5-7
```

---

## 12. Đánh giá thực tế

### Điểm mạnh
- Agent **thực sự viết code** khi issue đủ cụ thể
- Local-first, không phụ thuộc cloud
- Board management tự động

### Điểm yếu
- **Đắt** nếu dùng opus (~$1.5/heartbeat)
- Agent hay tạo "meta-tasks" thay vì code nếu chỉ dẫn không tốt
- Model override behavior — set haiku nhưng CLI có thể chạy sonnet
- Timeout handling kém — `timed_out` nhưng thực ra vẫn chạy ở background
- Community feedback: "autonomy theater" — agent trông busy nhưng output thấp
- Bug "Process lost" khá phổ biến trên GitHub Issues

### Khi nào nên dùng
- ✅ Có issue cụ thể, file path rõ ràng, cách fix rõ ràng
- ✅ Batch processing nhiều fix nhỏ tương tự nhau
- ✅ Muốn delegate code cho AI mà không cần babysit

### Khi nào KHÔNG nên dùng
- ❌ Task mơ hồ, cần creative thinking
- ❌ Refactor lớn, cross-file changes phức tạp
- ❌ Kỳ vọng "autonomous company" — nó chưa đến level đó

---

## 13. IDs hiện tại (SoloForge instance)

| Resource | ID |
|----------|-----|
| Company (SoloForge) | `9a8c2565-9142-4361-b782-a86a75a7975c` |
| Company (SABO) | `7dcccb34-6642-4186-8ac7-e699156b0949` |
| Project | `b7773e6e-1188-41d7-810a-1fe9eb6d240d` |
| Dev CTO Agent | `46b63e30-d40d-43d5-8002-9415a4296d54` |
| Engineer Agent | `b76c2d0b-9f46-4502-a489-026a3d2ff7d9` |
| Server Port | `3100` (default, dùng `paperclipai run`) |
| Adapter | `claude_local` |
| Start command | `npx paperclipai run` (không phải `start`) |

---

## 14. Quick Commands Cheat Sheet

```powershell
# === SETUP (mỗi terminal mới) ===
$env:Path = "$(npm config get prefix);$env:Path"

# === SERVER ===
npx paperclipai start --port 3101                                    # Start
(Invoke-WebRequest -Uri http://127.0.0.1:3101/api/health).Content    # Health check

# === BOARD ===
# Xem tất cả issues
(Invoke-WebRequest -Uri "http://127.0.0.1:3101/api/companies/<CID>/issues" -UseBasicParsing).Content | ConvertFrom-Json | Where-Object { $_.status -eq "todo" }

# Tạo issue
Invoke-WebRequest -Uri "http://127.0.0.1:3101/api/companies/<CID>/issues" -Method POST -Body '{"title":"...","description":"...","priority":"high","status":"todo","assigneeAgentId":"<AID>"}' -ContentType "application/json" -UseBasicParsing

# Update issue status
Invoke-WebRequest -Uri "http://127.0.0.1:3101/api/issues/<IID>" -Method PATCH -Body '{"status":"done"}' -ContentType "application/json" -UseBasicParsing

# === AGENTS ===
# Update model
Invoke-WebRequest -Uri "http://127.0.0.1:3101/api/agents/<AID>" -Method PATCH -Body '{"model":"claude-haiku-4-5"}' -ContentType "application/json" -UseBasicParsing

# Run heartbeat
cd "<paperclip-folder>"
npx paperclipai heartbeat run --api-base http://127.0.0.1:3101 --agent-id <AID> --timeout-ms 300000 2>&1
```
