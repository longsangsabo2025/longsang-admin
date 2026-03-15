# VS CODE / WINDSURF + AI MODELS WORKFLOW GUIDE

> **Tài liệu Foundation #5**  
> **Dự án:** Kênh Lý Blạck  
> **Cập nhật:** Tháng 1, 2026  
> **IDE:** Windsurf (VS Code based)  
> **AI Models:** Claude Opus 4.5, GPT-5, Gemini

---

## 1. TỔNG QUAN SETUP

### 1.1 Tech Stack hiện tại

| Thành phần | Tool | Ghi chú |
|------------|------|---------|
| **IDE** | Windsurf | VS Code fork với Cascade AI |
| **AI Assistant** | Cascade | Agentic AI tích hợp sẵn |
| **AI Models** | Claude Opus 4.5, GPT-5, Gemini | Premium models |
| **Content Tool** | Poppy AI | Visual AI workspace |
| **Video Tool** | Higgsfield AI | Video generation |

### 1.2 Tại sao Windsurf cho Content Creator?

```
WINDSURF ADVANTAGES:
├── Cascade AI tích hợp sẵn (không cần extension riêng)
├── Multi-file editing cùng lúc
├── Context awareness toàn bộ project
├── Memories & Rules - AI nhớ preferences của bạn
├── MCP (Model Context Protocol) - kết nối external tools
├── Browser Preview tích hợp
└── VS Code compatible - mọi extension đều hoạt động
```

---

## 2. WINDSURF CASCADE - MASTER GUIDE

### 2.1 Cascade là gì?

**Cascade** là AI assistant của Windsurf với khả năng:
- **Agentic**: Tự động thực hiện chuỗi actions
- **Context-aware**: Hiểu toàn bộ codebase/project
- **Multi-modal**: Text, code, files, terminal
- **Tool calling**: Đọc/ghi files, chạy commands, search web

### 2.2 Keyboard Shortcuts quan trọng

| Shortcut | Chức năng |
|----------|-----------|
| `Ctrl/Cmd + L` | Mở Cascade panel |
| `Ctrl/Cmd + I` | Inline edit (edit tại chỗ) |
| `Ctrl/Cmd + .` | Chuyển mode (Code/Plan/Ask) |
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + Shift + V` | Preview Markdown |
| `Ctrl/Cmd + K + V` | Preview Markdown side-by-side |
| `Tab` | Accept autocomplete |
| `Esc` | Dismiss suggestion |

### 2.3 Ba chế độ Cascade

| Mode | Mục đích | Tools |
|------|----------|-------|
| **Code** | Viết/edit code, refactoring | All tools |
| **Plan** | Lên kế hoạch phức tạp | All tools |
| **Ask** | Hỏi đáp, học hỏi | Search only |

**Khi nào dùng mode nào:**

```
CODE MODE (Ctrl+. → Code):
├── Viết scripts mới
├── Edit files có sẵn
├── Refactor content
└── Generate batch content

PLAN MODE (Ctrl+. → Plan):
├── Lên content calendar
├── Thiết kế workflow phức tạp
├── Brainstorm strategy
└── Multi-step projects

ASK MODE (Ctrl+. → Ask):
├── Hỏi về cách làm
├── Research information
├── Giải thích concepts
└── Không muốn AI edit files
```

### 2.4 @-Mentions trong Cascade

Dùng @ để reference context cụ thể:

| @-mention | Mục đích |
|-----------|----------|
| `@file.md` | Reference file cụ thể |
| `@folder/` | Reference cả folder |
| `@codebase` | Search toàn bộ project |
| `@docs` | Search documentation |
| `@web` | Search internet |
| `@terminal` | Reference terminal output |
| `@problems` | Reference linting errors |

**Ví dụ cho Lý Blạck:**
```
@02-LY-BLACK-CHARACTER-BIBLE.md Viết 5 scripts thơ chế 
về chủ đề deadline dựa trên character guidelines này
```

### 2.5 Memories & Rules

**Memories** - AI tự động nhớ context quan trọng:
```
Cascade sẽ tự động lưu:
├── Project structure
├── Coding patterns bạn hay dùng
├── Preferences (format, style)
└── Previous decisions
```

**Rules** - Bạn định nghĩa rules cho AI:

**Tạo Global Rules:**
1. `Ctrl/Cmd + Shift + P` → "Windsurf: Open Global Rules"
2. Thêm rules

**Tạo Workspace Rules:**
1. Tạo file `.windsurf/rules.md` trong project
2. Hoặc `.windsurfrules` ở root

**Rules cho Lý Blạck project:**

```markdown
# Lý Blạck Project Rules

