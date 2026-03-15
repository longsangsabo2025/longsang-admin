# ✅ HƯỚNG DẪN SETUP CRON JOB ĐÚNG - THEO PG_CRON DOCUMENTATION

## Bước 1: Enable pg_net Extension

Mở SQL Editor: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new

Chạy:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

## Bước 2: Tạo Cron Job với cron.schedule()

Chạy SQL này:
```sql
SELECT cron.schedule(
    'fetch-support-emails',
    '*/5 * * * *',
    $$
    SELECT extensions.http_post(
        url:='https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/fetch-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I"}'::jsonb,
        body:='{}'::jsonb
    );
    $$
);
```

## Bước 3: Verify

Kiểm tra job đã tạo:
```sql
SELECT * FROM cron.job WHERE jobname = 'fetch-support-emails';
```

Xem lịch sử chạy:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-support-emails')
ORDER BY start_time DESC 
LIMIT 10;
```

## Quản lý Cron Job

### Xóa job:
```sql
SELECT cron.unschedule('fetch-support-emails');
```

### Sửa schedule:
```sql
-- Xóa job cũ
SELECT cron.unschedule('fetch-support-emails');

-- Tạo lại với schedule mới
SELECT cron.schedule(...);
```

---

**Tham khảo:** https://github.com/citusdata/pg_cron
