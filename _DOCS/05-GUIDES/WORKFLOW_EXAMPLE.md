# 🎯 Ví Dụ Tác Vụ: "Tạo Bài Post Về Dự Án Vũng Tàu"

## 📋 Tổng Quan

Ví dụ này mô tả cách hệ thống AI Command Center xử lý một command từ đầu đến cuối.

---

## 🎬 Scenario: User muốn tạo bài post

**User Action:** Gõ vào Command Input:
```
"Tạo bài post về dự án Vũng Tàu trên Facebook với tone professional"
```

---

## 🔄 Flow Hoạt Động

### Step 1: User Gõ Command

**Location:** `CommandInput` component

```
User types: "Tạo bài post về dự án Vũng Tàu trên Facebook với tone professional"
```

**What happens:**
1. Component capture input
2. Show autocomplete suggestions (nếu có)
3. User nhấn Enter hoặc click Send

---

### Step 2: Command được gửi đến Backend

**API Call:**
```javascript
POST /api/ai/command
Body: {
  command: "Tạo bài post về dự án Vũng Tàu trên Facebook với tone professional"
}
```

**Location:** `api/routes/ai-command.js`

---

### Step 3: AI Parse Command (OpenAI Function Calling)

**Service:** `api/services/command-parser.js`

**Process:**
1. Gửi command đến OpenAI với Function Calling
2. OpenAI xác định function: `create_post`
3. Extract parameters:
   ```json
   {
     "topic": "dự án Vũng Tàu",
     "platform": "facebook",
     "tone": "professional"
   }
   ```

**OpenAI Response:**
```json
{
  "tool_calls": [{
    "id": "call_123",
    "function": {
      "name": "create_post",
      "arguments": "{\"topic\":\"dự án Vũng Tàu\",\"platform\":\"facebook\",\"tone\":\"professional\"}"
    }
  }]
}
```

---

### Step 4: Load Business Context

**Service:** `api/services/business-context.js`

**What it does:**
- Load projects từ database
- Load active workflows
- Load recent executions
- Determine domain (real-estate trong trường hợp này)

**Context returned:**
```json
{
  "domain": "real-estate",
  "currentProjects": [
    { "id": "...", "name": "Vũng Tàu Dream Homes", ... }
  ],
  "activeCampaigns": [],
  "recentWorkflows": [...],
  "businessGoals": [
    "Tăng engagement trên social media",
    "Tạo content SEO chất lượng"
  ]
}
```

---

### Step 5: Generate Workflow

**Service:** `api/services/workflow-generator.js`

**Process:**
1. Nhận function name: `create_post`
2. Nhận parameters: `{ topic, platform, tone }`
3. Nhận business context
4. Generate n8n workflow JSON

**Generated Workflow:**
```json
{
  "name": "Create Post - dự án Vũng Tàu",
  "nodes": [
    {
      "name": "Generate Content",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "complete",
        "model": "gpt-4o",
        "prompt": "Tạo bài post về dự án Vũng Tàu với tone professional cho Facebook...",
        "maxTokens": 500
      }
    },
    {
      "name": "Post to Facebook",
      "type": "n8n-nodes-base.facebook",
      "parameters": {
        "operation": "post",
        "pageId": "...",
        "message": "={{ $json.content }}"
      }
    }
  ],
  "connections": {
    "Generate Content": {
      "main": [[{ "node": "Post to Facebook", "type": "main", "index": 0 }]]
    }
  }
}
```

---

### Step 6: Context-Aware Customization

**Service:** `api/services/context-aware-generator.js`

**What it does:**
- Apply domain-specific customizations (real-estate)
- Pre-fill với project info (Vũng Tàu Dream Homes)
- Check for conflicts (e.g., too many posts today)
- Optimize execution timing

**Customizations applied:**
- Add project hashtags: #VungTauDreamHomes #BatDongSan
- Include project URL
- Add call-to-action phù hợp với real estate
- Schedule optimal posting time

---

### Step 7: Return Workflow to Frontend

**API Response:**
```json
{
  "success": true,
  "workflow": {
    "name": "Create Post - dự án Vũng Tàu",
    "definition": { ... },
    "suggestedActions": [
      "Create workflow in n8n",
      "Test workflow",
      "Schedule execution"
    ]
  },
  "estimatedTime": "2-3 minutes",
  "estimatedCost": "$0.05"
}
```

---

### Step 8: Frontend Display Result

**Location:** `CommandInput` component

**What user sees:**
1. Loading state với spinner
2. Streaming updates (nếu dùng StreamingCommand):
   - "🤔 Đang phân tích command..."
   - "🔧 Đang tạo workflow..."
   - "✅ Workflow đã được tạo!"

3. Result card hiển thị:
   - Workflow name
   - Preview của workflow
   - Actions: "Create in n8n", "Test", "Schedule"

---

### Step 9: User Có Thể Execute

**Options:**

1. **Create Workflow in n8n:**
   - Click "Create in n8n"
   - Workflow được tạo trong n8n
   - User có thể edit trước khi activate

2. **Test Workflow:**
   - Click "Test"
   - Workflow chạy test execution
   - Show results

3. **Schedule Execution:**
   - Click "Schedule"
   - Set time để chạy
   - Workflow sẽ tự động execute

---

## 🎯 Proactive Suggestions Flow

**Background:** AI tự động phân tích và đề xuất

