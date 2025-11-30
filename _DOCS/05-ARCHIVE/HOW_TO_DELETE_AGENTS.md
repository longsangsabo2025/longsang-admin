# 🧹 Hướng Dẫn Xóa Agents Trùng Lặp

## Cách 1: Xóa Qua UI (Đơn Giản Nhất) ✅

1. **Vào Dashboard:** `http://localhost:8080/automation`

2. **Xem Danh Sách Agents:**
   - Bạn sẽ thấy tất cả agents hiện có
   - Mỗi agent có button "Delete"

3. **Xóa Từng Agent:**
   - Click vào agent bất kỳ để vào detail page
   - Scroll xuống cuối
   - Click button "Delete Agent" (màu đỏ)
   - Confirm để xóa

4. **Hoặc Xóa Hàng Loạt:**
   - Tôi có thể tạo button "Delete All Demo Agents" trong UI

## Cách 2: Xóa Qua Supabase Dashboard 🗄️

1. **Vào Supabase Dashboard:**
   - Truy cập: <https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb>
   - Login với account của bạn

2. **Vào Table Editor:**
   - Sidebar → Table Editor
   - Chọn table: `ai_agents`

3. **Xóa Agents:**
   - Chọn các rows muốn xóa (checkbox)
   - Click "Delete" button
   - Hoặc click vào từng row → Delete icon

4. **Xóa Tất Cả (SQL Editor):**

   ```sql
   -- Xóa tất cả agents demo
   DELETE FROM ai_agents 
   WHERE name LIKE '%Agent' 
   OR name LIKE 'Demo%';
   
   -- Hoặc xóa tất cả
   DELETE FROM ai_agents;
   ```

## Cách 3: Tạo Button Xóa Trong App 🚀

Tôi có thể tạo feature mới:

**Dashboard Header** → Add button "Clean Up Agents"

- Click để xóa tất cả demo agents
- Giữ lại agents do user tạo
- Confirm dialog trước khi xóa

---

## Bạn Muốn Cách Nào?

1. ✅ **Xóa thủ công qua UI** (ngay bây giờ - vào /automation)
2. 🗄️ **Xóa qua Supabase Dashboard** (cần login)
3. 🚀 **Tạo button tự động xóa** (tôi code thêm feature)

Bạn chọn cách nào nhỉ?
