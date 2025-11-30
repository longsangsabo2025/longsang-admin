# 🔌 Hướng Dẫn: Kết Nối Database Ổn Định

## 📚 PostgreSQL Là Gì?

**PostgreSQL** là database engine mạnh mẽ mà Supabase sử dụng.

**Ví dụ đơn giản:**
- **PostgreSQL** = Kho chứa dữ liệu
- **Supabase** = Cửa hàng bọc bên ngoài (thêm API, Auth, Storage)
- **Admin App** = Khách hàng mua đồ

**Mối quan hệ:**
```
Admin App → Supabase API → PostgreSQL Database
```

## ✅ Đề Xuất: Kết Nối Ổn Định

### 1. **Supabase Client Nâng Cao** (Đã Tạo)

File: `src/lib/supabase-stable.ts`

**Tính năng:**
- ✅ **Retry tự động** - Tự động thử lại khi lỗi (3 lần)
- ✅ **Health check** - Kiểm tra kết nối mỗi 30 giây
- ✅ **Auto-reconnect** - Tự động kết nối lại khi mất kết nối
- ✅ **Error handling** - Xử lý lỗi thông minh hơn

### 2. **Cách Sử Dụng**

#### Cách 1: Thay Thế Client Hiện Tại (Dễ nhất)

```typescript
// Trong các file components/pages
// Thay đổi import:

// Từ:
import { supabase } from '@/lib/supabase';

// Thành:
import { supabaseStable as supabase } from '@/lib/supabase-stable';

// Sau đó dùng bình thường như cũ:
const { data } = await supabase.from('projects').select('*');
```

#### Cách 2: Dùng Wrapper Với Retry (Nâng cao)

```typescript
import { supabaseStable } from '@/lib/supabase-stable';

// Query với retry tự động
const { data, error } = await supabaseStable.query(async (client) => {
  return await client.from('projects').select('*');
});
```

### 3. **Kiểm Tra Kết Nối**

```typescript
import { supabaseStable } from '@/lib/supabase-stable';

// Kiểm tra connection
const isHealthy = await supabaseStable.checkHealth();
console.log('Connection:', isHealthy ? '✅ OK' : '❌ Failed');

// Kiểm tra status hiện tại
const status = supabaseStable.isHealthy();
```

### 4. **Ví Dụ Thực Tế**

#### Component với Retry Logic

```typescript
import { useState, useEffect } from 'react';
import { supabaseStable as supabase } from '@/lib/supabase-stable';

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Supabase client tự động retry nếu lỗi
      const { data, error } = await supabase
        .from('projects')
        .select('*');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      {projects.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

## 📋 Checklist Migration

- [ ] Đọc tài liệu PostgreSQL: `_DOCS/POSTGRESQL_EXPLAINED.md`
- [ ] Xem stable client: `src/lib/supabase-stable.ts`
- [ ] Test stable client trên 1-2 components
- [ ] Migrate dần các components khác
- [ ] Monitor connection errors

## 🎯 Lợi Ích

1. **Kết nối ổn định hơn** - Tự động retry khi lỗi
2. **Tự động reconnect** - Không cần reload page
3. **Error handling tốt hơn** - Phân biệt các loại lỗi
4. **Monitoring** - Biết được connection status

## 📚 Tài Liệu Tham Khảo

- `_DOCS/POSTGRESQL_EXPLAINED.md` - Giải thích PostgreSQL
- `_DOCS/STABLE_CONNECTION_RECOMMENDATIONS.md` - Đề xuất chi tiết
- `src/lib/supabase-stable.ts` - Code implementation

---

**Bước tiếp theo:** Test stable client trên 1-2 components và xem kết quả! 🚀

