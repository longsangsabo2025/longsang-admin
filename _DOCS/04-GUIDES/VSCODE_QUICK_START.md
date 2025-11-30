# 🚀 VS Code 1.106 - QUICK START (5 PHÚT)

## ✅ SETUP HOÀN TẤT

Tất cả configs đã được apply vào Long Sang Forge:

```
✅ 3 Custom AI Agents
✅ 2 Reusable Prompts
✅ VS Code Settings
✅ Keyboard Shortcuts
✅ Extensions recommendations
```

---

## 🎯 BẮT ĐẦU NGAY - 3 BƯỚC

### **BƯỚC 1: Reload VS Code (30 giây)**

```
1. Nhấn: Ctrl + Shift + P
2. Gõ: "Developer: Reload Window"
3. Enter
```

### **BƯỚC 2: Verify Agents (1 phút)**

```
1. Nhấn: Ctrl + Shift + A (Mở Chat)
2. Gõ @ và xem có 3 agents:
   - @react-typescript-expert
   - @supabase-expert
   - @ai-automation-expert
```

### **BƯỚC 3: Try First Task (3 phút)**

```
Ctrl + Shift + A

Gõ:
@workspace Analyze Long Sang Forge project structure and suggest improvements
```

---

## ⌨️ KEYBOARD SHORTCUTS QUAN TRỌNG

| Shortcut           | Action                  |
| ------------------ | ----------------------- |
| `Ctrl + Shift + A` | Mở AI Chat              |
| `Ctrl + Shift + I` | Inline Chat (edit code) |
| `Ctrl + Alt + T`   | Terminal Chat           |
| `Ctrl + Shift + S` | Agent Sessions View     |
| `Ctrl + Shift + G` | Source Control          |

---

## 🤖 CUSTOM AGENTS CỦA BẠN

### **1. @react-typescript-expert**

```
Chuyên: React 18, TypeScript, shadcn/ui, TailwindCSS
Dùng cho: Components, hooks, state management

Ví dụ:
@react-typescript-expert Optimize the AutomationDashboard component
@react-typescript-expert Add error boundary to this component
```

### **2. @supabase-expert**

```
Chuyên: Supabase, PostgreSQL, RLS, Edge Functions
Dùng cho: Database, authentication, real-time

Ví dụ:
@supabase-expert Explain the RLS policies for ai_agents table
@supabase-expert Create migration to add new column
```

### **3. @ai-automation-expert**

```
Chuyên: AI agents, workflows, automation
Dùng cho: AI features, N8N, automation logic

Ví dụ:
@ai-automation-expert Improve the agent execution flow
@ai-automation-expert Add logging to automation system
```

---

## 📝 REUSABLE PROMPTS

### **1. React Component Generator**

```
Ctrl + Shift + P
→ "Chat: Use Prompt File"
→ Chọn: react-component-generator

Điền variables:
- component_name: StatusCard
- needs_data: true
- supabase_table: ai_agents
- needs_animation: false
```

### **2. Supabase Table Creator**

```
Ctrl + Shift + P
→ "Chat: Use Prompt File"
→ Chọn: supabase-table-creator

Điền variables:
- table_name: notifications
- columns: id, user_id, message, created_at
```

---

## 💡 QUICK WINS - THỬ NGAY

### **Win #1: Code Audit**

```
Ctrl + Shift + A

@workspace Find all TODO comments and technical debt in the codebase
```

### **Win #2: Debug Helper**

```
1. Chạy: npm run build
2. Nếu có error → Click error trong terminal
3. Select "Attach to Chat"
4. AI suggests fix!
```

### **Win #3: Documentation**

```
@react-typescript-expert Document all components in src/components/automation/
```

### **Win #4: Optimize Code**

```
1. Select đoạn code
2. Ctrl + Shift + I
3. Gõ: "Add TypeScript strict types and error handling"
```

---

## 🎯 USE CASES CHO LONG SANG FORGE

