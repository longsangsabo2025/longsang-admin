# ✅ Đề Xuất: Kết Nối Database Ổn Định

## 🎯 Mục Tiêu

Đảm bảo admin app kết nối với Supabase (PostgreSQL) một cách ổn định, tự động
retry và xử lý lỗi tốt.

## 📋 Đề Xuất Giải Pháp

### 1. ✅ Enhanced Supabase Client (Đã Tạo)

File: `src/lib/supabase-stable.ts`

**Features:**

- ✅ Retry logic tự động (3 lần với exponential backoff)
- ✅ Connection health check định kỳ (30s)
- ✅ Auto-reconnect khi mất kết nối
- ✅ Error handling thông minh (không retry lỗi 400/401/403/404)
- ✅ Connection pooling

### 2. 🔄 Cách Sử Dụng

#### Option 1: Thay Thế Client Hiện Tại (Khuyến nghị)

```typescript
// Thay đổi import
// Từ:
import { supabase } from '@/lib/supabase';

// Thành:
import { supabaseStable as supabase } from '@/lib/supabase-stable';
```

#### Option 2: Dùng Wrapper Với Retry

```typescript
import { supabaseStable } from '@/lib/supabase-stable';

// Query với retry tự động
const { data, error } = await supabaseStable.query(async (client) => {
  return await client.from('projects').select('*');
});
```

### 3. 📊 Monitoring Connection

Tạo component để monitor connection status:

```typescript
import { useEffect, useState } from 'react';
import { supabaseStable } from '@/lib/supabase-stable';

function ConnectionStatus() {
  const [healthy, setHealthy] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await supabaseStable.checkHealth();
      setHealthy(status);
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  return <div>{healthy ? '✅ Connected' : '❌ Disconnected'}</div>;
}
```

### 4. 🔧 Best Practices

#### A. Sử Dụng React Query (Đã có sẵn)

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabaseStable } from '@/lib/supabase-stable';

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabaseStable.query(async (client) => {
        return await client.from('projects').select('*');
      });
      if (error) throw error;
      return data;
    },
    retry: 3, // React Query cũng có retry
    retryDelay: 1000,
    staleTime: 30000, // Cache 30s
  });
}
```

#### B. Error Handling Tốt Hơn

```typescript
try {
  const { data, error } = await supabaseStable.query(async (client) => {
    return await client.from('projects').select('*');
  });

  if (error) {
    // Handle specific errors
    if (error.code === 'PGRST116') {
      console.error('Table not found');
    } else if (error.code === '42501') {
      console.error('Permission denied');
    } else {
      console.error('Database error:', error);
    }
    return;
  }

  // Use data
  console.log(data);
} catch (error) {
  // Handle network/timeout errors
  console.error('Connection error:', error);
}
```

#### C. Connection Pooling

Supabase tự động quản lý connection pooling, nhưng bạn có thể:

1. **Reuse client instance** (đã có singleton pattern)
2. **Batch queries** khi có thể
3. **Use pagination** cho large datasets

```typescript
// ❌ Bad: Multiple queries
for (const id of ids) {
  await supabase.from('projects').select('*').eq('id', id);
}

// ✅ Good: Batch query
await supabase.from('projects').select('*').in('id', ids);
```

### 5. 🚀 Nâng Cao: Direct PostgreSQL Connection (Tùy chọn)

Nếu cần kết nối trực tiếp PostgreSQL (không qua Supabase API):

```typescript
// Cần install: npm install pg
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Query trực tiếp
const result = await pool.query('SELECT * FROM projects');
```

**⚠️ Lưu ý:**

- Chỉ dùng ở backend (Node.js)
- Cần connection string từ Supabase
- Phức tạp hơn nhưng nhanh hơn

### 6. 📝 Migration Plan

#### Bước 1: Thêm Stable Client

✅ Đã tạo: `src/lib/supabase-stable.ts`

#### Bước 2: Test Thử

```typescript
// Test file
import { supabaseStable } from '@/lib/supabase-stable';

// Test health check
const healthy = await supabaseStable.checkHealth();
console.log('Connection healthy:', healthy);

// Test query với retry
const { data } = await supabaseStable.query(async (client) => {
  return await client.from('projects').select('*').limit(5);
});
```

#### Bước 3: Migrate Từng Component

1. Bắt đầu với 1-2 components
2. Test kỹ
3. Migrate dần các components khác

#### Bước 4: Monitor & Optimize

- Monitor connection errors
- Điều chỉnh retry logic nếu cần
- Optimize queries

## ✅ Checklist

- [x] Tạo stable Supabase client
- [ ] Test stable client
- [ ] Migrate một vài components
- [ ] Monitor connection errors
- [ ] Tạo connection status component
- [ ] Document cho team

## 📚 Tài Liệu Tham Khảo

- [Supabase Connection Pooling](https://supabase.com/docs/guides/platform/connection-pooling)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/admin.html)
- [React Query Retry Logic](https://tanstack.com/query/latest/docs/react/guides/queries#retry)

---

**Tóm lại:** Đã tạo stable client với retry logic. Bạn có thể bắt đầu test và
migrate dần! 🚀