## Ngôn ngữ
- Viết content bằng tiếng Việt
- Technical docs có thể dùng tiếng Anh
- Comments trong code bằng tiếng Việt

## Content Style
- Luôn giữ giọng điệu Lý Blạck khi viết scripts
- Thơ chế theo format: 3 câu nghiêm túc + 1 câu twist
- Videos ngắn: 15-30 giây

## File Organization
- Scripts lưu trong /scripts/
- Docs lưu trong /docs/
- Assets lưu trong /assets/

## Naming Convention
- Scripts: YYYY-MM-DD_[topic]_v[version].md
- Docs: [number]-[NAME-IN-CAPS].md
```

---

## 3. AI MODELS - CHỌN ĐÚNG MODEL CHO ĐÚNG VIỆC

### 3.1 So sánh các models

| Model | Điểm mạnh | Điểm yếu | Dùng khi |
|-------|-----------|----------|----------|
| **Claude Opus 4.5** | Reasoning sâu, creative, an toàn | Chậm hơn, đắt hơn | Creative writing, strategy |
| **GPT-5** | Nhanh, đa năng, tool calling tốt | Đôi khi generic | General tasks, coding |
| **Gemini** | Context dài, multimodal | Ít creative hơn | Research, analysis |

### 3.2 Model cho từng task Lý Blạck

```
CONTENT CREATION (Claude Opus 4.5 recommended):
├── Viết thơ chế
├── Creative scripts
├── Character voice
├── Triết lý bựa
└── Caption sáng tạo

RESEARCH & ANALYSIS (Gemini recommended):
├── Phân tích trends
├── Research competitors
├── Tổng hợp thông tin
└── Xử lý nhiều data

AUTOMATION & CODING (GPT-5 recommended):
├── Viết automation scripts
├── n8n workflows
├── API integrations
└── Quick iterations

GENERAL TASKS (Any model):
├── Edit/format content
├── Translate
├── Summarize
└── Q&A
```

### 3.3 Prompt Engineering cho từng model

**Claude Opus 4.5 - Chi tiết và có structure:**
```
Bạn là Lý Blạck, tiên nhân 1300 tuổi.

## Task
Viết 5 bài thơ chế về [CHỦ ĐỀ]

## Format mỗi bài
- Thể: Thất ngôn tứ tuyệt (4 câu, 7 chữ)
- 3 câu đầu: Cổ điển, nghiêm túc
- Câu cuối: Twist hài hước Gen Z

## Tone
- Như cao nhân dạy đệ tử
- Chậm rãi, từ tốn
- Wisdom nhưng relatable

## Output
[Thơ 1]
---
[Thơ 2]
...
```

**GPT-5 - Ngắn gọn, action-oriented:**
```
Task: Generate 5 Lý Blạck poems about [TOPIC]
Style: Classical Chinese poetry with Gen Z twist ending
Output: 4 lines each, Vietnamese, numbered list
```

**Gemini - Research-focused:**
```
Research task: Analyze top 10 viral Chinese costume comedy videos on TikTok

Find:
1. Common hooks (first 2 seconds)
2. Video structure patterns
3. Music choices
4. Engagement triggers

