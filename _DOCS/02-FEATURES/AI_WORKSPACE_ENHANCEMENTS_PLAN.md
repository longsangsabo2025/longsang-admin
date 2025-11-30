# AI Workspace Enhancements - Implementation Plan

## Overview
Implement 5 major features for AI Workspace tab in priority order:
1. Conversation History Sidebar
2. Quick Prompts/Templates
3. File Upload & RAG Indexing
4. Settings Panel
5. Analytics Dashboard

---

## Phase 1: Conversation History Sidebar

### Files to Create:
- `src/components/ai-workspace/ConversationHistory.tsx` - Sidebar component
- `src/hooks/useConversations.ts` - Hook for fetching/managing conversations

### Files to Modify:
- `src/pages/AIWorkspace.tsx` - Add sidebar layout
- `src/components/ai-workspace/CopilotChat.tsx` - Load conversation on select
- `src/hooks/useAssistant.ts` - Add loadConversation function
- `api/routes/ai-assistants.js` - Add DELETE and PATCH endpoints

### Implementation Steps:

1. **Create `useConversations.ts` hook:**
   - `fetchConversations(assistantType, userId)` - Get conversations from API
   - `deleteConversation(conversationId, assistantType)` - Delete conversation
   - `renameConversation(conversationId, newTitle, assistantType)` - Rename conversation

2. **Create `ConversationHistory.tsx` component:**
   - Fetch and display conversations list
   - Show: title, date, preview (first message)
   - Search/filter input
   - Click conversation to load it
   - Delete button (with confirmation)
   - "New Conversation" button
   - Loading and empty states

3. **Update `AIWorkspace.tsx`:**
   - Change layout to flex container
   - Left sidebar: ConversationHistory (300px, collapsible)
   - Right main: CopilotChat (flex-1)
   - Add state for `selectedConversationId`
   - Pass `conversationId` and `onConversationSelect` to CopilotChat

4. **Update `CopilotChat.tsx`:**
   - Accept `conversationId` prop
   - Load conversation messages when `conversationId` changes
   - Show "New Conversation" button when conversation is loaded
   - Clear conversation on assistant change

5. **Update `useAssistant.ts`:**
   - Add `loadConversation(conversationId)` function
   - Fetch conversation from `/api/assistants/:type/conversations/:id`
   - Populate messages from conversation data

6. **Update `api/routes/ai-assistants.js`:**
   - Add `DELETE /api/assistants/:type/conversations/:id` - Delete conversation
   - Add `PATCH /api/assistants/:type/conversations/:id` - Update conversation (rename)
   - Add `GET /api/assistants/:type/conversations/:id` - Get single conversation

---

## Phase 2: Quick Prompts/Templates

### Files to Create:
- `src/components/ai-workspace/QuickPrompts.tsx` - Prompts panel component
- `src/data/ai-workspace-prompts.ts` - Prompt templates data

### Files to Modify:
- `src/components/ai-workspace/CopilotChat.tsx` - Add QuickPrompts panel

### Implementation Steps:

1. **Create `ai-workspace-prompts.ts`:**
   - Define prompt templates for each assistant type
   - Structure:
     ```typescript
     {
       id: string,
       title: string,
       prompt: string,
       category: 'common' | 'advanced' | 'examples',
       assistantType: AssistantType
     }
     ```
   - Examples:
     - Course: "Tạo outline khóa học về...", "Viết bài giảng về..."
     - Financial: "Phân tích chi tiêu tháng này", "Tạo ngân sách cho..."
     - Research: "Nghiên cứu về...", "Tổng hợp thông tin về..."
     - News: "Tin tức mới nhất về...", "Xu hướng trong ngành..."
     - Career: "Lộ trình phát triển sự nghiệp...", "Kỹ năng cần thiết cho..."
     - Daily: "Lập kế hoạch ngày hôm nay", "Sắp xếp công việc tuần này"

2. **Create `QuickPrompts.tsx` component:**
   - Display prompts filtered by active assistant
   - Group by category (tabs or sections)
   - Search/filter prompts
   - Click prompt to:
     - Option A: Fill input field
     - Option B: Send directly
   - Show prompt preview on hover

3. **Update `CopilotChat.tsx`:**
   - Add QuickPrompts panel (collapsible, below assistant selector)
   - Show when no messages or toggle button
   - Pass `onPromptSelect` callback
   - Fill input or call `submit` directly

---

## Phase 3: File Upload & RAG Indexing

### Files to Create:
- `src/components/ai-workspace/FileUpload.tsx` - Upload component
- `src/components/ai-workspace/DocumentList.tsx` - List uploaded documents
- `src/hooks/useDocumentUpload.ts` - Upload hook
- `api/routes/documents.js` - Document management routes
- `api/services/ai-workspace/document-processor.js` - Process uploaded files