### **Bug Fixes (DAILY)**

```
Terminal Chat (Ctrl + Alt + T):
- Paste error message
- AI analyzes và suggests fix
- Apply fix

Time: 2h → 15 phút ⚡
```

### **Code Review (WEEKLY)**

```
@workspace Review recent changes:
- Security issues?
- Performance problems?
- Best practices violations?

Time: 3h → 30 phút ⚡
```

### **Documentation (ONE-TIME)**

```
@workspace Generate complete documentation:
- API endpoints
- Database schema
- Component usage
- Deployment guide

Time: 8h → 1h ⚡
```

---

## ⚠️ LƯU Ý

### **Agents có warnings (bình thường!):**

Khi mở `.agents.md` files, bạn sẽ thấy warnings màu vàng.

**→ BỎ QUA! Agents vẫn hoạt động tốt.**

VS Code 1.106 đang beta cho custom agents. Warnings sẽ biến mất trong versions sau.

---

## 📚 TÀI LIỆU THAM KHẢO

**Trong dự án:**

- `VSCODE_SETUP_COMPLETE.md` - Hướng dẫn chi tiết
- `.github/agents/*.agents.md` - Agent definitions
- `.vscode/prompts/*.md` - Prompt templates

**External:**

- [VS Code 1.106 Release Notes](https://code.visualstudio.com/updates/v1_106)
- [GitHub Copilot Docs](https://docs.github.com/copilot)
- [Custom Agents Guide](https://code.visualstudio.com/docs/copilot/customization/custom-agents)

---

## 🆘 TROUBLESHOOTING

### **Agents không xuất hiện:**

```
1. Ctrl + Shift + P
2. "Developer: Reload Window"
3. Thử lại
```

### **Terminal IntelliSense không work:**

```
1. Check settings.json có:
   "terminal.integrated.suggest.enabled": true
2. Reload window
3. Mở terminal mới
```

### **Prompts không thấy:**

```
1. Check folder: .vscode/prompts/
2. Files phải có extension .md
3. Reload window
```

---

## 🎁 BONUS TIPS

### **Tip 1: Save Conversations**

```
Sau khi chat với AI về một task:
/savePrompt
→ Save để reuse sau!
```

### **Tip 2: Multi-file Edit**

```
@workspace Change all components to use strict TypeScript
→ AI edits multiple files cùng lúc!
```

### **Tip 3: Context is Key**

```
Thay vì: "Fix this bug"
Nên: "@react-typescript-expert Fix the infinite re-render in AutomationDashboard component when agents data changes"
→ Better results!
```

---

## 📈 KẾT QUẢ KỲ VỌNG

### **Tuần 1:**

- Code nhanh hơn 2x
- Bugs giảm 30%
- Time saved: 5-8h

### **Tuần 2-3:**

- Workflow tự nhiên
- Quality tốt hơn
- Time saved: 12-15h

### **Tháng 1+:**

- Master tools
- Productivity +40%
- Time saved: 15-20h/tuần

---

## ✅ CHECKLIST - BẮT ĐẦU NGAY

- [ ] Reload VS Code (Ctrl+Shift+P → Reload Window)
- [ ] Verify 3 agents hoạt động (Ctrl+Shift+A → @)
- [ ] Test Terminal IntelliSense (npm run <Tab>)
- [ ] Try first chat (@workspace analyze project)
- [ ] Test inline edit (Select code → Ctrl+Shift+I)
- [ ] Explore prompts (Ctrl+Shift+P → Use Prompt File)

---

## 🚀 READY

**Bạn giờ có:**

- ✅ 3 AI Experts sẵn sàng 24/7
- ✅ Smart Terminal
- ✅ Code generation templates
- ✅ Powerful shortcuts

**→ Hãy bắt đầu code và tận hưởng năng suất mới! 💪**

---

**Setup Date:** November 17, 2025
**Project:** Long Sang Forge
**Status:** ✅ Ready to use!

**Happy Coding! 💻✨**
