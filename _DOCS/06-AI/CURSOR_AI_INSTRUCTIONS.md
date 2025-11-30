# 🤖 CURSOR AI INSTRUCTIONS - LongSang Admin

> **Mục tiêu:** X10 Productivity cho 1 người dùng (local development)
> **Không cần:** Deploy, Testing, CI/CD, Monitoring
> **Cần:** Automation, AI-powered features, Speed

---

## 📁 PROJECT CONTEXT

```yaml
Project: longsang-admin (Master Admin Dashboard)
Location: d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
Stack: 
  - Frontend: React + TypeScript + Vite + TailwindCSS + shadcn/ui
  - Backend: Express.js (api/server.js on port 3001)
  - Database: Supabase
  - Storage: Google Drive API
  - AI: OpenAI API (via OPENAI_API_KEY in .env)

Ports:
  - Frontend: 8080
  - API: 3001
  - OAuth: 3333

Key Files:
  - src/App.tsx - Router configuration
  - src/components/admin/AdminLayout.tsx - Sidebar navigation
  - api/server.js - API routes
  - .env - Environment variables
```

---

## 🎯 CURRENT TASK: AI Command Center

### Mô tả
Tạo AI Command Center - nơi user gõ lệnh bằng ngôn ngữ tự nhiên và AI thực hiện tự động.

### Ví dụ commands:
- "Tạo bài post về dự án Vũng Tàu" → AI generate content + schedule
- "Backup database" → Trigger backup
- "Tạo 5 bài SEO cho từ khóa bất động sản" → AI generate SEO articles
- "Đăng lên Facebook" → Post to social media
- "Thống kê hôm nay" → Show metrics

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Create AI Command API
**File:** `api/routes/ai-command.js`