### Files to Modify:
- `src/pages/AIWorkspace.tsx` - Add file upload section
- `api/package.json` - Add document parsing dependencies

### Implementation Steps:

1. **Install dependencies:**
   ```bash
   npm install pdf-parse mammoth multer
   ```

2. **Create `document-processor.js`:**
   - Parse PDF using `pdf-parse`
   - Parse DOCX using `mammoth`
   - Parse TXT (direct read)
   - Extract text content
   - Split into chunks (500-1000 chars)
   - Generate embeddings using existing `embedding-service.js`
   - Store in `documents` table with metadata:
     - `source_type`: 'upload'
     - `source_id`: file name
     - `metadata`: { filename, size, type, chunks }

3. **Create `documents.js` routes:**
   - `POST /api/documents/upload` - Upload and process file
     - Accept multipart/form-data
     - Process file
     - Return document ID
   - `GET /api/documents` - List user documents
     - Filter by `assistantType` (optional)
   - `DELETE /api/documents/:id` - Delete document
   - `GET /api/documents/:id` - Get document details

4. **Create `useDocumentUpload.ts` hook:**
   - `uploadDocument(file, userId, assistantType)` - Upload file
   - `fetchDocuments(userId, assistantType?)` - Get documents
   - `deleteDocument(documentId)` - Delete document
   - Loading and error states

5. **Create `FileUpload.tsx` component:**
   - Drag & drop zone
   - File picker button
   - Support: PDF, DOCX, TXT
   - File validation (size, type)
   - Upload progress indicator
   - Processing status
   - Success/error messages

6. **Create `DocumentList.tsx` component:**
   - List uploaded documents
   - Show: title, source, date, size, type
   - Delete button (with confirmation)
   - Preview document content (modal)
   - Filter by assistant type
   - Empty state

7. **Update `AIWorkspace.tsx`:**
   - Add FileUpload component (tab or section)
   - Add DocumentList component
   - Layout: Tabs or Accordion
     - Tab 1: Chat
     - Tab 2: Documents

---

## Phase 4: Settings Panel

### Files to Create:
- `src/components/ai-workspace/SettingsPanel.tsx` - Settings UI
- `src/hooks/useAISettings.ts` - Settings management hook

### Files to Modify:
- `src/pages/AIWorkspace.tsx` - Add settings button/modal
- `src/components/ai-workspace/CopilotChat.tsx` - Use settings in API calls
- `api/routes/ai-assistants.js` - Accept settings in request

### Implementation Steps:

1. **Create `useAISettings.ts` hook:**
   - Store settings in localStorage
   - Default settings:
     ```typescript
     {
       model: 'auto' | 'gpt-4o' | 'gpt-4o-mini' | 'claude-sonnet-4' | 'claude-haiku',
       temperature: 0.7,
       maxTokens: 2000,
       streaming: true,
       provider: 'auto' | 'openai' | 'anthropic'
     }
     ```
   - Functions:
     - `getSettings()` - Get current settings
     - `updateSettings(partial)` - Update settings
     - `resetSettings()` - Reset to defaults

2. **Create `SettingsPanel.tsx` component:**
   - Model selector (Select dropdown)
     - Options: Auto, GPT-4o, GPT-4o-mini, Claude Sonnet 4, Claude Haiku
   - Temperature slider (0-1, step 0.1)
     - Show current value
   - Max tokens input (number, min 100, max 4000)
   - Streaming toggle (Switch)
   - Provider selector (Radio group)
   - Save button (saves to localStorage)
   - Reset button
   - Info tooltips for each setting

3. **Update `AIWorkspace.tsx`:**
   - Add Settings button (gear icon) in header
   - Open SettingsPanel in Dialog/Sheet
   - Use `useAISettings` hook

4. **Update `CopilotChat.tsx`:**
   - Get settings from `useAISettings`
   - Pass settings to API calls in request body

5. **Update `api/routes/ai-assistants.js`:**
   - Accept `settings` in request body
   - Pass to assistant handler
   - Use settings to override defaults

---

## Phase 5: Analytics Dashboard

### Files to Create:
- `src/components/ai-workspace/AnalyticsPanel.tsx` - Analytics UI
- `src/hooks/useAnalytics.ts` - Analytics data hook
- `api/routes/ai-workspace-analytics.js` - Analytics endpoints

### Files to Modify:
- `src/pages/AIWorkspace.tsx` - Add analytics section
- `api/routes/ai-assistants.js` - Track usage stats

### Implementation Steps:

1. **Update `api/routes/ai-assistants.js`:**
   - After each successful request, log to `agent_executions` table:
     ```javascript
     {
       user_id: userId,
       assistant_type: assistantType,
       tokens_used: tokens,
       cost_estimate: cost,
       response_time_ms: responseTime,
       created_at: new Date()
     }
     ```
   - Calculate tokens from response
   - Estimate cost based on model and tokens
   - Measure response time

