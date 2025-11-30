# 🎯 Ví Dụ Chi Tiết: Tạo Bài Post - Step by Step

## 📝 Command: "Tạo bài post về dự án Vũng Tàu trên Facebook"

---

## 🔄 Step-by-Step Execution

### 1️⃣ User Interface (Frontend)

**File:** `src/components/agent-center/CommandInput.tsx`

```tsx
User gõ: "Tạo bài post về dự án Vũng Tàu trên Facebook"

↓

onSubmit() {
  const response = await fetch('/api/ai/command', {
    method: 'POST',
    body: JSON.stringify({ command: userInput })
  });

  const result = await response.json();
  // Display result
}
```

**UI hiển thị:**
- Loading spinner
- "Đang xử lý command..."

---

### 2️⃣ API Route (Backend)

**File:** `api/routes/ai-command.js`

```javascript
POST /api/ai/command
{
  "command": "Tạo bài post về dự án Vũng Tàu trên Facebook"
}

↓

router.post('/command', async (req, res) => {
  const { command } = req.body;

  // Step 1: Parse command
  const parsed = await commandParser.parseCommand(command, AVAILABLE_FUNCTIONS);

  // Step 2: Load business context
  const context = await businessContext.load();

  // Step 3: Generate workflow
  const workflow = await workflowGenerator.generateFromCommand(
    parsed.functionName,
    parsed.arguments,
    context
  );

  res.json({ success: true, workflow });
});
```

---

### 3️⃣ Command Parsing (OpenAI)

**File:** `api/services/command-parser.js`

**OpenAI API Call:**
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: 'Bạn là AI assistant giúp parse commands tiếng Việt...'
    },
    {
      role: 'user',
      content: 'Tạo bài post về dự án Vũng Tàu trên Facebook'
    }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'create_post',
        description: 'Tạo bài post cho social media',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            platform: { type: 'string', enum: ['facebook', 'twitter', 'linkedin'] },
            tone: { type: 'string', enum: ['professional', 'casual', 'friendly'] }
          }
        }
      }
    }
  ],
  tool_choice: 'auto'
});
```

**OpenAI Response:**
```json
{
  "choices": [{
    "message": {
      "tool_calls": [{
        "id": "call_abc123",
        "function": {
          "name": "create_post",
          "arguments": "{\"topic\":\"dự án Vũng Tàu\",\"platform\":\"facebook\",\"tone\":\"professional\"}"
        }
      }]
    }
  }]
}
```

**Parsed Result:**
```javascript
{
  success: true,
  functionName: 'create_post',
  arguments: {
    topic: 'dự án Vũng Tàu',
    platform: 'facebook',
    tone: 'professional'
  }
}
```

---

### 4️⃣ Business Context Loading

**File:** `api/services/business-context.js`

**Database Queries:**
```sql
-- Load projects
SELECT * FROM projects
ORDER BY created_at DESC
LIMIT 10;

-- Load workflows
SELECT * FROM project_workflows
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20;