### Step 1: Background Monitor Chạy

**Service:** `api/services/background-monitor.js`

**Frequency:** Mỗi 5 phút

**What it does:**
1. Check database state
2. Analyze patterns
3. Detect opportunities
4. Generate suggestions

### Step 2: Detect Opportunity

**Example Scenario:**
- Có 5 leads mới từ Facebook Ads
- Chưa có workflow follow-up
- AI detect và tạo suggestion

### Step 3: Generate Suggestion

**Service:** `api/routes/ai-suggestions.js` → `generate()`

**Suggestion created:**
```json
{
  "type": "workflow",
  "priority": "high",
  "reason": "Có 5 leads mới từ Facebook Ads chưa được follow up",
  "suggested_action": {
    "action": "create_workflow",
    "workflow": "lead-nurture",
    "parameters": {
      "leads": 5,
      "source": "facebook_ads"
    }
  },
  "estimated_impact": "Tăng conversion rate ~15%"
}
```

### Step 4: Display in UI

**Component:** `ProactiveSuggestionsPanel`

**What user sees:**
```
💡 AI Đề Xuất

┌─────────────────────────────────────┐
│ 🔴 High Priority                    │
│                                     │
│ Có 5 leads mới từ Facebook Ads     │
│ chưa được follow up                │
│                                     │
│ [Chạy Workflow "Lead Nurture"]     │
│ [Bỏ qua]                            │
│                                     │
│ 💰 Impact: Tăng conversion ~15%     │
└─────────────────────────────────────┘
```

### Step 5: User One-Click Execute

**User Action:** Click "Chạy Workflow"

**What happens:**
1. API call: `POST /api/ai/suggestions/{id}/execute`
2. Workflow được tạo và execute
3. Suggestion marked as executed
4. User thấy confirmation

---

## 🔔 Intelligent Alerts Flow

### Step 1: Alert Detection

**Service:** `api/services/alert-detector.js`

**Example Scenario:**
- Workflow execution rate drop từ 95% → 70%
- AI detect anomaly

### Step 2: Create Alert

**Alert created:**
```json
{
  "type": "anomaly",
  "severity": "warning",
  "message": "Workflow success rate giảm từ 95% xuống 70% trong 24h qua",
  "suggested_workflow_id": "...",
  "suggested_action": {
    "action": "analyze_workflow",
    "workflow_id": "..."
  }
}
```

### Step 3: Display in UI

**Component:** `IntelligentAlerts`

**What user sees:**
```
🔔 Intelligent Alerts

┌─────────────────────────────────────┐
│ ⚠️ Warning                          │
│                                     │
│ Workflow success rate giảm từ 95%   │
│ xuống 70% trong 24h qua             │
│                                     │
│ [Analyze Workflow]                  │
│ [Resolve]                            │
└─────────────────────────────────────┘
```

---

## 🎨 UI/UX Flow

### Command Palette (Cmd+K)

**User Action:** Nhấn `Cmd+K` (Mac) hoặc `Ctrl+K` (Windows)

**What happens:**
1. Command Palette mở
2. Show command history
3. Show suggestions
4. User type để filter
5. Select command → Execute

### Streaming Updates

**Component:** `StreamingCommand`

**What user sees:**
```
🤔 Đang phân tích command...
   ↓
🔧 Đang tạo workflow...
   ↓
📝 Đang generate content...
   ↓
✅ Workflow đã được tạo!
```

---

## 📊 Multi-Agent Orchestration Example

**Command:** "Tạo campaign marketing hoàn chỉnh cho dự án Vũng Tàu"

**What happens:**

1. **AI phân tích:** Cần nhiều agents
   - Content Writer Agent
   - SEO Agent
   - Social Media Agent
   - Analytics Agent

2. **Orchestrator tạo plan:**
   ```
   Step 1: Content Writer → Generate content
   Step 2: SEO Agent → Optimize SEO
   Step 3: Social Media Agent → Schedule posts
   Step 4: Analytics Agent → Track performance
   ```

3. **Execute in parallel** (where possible):
   - Content Writer và SEO Agent chạy song song
   - Social Media Agent chờ content
   - Analytics Agent chạy sau

4. **Aggregate results:**
   - Combine tất cả outputs
   - Return complete campaign

---

## 🎯 Complete Example Flow Diagram

```
User Input
    ↓
CommandInput Component
    ↓
POST /api/ai/command
    ↓
Command Parser (OpenAI Function Calling)
    ↓
Business Context Loader
    ↓
Workflow Generator
    ↓
Context-Aware Customizer
    ↓
Return Workflow JSON
    ↓
Frontend Display
    ↓
User Options:
  - Create in n8n
  - Test
  - Schedule
```

---

## ✨ Key Features Demonstrated

1. **Natural Language → Workflow:** User gõ tiếng Việt, AI tạo workflow
2. **Context-Aware:** AI hiểu business context (real-estate, projects)
3. **Proactive:** AI tự động đề xuất actions
4. **Intelligent:** AI phát hiện anomalies và opportunities
5. **Streaming:** Real-time feedback
6. **Multi-Agent:** AI điều phối nhiều agents

---

## 🚀 Try It Now!

1. Start server: `npm run dev`
2. Open: `http://localhost:8080/admin/ai-center`
3. Gõ: "Tạo bài post về dự án Vũng Tàu"
4. Xem magic happen! ✨