2. **Create `ai-workspace-analytics.js` routes:**
   - `GET /api/ai-workspace/analytics` - Get user analytics
     - Query params: `timeRange` (today, week, month, all)
     - Return:
       - Total messages
       - Total tokens
       - Total cost
       - Average response time
       - Messages per day (array)
       - Assistant usage (count per assistant)
       - Cost over time (array)

3. **Create `useAnalytics.ts` hook:**
   - `fetchAnalytics(userId, timeRange)` - Get analytics
   - Time ranges: 'today', 'week', 'month', 'all'
   - Loading and error states

4. **Install chart library (if needed):**
   ```bash
   npm install recharts
   ```

5. **Create `AnalyticsPanel.tsx` component:**
   - Stats cards (4 cards):
     - Total Messages (number)
     - Tokens Used (number with format)
     - Estimated Cost (currency)
     - Avg Response Time (ms)
   - Charts:
     - Messages per day (LineChart from recharts)
     - Assistant usage (PieChart)
     - Cost over time (BarChart)
   - Time range selector (tabs: Today, Week, Month, All)
   - Refresh button

6. **Update `AIWorkspace.tsx`:**
   - Add Analytics tab/section
   - Show AnalyticsPanel
   - Layout: Tabs
     - Tab 1: Chat
     - Tab 2: Documents
     - Tab 3: Analytics

---

## Database Updates

### Existing Tables (already created):
- `conversations` - For conversation history
- `documents` - For uploaded documents
- `agent_executions` - For analytics tracking

### No new tables needed

---

## UI/UX Layout Changes

### Current Layout:
```
AIWorkspace
└── Card
    └── CopilotChat
```

### New Layout (after all phases):
```
AIWorkspace
├── Header
│   ├── Title
│   └── Settings Button
├── Layout (flex)
│   ├── Left Sidebar (300px, collapsible)
│   │   └── ConversationHistory
│   ├── Main Content (flex-1)
│   │   └── Tabs
│   │       ├── Chat Tab
│   │       │   └── CopilotChat
│   │       │       ├── AssistantSelector
│   │       │       ├── QuickPrompts (collapsible)
│   │       │       ├── Messages
│   │       │       └── Input
│   │       ├── Documents Tab
│   │       │   ├── FileUpload
│   │       │   └── DocumentList
│   │       └── Analytics Tab
│   │           └── AnalyticsPanel
│   └── Right Panel (optional, 300px, collapsible)
│       └── (Future: Additional features)
└── CommandPalette
```

---

## Implementation Order & Time Estimates

1. **Phase 1: Conversation History** - 2-3 hours
   - Hook: 30 min
   - Component: 1 hour
   - Integration: 1 hour
   - API endpoints: 30 min

2. **Phase 2: Quick Prompts** - 1-2 hours
   - Data file: 30 min
   - Component: 1 hour
   - Integration: 30 min

3. **Phase 3: File Upload** - 3-4 hours
   - Backend processor: 1.5 hours
   - API routes: 1 hour
   - Frontend components: 1.5 hours

4. **Phase 4: Settings** - 1-2 hours
   - Hook: 30 min
   - Component: 1 hour
   - Integration: 30 min

5. **Phase 5: Analytics** - 2-3 hours
   - Backend tracking: 1 hour
   - API routes: 1 hour
   - Frontend component: 1 hour

**Total Estimated Time:** 9-14 hours

---

## Dependencies to Install

### Backend:
```bash
cd api
npm install pdf-parse mammoth multer
```

### Frontend:
```bash
npm install recharts
```

---

## Testing Checklist

### Phase 1: Conversation History
- [ ] Conversations list loads correctly
- [ ] Search/filter works
- [ ] Click conversation loads messages
- [ ] Delete conversation works
- [ ] New conversation button works
- [ ] Empty state displays correctly

### Phase 2: Quick Prompts
- [ ] Prompts filtered by assistant
- [ ] Click prompt fills input or sends
- [ ] Search works
- [ ] Categories display correctly

### Phase 3: File Upload
- [ ] Upload PDF works
- [ ] Upload DOCX works
- [ ] Upload TXT works
- [ ] File validation works
- [ ] Progress indicator shows
- [ ] Document appears in list
- [ ] Delete document works
- [ ] Document indexed in RAG

### Phase 4: Settings
- [ ] Settings save to localStorage
- [ ] Settings applied to API calls
- [ ] Model selection works
- [ ] Temperature slider works
- [ ] Reset button works

### Phase 5: Analytics
- [ ] Usage tracked correctly
- [ ] Analytics data loads
- [ ] Charts render correctly
- [ ] Time range filter works
- [ ] Stats calculate correctly

---

## Notes

- All phases build on previous phases
- Can implement incrementally
- Test each phase before moving to next
- Keep UI consistent with existing design system
- Use shadcn/ui components where possible
- Follow existing code patterns and conventions

