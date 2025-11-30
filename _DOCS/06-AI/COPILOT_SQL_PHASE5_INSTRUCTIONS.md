## COPILOT SQL INSTRUCTIONS – PHASE 5 (Actions, Workflows, Tasks, Notifications)

**Project:** longsang-admin
**Phase:** 5 – Active Brain & Automation Layer
**Date:** 29/11/2025

---

### 1. Mục tiêu

Apply 2 migration files để tạo các bảng Phase 5:

1. `supabase/migrations/brain/011_actions_and_workflows.sql`
2. `supabase/migrations/brain/012_tasks_and_notifications.sql`

Các bảng được tạo:

- `brain_actions`
- `brain_workflows`
- `brain_tasks`
- `brain_notifications`

Tất cả đều bật RLS với policy cho phép user chỉ quản lý data của chính họ.

---

### 2. Cách apply nhanh

#### 2.1 Dùng psql (trực tiếp Postgres)

```bash
psql -U postgres -d YOUR_DATABASE_NAME -f supabase/migrations/brain/011_actions_and_workflows.sql
psql -U postgres -d YOUR_DATABASE_NAME -f supabase/migrations/brain/012_tasks_and_notifications.sql
```

#### 2.2 Dùng Supabase CLI (nếu đang dùng flow migrations chuẩn của dự án)

```bash
supabase db push
```

Hoặc nếu project này đang dùng `supabase db reset` / `supabase db start` theo script sẵn, có thể chạy theo hướng dẫn trong `AI_WORKSPACE_SQL_MIGRATIONS.md` / `STEP1_RUN_MIGRATION.md`.

---

### 3. Lệnh verify sau khi apply

Chạy trong psql / Supabase SQL Editor:

```sql
-- Kiểm tra bảng đã tồn tại
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'brain_actions',
    'brain_workflows',
    'brain_tasks',
    'brain_notifications'
  );

-- Kiểm tra RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'brain_actions',
    'brain_workflows',
    'brain_tasks',
    'brain_notifications'
  );

-- Kiểm tra index
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_brain_%';
```

Kỳ vọng:

- 4 bảng xuất hiện.
- `rowsecurity = true` cho cả 4 bảng.
- Indexes cho `user_id`, `status`, `created_at`/`due_date` như trong file `.sql`.

---

### 4. Lưu ý kỹ thuật

- Giả định `uuid_generate_v4()` và `moddatetime()` đã tồn tại (được tạo ở các phase trước).
- Các FK dùng tới:
  - `auth.users(id)`
  - `public.brain_master_session(id)`
  - `public.brain_domains(id)`
- Nếu chạy trên môi trường Supabase chuẩn của dự án, các bảng/extension này đã có sẵn từ Phase 1–4.

---

### 5. Smoke test nhanh (tùy chọn, nhưng nên chạy)

Sau khi migrations thành công:

1. Insert thử 1 row vào `brain_actions`:

```sql
INSERT INTO public.brain_actions (user_id, action_type, payload)
VALUES ('00000000-0000-0000-0000-000000000000', 'create_task', '{"title": "Test from SQL"}');
```

2. Kiểm tra select:

```sql
SELECT * FROM public.brain_actions ORDER BY created_at DESC LIMIT 5;
```

3. Backend của admin đã có:
   - Service `api/brain/services/action-executor-service.js`
   - Service `api/brain/services/workflow-engine-service.js`
   - Routes:
     - `/api/brain/actions`
     - `/api/brain/workflows`
     - `/api/brain/tasks`
     - `/api/brain/notifications`

Nếu những API này trả về 200 và thao tác được trên các bảng tương ứng thì Phase 5 DB đã OK.

---

**Status:** Sẵn sàng để apply ✅

