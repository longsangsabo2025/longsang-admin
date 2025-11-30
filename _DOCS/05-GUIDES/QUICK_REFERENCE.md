# ⚡ Quick Reference - AI Command Center

## 🎯 Cách Sử Dụng Nhanh

### 1️⃣ Gõ Command

**Vị trí:** Command Input box ở top của AI Command Center

**Ví dụ commands:**

```
✅ "Tạo bài post về dự án Vũng Tàu"
✅ "Backup database hôm nay"
✅ "Thống kê workflow tuần này"
✅ "Tạo SEO content cho trang chủ"
✅ "Lên lịch post Facebook 9h sáng mai"
```

---

### 2️⃣ Xem Kết Quả

**Sau khi gõ command:**

1. Loading spinner xuất hiện
2. AI phân tích command
3. Workflow được tạo
4. Hiển thị preview và actions

**Actions có sẵn:**

- ✅ **Tạo trong n8n** - Tạo workflow trong n8n để edit/activate
- ✅ **Test** - Chạy test execution
- ✅ **Lên lịch** - Schedule workflow

---

### 3️⃣ Proactive Suggestions

**AI tự động đề xuất:**

- Hiển thị ở top của page
- Priority: High / Medium / Low
- One-click execute

**Ví dụ:**

```
💡 Có 5 leads mới chưa follow up
   [Chạy Workflow] [Bỏ qua]
```

---

### 4️⃣ Intelligent Alerts

**AI phát hiện:**

- Anomalies (success rate drop)
- Opportunities (trending keywords)
- Warnings (resource limits)

**Actions:**

- Click để resolve
- Execute suggested workflow

---

### 5️⃣ Command Palette (Cmd+K)

**Shortcut:** `Cmd+K` (Mac) hoặc `Ctrl+K` (Windows)

**Features:**

- Quick command launcher
- Command history
- Suggestions

---

## 📋 Available Commands

### Post Creation

```
"Tạo bài post về [topic]"
"Tạo bài post [platform] về [topic]"
"Tạo bài post [tone] về [topic]"
```

### Database

```
"Backup database"
"Backup database [project]"
```

### Analytics

```
"Thống kê hôm nay"
"Thống kê tuần này"
"Thống kê workflow"
```

### SEO

```
"Tạo SEO content cho [page]"
"Generate SEO cho [topic]"
```

### Scheduling

```
"Lên lịch post [time]"
"Schedule workflow [name]"
```

### Custom Workflow

```
"Tạo workflow [name] để [description]"
```

---

## 🎨 UI Components

### ProactiveSuggestionsPanel

- **Location:** Top of page
- **Shows:** AI suggestions
- **Actions:** Execute, Dismiss

### IntelligentAlerts

- **Location:** Below suggestions
- **Shows:** Alerts by severity
- **Actions:** Resolve, Execute

### CommandInput

- **Location:** Below alerts
- **Features:** Input, autocomplete, history
- **Action:** Send command

### CommandPalette

- **Shortcut:** Cmd+K / Ctrl+K
- **Features:** Quick launcher, history

### MultiAgentOrchestrator

- **Location:** Agents tab
- **Shows:** Multi-agent coordination

### WorkflowOptimizer

- **Location:** Workflows > Builder tab
- **Shows:** Metrics, optimizations

---

## 🔄 Workflow

```
User Input
    ↓
AI Parse (OpenAI Function Calling)
    ↓
Load Business Context
    ↓
Generate Workflow
    ↓
Context-Aware Customization
    ↓
Return to Frontend
    ↓
User Actions (Create/Test/Schedule)
```

---

## 💡 Tips

1. **Be specific:** "Tạo bài post về dự án Vũng Tàu" tốt hơn "Tạo post"
2. **Use context:** System tự động load project info
3. **Check suggestions:** AI tự động đề xuất actions
4. **Monitor alerts:** AI phát hiện issues và opportunities
5. **Use Command Palette:** Cmd+K để quick access

---

## 🚀 Quick Start

1. Open: `http://localhost:8080/admin/ai-center`
2. Gõ command vào Command Input
3. Xem kết quả và chọn action
4. Workflow được tạo trong n8n
5. Activate và enjoy! ✨

---

## 📚 More Info

- **Detailed Example:** `WORKFLOW_EXAMPLE.md`
- **Step-by-Step:** `WORKFLOW_EXAMPLE_DETAILED.md`
- **API Docs:** Check `api/routes/ai-command.js`