-- Load executions
SELECT * FROM workflow_executions
ORDER BY started_at DESC
LIMIT 50;
```

**Context Returned:**
```javascript
{
  domain: 'real-estate',  // Detected from project names
  currentProjects: [
    {
      id: '...',
      name: 'Vũng Tàu Dream Homes',
      description: '...',
      status: 'active'
    }
  ],
  activeCampaigns: [],
  recentWorkflows: [...],
  businessGoals: [
    'Tăng engagement trên social media',
    'Tạo content SEO chất lượng'
  ],
  constraints: {
    resources: ['OpenAI API', 'n8n', 'Supabase']
  }
}
```

---

### 5️⃣ Workflow Generation

**File:** `api/services/workflow-generator.js`

**Function:** `generatePostWorkflow(args, context)`

**Generated n8n Workflow:**
```json
{
  "name": "Create Post - dự án Vũng Tàu",
  "nodes": [
    {
      "id": "node-1",
      "name": "Generate Content with OpenAI",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "operation": "complete",
        "model": "gpt-4o",
        "prompt": "Tạo bài post về dự án Vũng Tàu với tone professional cho Facebook. Include: project highlights, location benefits, call-to-action.",
        "maxTokens": 500,
        "temperature": 0.7
      }
    },
    {
      "id": "node-2",
      "name": "Format Post",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const content = items[0].json.choices[0].message.content;
          const formatted = {
            message: content,
            hashtags: '#VungTauDreamHomes #BatDongSan #RealEstate',
            link: 'https://vungtau-dream-homes.com',
            scheduledTime: null
          };
          return [{ json: formatted }];
        `
      }
    },
    {
      "id": "node-3",
      "name": "Post to Facebook",
      "type": "n8n-nodes-base.facebook",
      "parameters": {
        "operation": "post",
        "pageId": "={{ $env.FACEBOOK_PAGE_ID }}",
        "message": "={{ $json.message }}\\n\\n{{ $json.hashtags }}\\n\\n{{ $json.link }}"
      }
    }
  ],
  "connections": {
    "Generate Content with OpenAI": {
      "main": [[{ "node": "Format Post", "type": "main", "index": 0 }]]
    },
    "Format Post": {
      "main": [[{ "node": "Post to Facebook", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 6️⃣ Context-Aware Customization

**File:** `api/services/context-aware-generator.js`

**Customizations Applied:**

1. **Domain-specific (real-estate):**
   - Add real estate hashtags
   - Include location benefits
   - Add property highlights

2. **Project-specific:**
   - Include project name: "Vũng Tàu Dream Homes"
   - Add project URL
   - Include project features

3. **Timing optimization:**
   - Check best posting times
   - Suggest optimal schedule

4. **Conflict checking:**
   - Check if too many posts today
   - Warn if exceeds limits

**Final Workflow:**
```json
{
  "name": "Create Post - Vũng Tàu Dream Homes",
  "nodes": [
    {
      "name": "Generate Content",
      "parameters": {
        "prompt": "Tạo bài post professional về dự án Vũng Tàu Dream Homes cho Facebook. Highlight: beachfront location, modern design, investment potential. Tone: professional but approachable."
      }
    },
    {
      "name": "Add Project Info",
      "parameters": {
        "projectName": "Vũng Tàu Dream Homes",
        "projectUrl": "https://vungtau-dream-homes.com",
        "hashtags": "#VungTauDreamHomes #BatDongSan #RealEstate #Investment"
      }
    },
    {
      "name": "Post to Facebook",
      "parameters": {
        "scheduledTime": "2025-01-28T09:00:00Z"  // Optimal time
      }
    }
  ]
}
```

---

### 7️⃣ Return to Frontend

**API Response:**
```json
{
  "success": true,
  "workflow": {
    "id": "wf_abc123",
    "name": "Create Post - Vũng Tàu Dream Homes",
    "definition": { /* n8n workflow JSON */ },
    "estimatedTime": "2-3 minutes",
    "estimatedCost": "$0.05"
  },
  "suggestedActions": [
    {
      "action": "create_in_n8n",
      "label": "Tạo workflow trong n8n",
      "description": "Workflow sẽ được tạo và có thể edit trước khi activate"
    },
    {
      "action": "test",
      "label": "Test workflow",
      "description": "Chạy test execution để xem kết quả"
    },
    {
      "action": "schedule",
      "label": "Lên lịch",
      "description": "Schedule workflow để chạy tự động"
    }
  ]
}
```

---

### 8️⃣ Frontend Display

**Component:** `CommandInput.tsx`

**UI hiển thị:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>✅ Workflow đã được tạo!</CardTitle>
  </CardHeader>
  <CardContent>
    <div>
      <h3>Create Post - Vũng Tàu Dream Homes</h3>
      <p>Estimated time: 2-3 minutes</p>
      <p>Estimated cost: $0.05</p>
    </div>

    <div className="workflow-preview">
      {/* Preview workflow nodes */}
      <div>1. Generate Content</div>
      <div>2. Format Post</div>
      <div>3. Post to Facebook</div>
    </div>

    <div className="actions">
      <Button onClick={createInN8n}>
        Tạo trong n8n
      </Button>
      <Button onClick={testWorkflow}>
        Test
      </Button>
      <Button onClick={scheduleWorkflow}>
        Lên lịch
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### 9️⃣ User Action: Create in n8n

**User clicks:** "Tạo trong n8n"

**What happens:**

1. **API Call:**
   ```javascript
   POST /api/n8n/workflows
   Body: { workflow: workflowDefinition }
   ```

2. **n8n Integration:**
   ```javascript
   // api/routes/n8n.js
   const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
     method: 'POST',
     headers: {
       'X-N8N-API-KEY': N8N_API_KEY,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(workflowDefinition)
   });
   ```

3. **Workflow Created in n8n:**
   - Workflow appears in n8n dashboard
   - User can edit if needed
   - User can activate

4. **Frontend Update:**
   ```tsx
   toast.success('Workflow đã được tạo trong n8n!');
   // Show link to n8n dashboard
   ```

---

### 🔟 Workflow Execution

**When workflow runs:**

1. **Node 1: Generate Content**
   - OpenAI generates post content
   - Returns: "Discover Vũng Tàu Dream Homes - Beachfront luxury..."

2. **Node 2: Format Post**
   - Adds hashtags
   - Adds project URL
   - Formats for Facebook

3. **Node 3: Post to Facebook**
   - Posts to Facebook page
   - Returns post ID

**Result:**
- Post published on Facebook
- Post ID saved
- Execution logged in database

---

## 📊 Metrics Tracking

**After execution:**

**Service:** `api/services/workflow-metrics.js`

**Metrics recorded:**
```json
{
  "workflow_id": "...",
  "execution_id": "...",
  "node_id": "node-1",
  "execution_time_ms": 2500,
  "success": true,
  "cost_usd": 0.05
}
```

**Stored in:** `workflow_metrics` table

---

## 🔄 Optimization Cycle

**After multiple executions:**

**Service:** `api/services/workflow-optimizer.js`

**Analysis:**
- Node 1 (Generate Content) takes 2.5s average
- Could be optimized with caching
- Suggestion: Cache similar content requests

**Optimization suggestion:**
```json
{
  "type": "performance",
  "nodeId": "node-1",
  "issue": "Content generation takes 2.5s",
  "suggestion": "Add caching for similar topics",
  "impact": "high",
  "estimatedImprovement": "Reduce to 0.5s (80% faster)"
}
```

**Displayed in:** `WorkflowOptimizer` component

---

## 🎯 Complete Flow Summary

```
1. User Input
   "Tạo bài post về dự án Vũng Tàu"
   ↓
2. Command Parser (OpenAI)
   Function: create_post
   Args: { topic, platform, tone }
   ↓
3. Business Context
   Domain: real-estate
   Project: Vũng Tàu Dream Homes
   ↓
4. Workflow Generator
   Create n8n workflow JSON
   ↓
5. Context-Aware Customization
   Add project info, hashtags, timing
   ↓
6. Return to Frontend
   Display workflow preview
   ↓
7. User Action
   Create in n8n / Test / Schedule
   ↓
8. Execution
   Workflow runs in n8n
   ↓
9. Metrics Collection
   Track performance
   ↓
10. Optimization
    AI suggests improvements
```

---

## ✨ Key Points

1. **Natural Language → Structured Workflow:** AI converts Vietnamese to structured workflow
2. **Context-Aware:** System understands business context
3. **Automatic:** Minimal user intervention needed
4. **Intelligent:** AI optimizes and suggests improvements
5. **Proactive:** AI suggests actions before user asks

---

## 🚀 Try It!

1. Open: `http://localhost:8080/admin/ai-center`
2. Gõ: "Tạo bài post về dự án Vũng Tàu"
3. Watch the magic! ✨