Output: Structured report with specific examples
```

---

## 4. EXTENSIONS CẦN THIẾT

### 4.1 Markdown & Writing

| Extension | Mục đích | Link |
|-----------|----------|------|
| **Markdown All in One** | Shortcuts, TOC, preview | [Link](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) |
| **markdownlint** | Lint & format markdown | [Link](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) |
| **Word Count** | Đếm từ | Built-in hoặc extension |
| **Code Spell Checker** | Check spelling | [Link](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) |

### 4.2 Productivity

| Extension | Mục đích |
|-----------|----------|
| **GitLens** | Git history, blame |
| **Project Manager** | Switch projects nhanh |
| **Todo Tree** | Track TODOs trong code |
| **Bookmarks** | Bookmark vị trí quan trọng |

### 4.3 Content Creation

| Extension | Mục đích |
|-----------|----------|
| **Emojisense** | Thêm emoji nhanh |
| **Paste Image** | Paste ảnh vào markdown |
| **Draw.io Integration** | Vẽ diagrams |
| **Mermaid Preview** | Preview Mermaid diagrams |

### 4.4 Cài đặt extensions

```bash
# Cách 1: Command Palette
Ctrl+Shift+P → "Extensions: Install Extension" → Search

# Cách 2: Sidebar
Click Extensions icon (Ctrl+Shift+X) → Search → Install

# Cách 3: Command line
windsurf --install-extension yzhang.markdown-all-in-one
```

---

## 5. PROJECT STRUCTURE CHO LÝ BLẠCK

### 5.1 Folder structure đề xuất

```
LyBlack-Content/
├── .windsurf/
│   └── rules.md              # AI rules cho project
├── docs/
│   ├── 01-HIGGSFIELD-AI-TOOLS-GUIDE.md
│   ├── 02-LY-BLACK-CHARACTER-BIBLE.md
│   ├── 03-AUTOMATION-SYSTEM-A-TO-Z.md
│   ├── 04-POPPY-AI-MASTERY-GUIDE.md
│   └── 05-VSCODE-WINDSURF-AI-WORKFLOW.md
├── scripts/
│   ├── tho-black/            # Scripts thơ chế
│   │   ├── 2026-01/
│   │   └── 2026-02/
│   ├── reactions/            # Scripts reactions
│   └── wisdom/               # Scripts triết lý
├── assets/
│   ├── character/            # Ảnh Lý Blạck
│   ├── thumbnails/           # Thumbnails
│   └── music/                # Reference nhạc
├── templates/
│   ├── script-template.md    # Template script
│   └── content-calendar.md   # Template calendar
├── analytics/
│   └── weekly-reports/       # Reports hàng tuần
├── automation/
│   ├── n8n-workflows/        # n8n workflow exports
│   └── prompts/              # Saved prompts
└── README.md
```

### 5.2 Tạo structure với Cascade

Prompt cho Cascade:
```
Tạo folder structure cho project Lý Blạck content:
- docs/ cho documentation
- scripts/ với subfolders cho mỗi content type
- assets/ cho media
- templates/ cho templates
- analytics/ cho reports
- automation/ cho workflows

Tạo README.md mô tả project
```

---

## 6. WORKFLOWS TRONG WINDSURF

### 6.1 Workflow 1: Viết batch scripts

**Step 1: Mở project**
```
File → Open Folder → LyBlack-Content
```

**Step 2: Tạo scripts với Cascade**
```
Ctrl+L mở Cascade

Prompt:
@02-LY-BLACK-CHARACTER-BIBLE.md 

Viết 7 scripts thơ chế cho tuần này về các chủ đề:
1. Monday blues
2. Deadline cuối tuần
3. Crush không reply
4. Ví rỗng cuối tháng
5. Họp online
6. Code bug
7. Gym motivation