```javascript
/**
 * AI Command Center API
 * Receives natural language commands, processes with OpenAI, executes actions
 */

const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Available actions the AI can execute
const AVAILABLE_ACTIONS = {
  'create_post': 'Generate social media post content',
  'schedule_post': 'Schedule a post to social media',
  'backup_database': 'Trigger database backup',
  'generate_seo': 'Generate SEO content',
  'get_stats': 'Get analytics/statistics',
  'upload_file': 'Upload file to Google Drive',
  'create_project': 'Create a new project',
  'send_notification': 'Send notification/reminder'
};

// POST /api/ai/command
router.post('/command', async (req, res) => {
  const { command, context } = req.body;
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Step 1: Parse command with AI
    const parseResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a command parser. Parse user commands and return JSON with:
          {
            "action": "one of: ${Object.keys(AVAILABLE_ACTIONS).join(', ')}",
            "parameters": { ... relevant parameters ... },
            "confirmation_message": "Mô tả ngắn về action sẽ thực hiện"
          }
          
          Available actions: ${JSON.stringify(AVAILABLE_ACTIONS)}
          
          If command is unclear, return:
          { "action": "clarify", "question": "Câu hỏi làm rõ" }`
        },
        { role: 'user', content: command }
      ],
      response_format: { type: 'json_object' }
    });
    
    const parsed = JSON.parse(parseResponse.choices[0].message.content);
    
    // Step 2: Execute action
    const result = await executeAction(parsed.action, parsed.parameters);
    
    res.json({
      success: true,
      command,
      parsed,
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute parsed action
async function executeAction(action, params) {
  switch (action) {
    case 'create_post':
      return await generatePostContent(params);
    case 'backup_database':
      return await triggerBackup();
    case 'generate_seo':
      return await generateSEOContent(params);
    case 'get_stats':
      return await getStatistics(params);
    default:
      return { message: 'Action executed', action, params };
  }
}

module.exports = router;
```

### Step 2: Create Command Center Component
**File:** `src/components/ai/CommandCenter.tsx`

```typescript
/**
 * AI Command Center Component
 * 
 * Features:
 * - Command input with autocomplete
 * - Command history
 * - Real-time execution status
 * - Quick action buttons
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  History, 
  Zap,
  FileText,
  Database,
  Share2,
  BarChart3
} from "lucide-react";

interface CommandResult {
  id: string;
  command: string;
  result: any;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

// Quick action presets
const QUICK_ACTIONS = [
  { icon: FileText, label: "Tạo bài post", command: "Tạo bài post mới cho dự án" },
  { icon: Database, label: "Backup DB", command: "Backup database ngay" },
  { icon: Share2, label: "Đăng social", command: "Đăng bài mới nhất lên tất cả mạng xã hội" },
  { icon: BarChart3, label: "Thống kê", command: "Cho tôi xem thống kê hôm nay" },
];

export function CommandCenter() {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CommandResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Execute command
  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    setLoading(true);
    const newEntry: CommandResult = {
      id: Date.now().toString(),
      command: cmd,
      result: null,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setHistory(prev => [newEntry, ...prev]);
    setCommand("");

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      
      const data = await response.json();
      
      setHistory(prev => prev.map(h => 
        h.id === newEntry.id 
          ? { ...h, result: data, status: 'success' }
          : h
      ));
      
      toast({
        title: "✅ Hoàn thành",
        description: data.parsed?.confirmation_message || "Command executed"
      });
    } catch (error) {
      setHistory(prev => prev.map(h => 
        h.id === newEntry.id 
          ? { ...h, result: error, status: 'error' }
          : h
      ));
      
      toast({
        title: "❌ Lỗi",
        description: "Không thể thực hiện command",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Command Input */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Command Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Gõ lệnh bằng tiếng Việt... (VD: Tạo bài post về dự án X)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeCommand(command)}
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={() => executeCommand(command)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {QUICK_ACTIONS.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => executeCommand(action.command)}
                disabled={loading}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Lịch sử commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Chưa có command nào. Hãy thử gõ lệnh ở trên!
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-medium">{item.command}</code>
                      <Badge variant={
                        item.status === 'success' ? 'default' :
                        item.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    {item.result && (
                      <pre className="text-xs text-muted-foreground overflow-auto">
                        {JSON.stringify(item.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 3: Create Page & Route
**File:** `src/pages/AdminCommand.tsx`

```typescript
import { CommandCenter } from "@/components/ai/CommandCenter";

export default function AdminCommand() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🤖 AI Command Center</h1>
        <p className="text-muted-foreground">
          Điều khiển mọi thứ bằng ngôn ngữ tự nhiên
        </p>
      </div>
      <CommandCenter />
    </div>
  );
}
```

### Step 4: Add Route to App.tsx
```typescript
// Add import
import AdminCommand from "@/pages/AdminCommand";

// Add route
<Route path="/admin/command" element={<AdminCommand />} />
```

### Step 5: Add to Sidebar (AdminLayout.tsx)
```typescript
// Add to navigation items in "🧠 AI Tools" group
{
  name: "🤖 Command Center",
  path: "/admin/command",
  icon: Sparkles // or Terminal icon
}
```

### Step 6: Register API Route (server.js)
```javascript
// Add import
const aiCommandRoutes = require('./routes/ai-command');

// Add route
app.use('/api/ai', aiCommandRoutes);
```

---

## ✅ CHECKLIST

- [ ] Create `api/routes/ai-command.js`
- [ ] Create `src/components/ai/CommandCenter.tsx`
- [ ] Create `src/pages/AdminCommand.tsx`
- [ ] Add route to `src/App.tsx`
- [ ] Add menu item to `AdminLayout.tsx`
- [ ] Register API in `api/server.js`
- [ ] Test with sample commands

---

## 🔧 CONVENTIONS

1. **File naming:** PascalCase for components, kebab-case for API routes
2. **Imports:** Use `@/` alias for src folder
3. **UI Components:** Always use shadcn/ui from `@/components/ui`
4. **Icons:** Use lucide-react
5. **API calls:** Use fetch with proper error handling
6. **Toast notifications:** Use `useToast` hook
7. **Vietnamese UI:** All user-facing text in Vietnamese

---

## 🚫 DO NOT

- Do NOT add testing/CI/CD - this is local only
- Do NOT add complex auth - single user
- Do NOT add deployment configs
- Do NOT add monitoring/analytics services
- Do NOT over-engineer - keep it simple

---

## 📝 NOTES FOR AI

- User speaks Vietnamese, respond in Vietnamese
- Focus on SPEED and AUTOMATION
- Keep code clean but don't over-abstract
- Use existing patterns from the codebase
- Always add proper TypeScript types
- Handle errors gracefully with user-friendly messages
