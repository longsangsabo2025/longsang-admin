## AI Second Brain – Phase 5: Active Brain & Automation Layer

### 1. Mục tiêu

- Biến AI Second Brain từ hệ thống Q&A thành **hệ thống chủ động hành động**:
  - Tự đề xuất & tạo **tasks**, **notes**, **notifications** dựa trên query, session, workflows.
  - Có **Action Layer + Workflow Engine** để dễ dàng mở rộng sang các hệ thống ngoài (Notion, Jira, v.v.) sau này.

---

### 2. Database (Supabase / Postgres)

#### 2.1 `brain_actions`

- Hàng đợi các hành động cần thực thi.
- Cột chính:
  - `id UUID PK`, `user_id UUID`, `session_id UUID NULL`
  - `action_type TEXT` – `create_task`, `add_note`, `update_knowledge`, `send_notification`, ...
  - `status TEXT` – `pending`, `running`, `success`, `failed`
  - `payload JSONB`, `result JSONB`, `error_log TEXT`
  - `executed_at`, `created_at`, `updated_at`
- RLS: chỉ cho phép user xem/sửa actions của chính họ.

#### 2.2 `brain_workflows`

- Định nghĩa các workflow “khi X thì làm Y”.
- Cột chính:
  - `id UUID PK`, `user_id UUID`
  - `name`, `description`
  - `trigger_type TEXT` – `on_query`, `on_session_end`, `schedule_daily`, `schedule_hourly`, `manual`
  - `trigger_config JSONB`
  - `actions JSONB` – array step `{ action_type, payload_template }`
  - `is_active BOOLEAN`, `created_at`, `updated_at`

#### 2.3 `brain_tasks`

- Task system nội bộ (MVP).
- Cột chính:
  - `id UUID PK`, `user_id UUID`
  - `title`, `description`, `status` (`open`, `in_progress`, `done`, `archived`)
  - `priority` (`low`, `medium`, `high`)
  - `due_date`, `domain_id`, `session_id`
  - `source` (`manual`, `workflow`, `master_brain_suggestion`)
  - `metadata JSONB`, `created_at`, `updated_at`

#### 2.4 `brain_notifications`

- Thông báo cho user (reminder, insight, warning, system).
- Cột chính:
  - `id UUID PK`, `user_id UUID`
  - `type`, `message`, `metadata JSONB`
  - `is_read`, `created_at`, `read_at`

#### 2.5 Files

- `supabase/migrations/brain/011_actions_and_workflows.sql`
- `supabase/migrations/brain/012_tasks_and_notifications.sql`

---

### 3. Backend Services & Workers

#### 3.1 `api/brain/services/action-executor-service.js`

- `queueAction(userId, actionType, payload, sessionId?)`
- `executeAction(action)` – switch theo `action_type`, gọi:
  - insert `brain_tasks`
  - insert `brain_notifications`
  - (future) update `brain_knowledge`, ghi note vào các bảng khác
- `executePendingActions(limit)` – lấy actions `pending` và thực thi.

#### 3.2 `api/brain/services/workflow-engine-service.js`

- `getActiveWorkflows(userId)`
- `evaluateEvent(userId, eventType, context)` – lọc workflows khớp trigger.
- `runWorkflow(workflow, userId, context)` – render payload template → queue actions.

#### 3.3 Workers / Jobs

- `api/brain/workers/action-runner-worker.js`
  - Chạy định kỳ (cron/PM2) → `executePendingActions()`.
- `api/brain/jobs/workflow-scheduler.js`
  - Trigger các workflow `schedule_daily` (hoặc các schedule khác sau này).

---

### 4. API Routes

#### 4.1 Actions – `api/brain/routes/actions.js`

- `POST /api/brain/actions` – queue action (`actionType`, `payload`, `sessionId?`).
- `GET /api/brain/actions?status=&limit=` – list actions.

#### 4.2 Workflows – `api/brain/routes/workflows.js`

- `GET /api/brain/workflows` – list workflows.
- `POST /api/brain/workflows` – create workflow.
- `PUT /api/brain/workflows/:id` – update.
- `DELETE /api/brain/workflows/:id` – delete.
- `POST /api/brain/workflows/:id/test` – test run với context giả lập.

#### 4.3 Tasks – `api/brain/routes/tasks.js`

- `GET /api/brain/tasks?status=&limit=`
- `POST /api/brain/tasks`
- `PUT /api/brain/tasks/:id`

#### 4.4 Notifications – `api/brain/routes/notifications.js`

- `GET /api/brain/notifications?limit=`
- `POST /api/brain/notifications/read` – mark read theo list id.

#### 4.5 Register trong `api/server.js`

- Đã/ sẽ thêm:
  - `const brainActionsRoutes = require('./brain/routes/actions');`
  - `const brainWorkflowsRoutes = require('./brain/routes/workflows');`
  - `const brainTasksRoutes = require('./brain/routes/tasks');`
  - `const brainNotificationsRoutes = require('./brain/routes/notifications');`
- Và:
  - `app.use('/api/brain/actions', aiLimiter, brainActionsRoutes);`
  - `app.use('/api/brain/workflows', aiLimiter, brainWorkflowsRoutes);`
  - `app.use('/api/brain/tasks', aiLimiter, brainTasksRoutes);`
  - `app.use('/api/brain/notifications', aiLimiter, brainNotificationsRoutes);`

---

### 5. Frontend (types, hooks, components)

#### 5.1 Types (`src/brain/types`)

- `action.types.ts` – `BrainAction`, `QueueActionRequest`.
- `workflow.types.ts` – `BrainWorkflow`, `CreateWorkflowRequest`.
- `task.types.ts` – `BrainTask`, `TaskStatus`, `TaskPriority`, `CreateTaskRequest`.
- `notification.types.ts` – `BrainNotification`.

#### 5.2 Hooks (`src/brain/hooks`)

- `useActions.ts` – list + queue action.
- `useWorkflows.ts` – list / create / update / delete / test workflow.
- `useTasks.ts` – list / create / update task.
- `useNotifications.ts` – list + mark read.

#### 5.3 Components (`src/brain/components`)

- `ActionCenter.tsx` – UI theo dõi & queue actions.
- `WorkflowManager.tsx` – quản lý workflows.
- `TaskList.tsx` – UI quản lý tasks.
- `NotificationBell.tsx` – icon bell + unread count.

#### 5.4 API client (`src/brain/lib/services/brain-api.ts`)

- Thêm methods Phase 5:
  - `getActions`, `queueAction`
  - `getWorkflows`, `createWorkflow`, `updateWorkflow`, `deleteWorkflow`, `testWorkflow`
  - `getTasks`, `createTask`, `updateTask`
  - `getNotifications`, `markNotificationsRead`

---

### 6. Integration & UI

- Cập nhật `src/pages/BrainDashboard.tsx` (sau khi đã ổn định):
  - Thêm tab / section cho **Tasks**, **Workflows**, **Actions**.
  - Thêm `NotificationBell` vào layout/header chung.

---

### 7. Handoff cho Copilot / DBA

- File: `COPILOT_SQL_PHASE5_INSTRUCTIONS.md` – hướng dẫn apply 011 & 012 + câu lệnh verify.

---

### 8. Order triển khai (đã / sẽ thực hiện)

1. DB migrations 011, 012.
2. Services backend + workers.
3. Routes + register trong `server.js`.
4. Types + hooks + components frontend.
5. API client methods.
6. UI integration + testing.
7. Docs & SQL handoff.