Mỗi script theo format chuẩn trong character bible.
Lưu vào scripts/tho-black/2026-01/
```

**Step 3: Review và edit**
```
- Cascade sẽ tạo files
- Review từng file
- Dùng Ctrl+I để inline edit nếu cần
```

### 6.2 Workflow 2: Research với @web

**Step 1: Ask mode**
```
Ctrl+. → Chọn Ask mode
```

**Step 2: Research**
```
@web Tìm 5 video cổ trang hài viral nhất trên TikTok 
tháng này. Phân tích hook và structure của chúng.
```

**Step 3: Apply learnings**
```
Chuyển sang Code mode (Ctrl+.)

Dựa trên research trên, viết 3 scripts Lý Blạck 
áp dụng các patterns viral đã học
```

### 6.3 Workflow 3: Content Calendar

**Step 1: Plan mode**
```
Ctrl+. → Plan mode
```

**Step 2: Lên kế hoạch**
```
Lên content calendar cho tháng 2/2026:
- 2 videos/ngày (60 videos tổng)
- Phân bổ: 40% Thơ, 35% Reactions, 25% Wisdom
- Peak times: 12:00 và 19:00
- Tránh overlap chủ đề

Output: Markdown table với đầy đủ thông tin
Lưu vào: templates/content-calendar-2026-02.md
```

### 6.4 Workflow 4: Edit existing content

**Step 1: Mở file cần edit**
```
Ctrl+P → Tìm file → Enter
```

**Step 2: Select và edit**
```
Select đoạn cần edit
Ctrl+I (inline edit)

Prompt: "Làm câu twist hài hước hơn, 
thêm reference đến ChatGPT"
```

**Step 3: Accept hoặc reject**
```
Review diff
Tab để accept
Esc để reject
```

---

## 7. MCP (MODEL CONTEXT PROTOCOL)

### 7.1 MCP là gì?

MCP cho phép Cascade kết nối với external tools:
- Memory systems
- Web search
- Database
- Custom tools

### 7.2 Cấu hình MCP cho Lý Blạck

**File:** `~/.windsurf/mcp_config.json` (Windows: `%USERPROFILE%\.windsurf\`)

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-memory"],
      "env": {}
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-sequential-thinking"]
    }
  }
}
```

### 7.3 Sử dụng MCP tools

Sau khi config, Cascade có thể:
- Lưu và recall memories
- Search web với Brave
- Suy nghĩ step-by-step

---

## 8. TIPS & TRICKS

### 8.1 Productivity tips

**Multi-cursor editing:**
```
Alt+Click           → Thêm cursor
Ctrl+Alt+↑/↓       → Thêm cursor trên/dưới
Ctrl+D             → Select next occurrence
Ctrl+Shift+L       → Select all occurrences
```

**Quick navigation:**
```
Ctrl+P             → Quick open file
Ctrl+G             → Go to line
Ctrl+Shift+O       → Go to symbol
Ctrl+Tab           → Switch tabs
```

**Zen mode:**
```
Ctrl+K Z           → Zen mode (focus writing)
Esc Esc            → Exit zen mode
```

### 8.2 Markdown shortcuts (với Markdown All in One)

```
Ctrl+B             → Bold
Ctrl+I             → Italic
Alt+C              → Check/uncheck task
Ctrl+Shift+]       → Heading up
Ctrl+Shift+[       → Heading down
```

### 8.3 Cascade power tips

**Tip 1: Revert changes**
```
Nếu Cascade edit sai:
- Click "Revert" trong Cascade panel
- Hoặc Ctrl+Z (undo)
- Hoặc checkpoint system
```

**Tip 2: Continue conversation**
```
Nếu Cascade dừng giữa chừng:
- Click "Continue" button
- Hoặc type "continue" và Enter
```

**Tip 3: Reference previous chats**
```
@conversation      → Reference chat trước
```

**Tip 4: Send problems**
```
Ctrl+Shift+M       → Problems panel
Right-click → Send to Cascade
```

### 8.4 Snippets cho Lý Blạck

**Tạo snippets:** File → Preferences → Configure User Snippets → markdown.json

```json
{
  "Lý Blạck Script Template": {
    "prefix": "lyblack-script",
    "body": [
      "# ${1:Tên Video}",
      "",
      "## HOOK (0-2s)",
      "[${2:Visual description}]",
      "Text: \"${3:Hook text}\"",
      "",
      "## BODY (2-10s)",
      "[${4:Cảnh}]",
      "",
      "**GIỌNG LÝ BLẠCK:**",
      "\"${5:Thơ/Triết lý}\"",
      "",
      "## TWIST (10-15s)",
      "[Zoom vào mặt]",
      "\"${6:Câu twist}\"",
      "",
      "## OUTRO",
      "Text: \"Follow để tu luyện mỗi ngày\"",
      "",
      "---",
      "**Biểu cảm:** ${7:Nghiêm túc}",
      "**Cảnh:** ${8:Rừng trúc}",
      "**Nhạc:** ${9:Guzheng nhẹ nhàng}"
    ],
    "description": "Template cho script video Lý Blạck"
  },
  "Thơ Chế Template": {
    "prefix": "lyblack-tho",
    "body": [
      "### ${1:Tên bài thơ}",
      "",
      "${2:Câu 1 - nghiêm túc}",
      "${3:Câu 2 - nghiêm túc}",
      "${4:Câu 3 - nghiêm túc}",
      "${5:Câu 4 - TWIST hài hước}",
      "",
      "---",
      "*Chủ đề: ${6:deadline}*"
    ],
    "description": "Template cho thơ chế Lý Blạck"
  }
}
```

**Sử dụng:**
```
Type "lyblack-script" → Tab → Fill placeholders
Type "lyblack-tho" → Tab → Fill placeholders
```

---

## 9. INTEGRATION VỚI POPPY AI

### 9.1 Workflow: Windsurf → Poppy → Windsurf

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WINDSURF   │────▶│  POPPY AI   │────▶│  WINDSURF   │
│             │     │             │     │             │
│ Write draft │     │ Expand &    │     │ Finalize &  │
│ scripts     │     │ Repurpose   │     │ Organize    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Step 1: Draft trong Windsurf**
```
Viết draft scripts với Cascade
Export sang Poppy (copy/paste)
```

**Step 2: Expand trong Poppy**
```
Dùng Poppy để:
- Repurpose thành nhiều formats
- Visual brainstorming
- Generate variations
```

**Step 3: Import lại Windsurf**
```
Copy final content từ Poppy
Paste vào Windsurf
Organize vào đúng folders
Git commit để track changes
```

### 9.2 Khi nào dùng tool nào?

| Task | Windsurf | Poppy AI |
|------|----------|----------|
| Quick scripts | ✅ | |
| Batch generation | ✅ | |
| Visual brainstorm | | ✅ |
| Content repurposing | | ✅ |
| File organization | ✅ | |
| Long-term storage | ✅ (Git) | ✅ (Boards) |
| Research | ✅ (@web) | ✅ (Video analysis) |
| Team collab | ✅ | ✅ |

---

## 10. GIT WORKFLOW

### 10.1 Tại sao dùng Git?

- **Version control:** Quay lại version cũ
- **Backup:** Sync lên GitHub/GitLab
- **Collaboration:** Team làm việc cùng
- **History:** Track mọi thay đổi

### 10.2 Setup Git cho project

```bash
# Initialize
cd LyBlack-Content
git init

# Gitignore
echo ".DS_Store" >> .gitignore
echo "*.log" >> .gitignore
echo "node_modules/" >> .gitignore

# First commit
git add .
git commit -m "Initial commit: Foundation docs"
```

### 10.3 Daily Git workflow

```bash
# Sau mỗi session làm việc:
git add .
git commit -m "Add 7 scripts for week 1"

# Push to remote (nếu có):
git push origin main
```

### 10.4 Git trong Windsurf

```
Ctrl+Shift+G       → Source Control panel
+                  → Stage changes
✓                  → Commit
...→Push           → Push to remote
```

---

## 11. DAILY ROUTINE TRONG WINDSURF

### 11.1 Morning Setup (5 phút)

```
1. Mở Windsurf
2. Ctrl+Shift+G → Git pull (nếu team)
3. Ctrl+L → Cascade: "Hôm nay cần làm gì theo content calendar?"
4. Review TODO list
```

### 11.2 Content Creation Session (1-2 giờ)

```
1. Mở templates/content-calendar.md
2. Xác định scripts cần viết hôm nay
3. Cascade (Plan mode): Lên outline
4. Cascade (Code mode): Generate scripts
5. Review và edit
6. Git commit
```

### 11.3 End of Day (5 phút)

```
1. Git add & commit changes
2. Update content calendar (mark done)
3. Note bất kỳ ideas mới vào Ideas.md
4. Ctrl+Shift+G → Push
```

---

## 12. TROUBLESHOOTING

### 12.1 Common issues

| Issue | Solution |
|-------|----------|
| Cascade không respond | Refresh (Ctrl+Shift+P → "Reload Window") |
| Extension không hoạt động | Disable → Enable lại |
| Git conflict | Mở Source Control, resolve conflicts |
| Slow performance | Đóng extensions không cần |
| Markdown preview lỗi | Ctrl+Shift+P → "Markdown: Refresh Preview" |

### 12.2 Reset Windsurf settings

```bash
# Windows
%APPDATA%\Windsurf\User\settings.json

# macOS
~/Library/Application Support/Windsurf/User/settings.json

# Backup và delete để reset
```

### 12.3 Xem logs

```
Ctrl+Shift+U → Output panel
Chọn "Windsurf" từ dropdown
```

---

## 13. CHECKLIST SETUP

### Week 1: Basic Setup
- [ ] Cài Windsurf từ windsurf.com
- [ ] Import VS Code settings (nếu có)
- [ ] Cài extensions cần thiết
- [ ] Tạo folder structure
- [ ] Setup .windsurf/rules.md
- [ ] Init Git repository
- [ ] Tạo snippets

### Week 2: Workflow Optimization
- [ ] Practice Cascade modes
- [ ] Setup MCP config
- [ ] Tạo templates
- [ ] Test batch generation
- [ ] Integrate với Poppy workflow

### Week 3+: Advanced
- [ ] Custom keyboard shortcuts
- [ ] Advanced Git workflow
- [ ] Team collaboration (nếu có)
- [ ] Automation scripts

---

## 14. RESOURCES

### 14.1 Links quan trọng

| Resource | Link |
|----------|------|
| Windsurf Docs | https://docs.windsurf.com |
| Windsurf Download | https://windsurf.com/editor |
| VS Code Docs | https://code.visualstudio.com/docs |
| Markdown Guide | https://www.markdownguide.org |

### 14.2 Keyboard cheat sheet

```
ESSENTIAL SHORTCUTS
──────────────────────────────
Ctrl+L          Open Cascade
Ctrl+I          Inline edit
Ctrl+.          Switch Cascade mode
Ctrl+P          Quick open file
Ctrl+Shift+P    Command palette
Ctrl+Shift+F    Search in files
Ctrl+Shift+G    Git panel
Ctrl+`          Terminal
Ctrl+B          Toggle sidebar
Ctrl+K Z        Zen mode

MARKDOWN (với extension)
──────────────────────────────
Ctrl+B          Bold
Ctrl+I          Italic
Ctrl+Shift+V    Preview
```

---

> **Ghi chú:** Windsurf + Cascade là combo mạnh mẽ cho content creation. Key là tận dụng @-mentions, Rules, và chọn đúng Cascade mode cho từng task.

---

*Tài liệu thuộc Dự án Lý Blạck - Foundation Document #5*
