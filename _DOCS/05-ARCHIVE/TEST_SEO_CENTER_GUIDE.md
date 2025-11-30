# 🧪 TEST SEO MANAGEMENT CENTER - LONGSANG.ORG

**Server:** <http://localhost:8080>  
**Test Domain:** longsang.org

---

## 📋 TEST STEPS

### 1. ✅ Login Admin

1. Mở: <http://localhost:8080/admin/login>
2. Login với credentials admin của bạn

### 2. ✅ Vào SEO Center

1. Sau khi login, click menu **"SEO Center"** ở sidebar
2. Hoặc truy cập trực tiếp: <http://localhost:8080/admin/seo-center>

### 3. ✅ Test Domain Management

**Thêm domain longsang.org:**

1. Click tab **"Domains"**
2. Click button **"Thêm Domain"**
3. Nhập thông tin:

   ```
   Tên Domain: Long Sang Organization
   URL: https://longsang.org
   Google API JSON: (để trống hoặc paste nếu có)
   Bing API Key: (để trống hoặc paste nếu có)
   ```

4. Click **"Thêm Domain"**
5. ✅ Verify: Domain xuất hiện trong table

**Test Features:**

- ✅ Toggle "Auto Index" switch
- ✅ Click "Edit" icon
- ✅ Toggle "Hoạt động" / "Tắt" status
- ✅ Xem stats: Total URLs, Indexed URLs, Progress %

### 4. ✅ Test Indexing Monitor

1. Click tab **"Indexing"**
2. Xem:
   - 📊 Stats cards: Tổng URLs, Đang chờ, Đang crawl, Đã indexed, Thất bại
   - 📋 Queue table với sample URLs
   - 🔄 Click "Làm mới" button
   - ♻️ Click "Thử lại thất bại" button (nếu có failed)

### 5. ✅ Test Sitemap Generator

1. Click tab **"Sitemap"**
2. Xem danh sách sitemaps:
   - sitemap.xml
   - sitemap-users.xml
   - sitemap-matches.xml
   - sitemap-news.xml
3. Click **"Tạo lại Sitemap"**
4. Click **"Tải xuống"** để download

### 6. ✅ Test Keyword Tracker

1. Click tab **"Keywords"**
2. Xem sample keywords với:
   - Position rankings
   - Change indicators (↑ ↓)
   - Volume & Difficulty metrics

### 7. ✅ Test SEO Settings

1. Click tab **"Settings"**
2. Test các toggles:
   - ✅ "Kích hoạt Google API"
   - ✅ "Kích hoạt Bing API"
   - ✅ "Auto-submit nội dung mới"
   - ✅ "Tự động cập nhật Sitemap"
3. Nhập test data vào các fields:
   - Google Service Account JSON
   - Bing API Key
   - Daily Quota Limit
   - Retry hours
   - Webhook URL
4. Click **"Lưu Cài Đặt"**
5. ✅ Verify: Toast notification "Đã lưu"

---

## 🎯 EXPECTED RESULTS

### Domain Management

- ✅ Có thể thêm domain longsang.org
- ✅ Domain hiển thị trong table với đầy đủ thông tin
- ✅ Toggle switches hoạt động
- ✅ Stats hiển thị chính xác (ban đầu 0 URLs)
- ✅ Edit/Delete buttons responsive

### Indexing Monitor  

- ✅ Stats cards hiển thị số liệu
- ✅ Progress bars hoạt động
- ✅ Queue table load được
- ✅ Refresh button trigger toast
- ✅ Link to Google search hoạt động

### Sitemap

- ✅ List 4 sitemaps
- ✅ Hiển thị URLs count, file size, last update
- ✅ Generate button trigger toast
- ✅ Download buttons responsive

### Keywords

- ✅ Hiển thị 4 sample keywords
- ✅ Position badges với màu sắc
- ✅ Change indicators (arrows) hiển thị
- ✅ Volume & Difficulty metrics

### Settings

- ✅ Tất cả toggles hoạt động smooth
- ✅ Input fields accept text
- ✅ Number inputs validate
- ✅ Save button trigger success toast
- ✅ Form layout responsive

---

## 📸 UI ELEMENTS TO CHECK

### Overall Layout

- ✅ Header với icon và title
- ✅ Subtitle description
- ✅ 4 quick stats cards (Tổng Domains, URLs Indexed, Organic Traffic, Top Rankings)
- ✅ 6 tabs navigation
- ✅ Responsive design

### Colors & Styling

- ✅ Primary colors consistent
- ✅ Icons match theme
- ✅ Badges có màu phù hợp status
- ✅ Hover effects
- ✅ Active tab highlighting

### Interactions

- ✅ Buttons clickable
- ✅ Dialogs open/close smooth
- ✅ Form validation
- ✅ Toast notifications
- ✅ Loading states (nếu có)

---

## 🐛 BUGS TO WATCH

### Potential Issues

- ⚠️ Database connection errors (vì tables chưa tạo)
- ⚠️ RLS policies block data
- ⚠️ Missing environment variables
- ⚠️ TypeScript errors in console

### Workarounds

- 🔧 Mock data đang hardcoded trong components
- 🔧 Actual API calls sẽ cần implement sau
- 🔧 Database tables cần create manual

---

## ✅ TEST CHECKLIST

**UI/UX:**

- [ ] All 6 tabs load successfully
- [ ] Quick stats cards display numbers
- [ ] Tables render without errors
- [ ] Forms are functional
- [ ] Buttons trigger actions
- [ ] Toasts appear on actions
- [ ] Icons display correctly
- [ ] Layout is responsive

**Domain Management:**

- [ ] "Thêm Domain" dialog opens
- [ ] Form accepts input
- [ ] Domain adds to table
- [ ] Edit button works
- [ ] Delete button works
- [ ] Toggle switches work
- [ ] Stats update correctly

**Indexing Monitor:**

- [ ] Stats cards show data
- [ ] Progress bars render
- [ ] Queue table loads
- [ ] Status badges correct
- [ ] Refresh works
- [ ] External links work

**Other Tabs:**

- [ ] Sitemap tab displays files
- [ ] Keywords tab shows rankings
- [ ] Analytics tab (placeholder)
- [ ] Settings tab fully functional

**Performance:**

- [ ] Page loads < 2 seconds
- [ ] No console errors
- [ ] Smooth transitions
- [ ] No layout shifts

---

## 📊 NEXT STEPS AFTER TEST

1. ✅ Verify UI works perfectly
2. 🔧 Create database tables (if needed)
3. 🔌 Connect to Supabase
4. 🔄 Implement real data fetching
5. 🚀 Test with actual Google/Bing APIs
6. 📈 Add analytics integration
7. 🤖 Implement auto-indexing service

---

## 💡 TESTING TIPS

1. **Open DevTools Console** - Watch for errors
2. **Check Network Tab** - See API calls (will fail without DB)
3. **Test Mobile View** - Ensure responsive
4. **Try All Interactions** - Click everything!
5. **Note Bugs** - Document any issues found

---

**Ready to test!** 🚀

Open: <http://localhost:8080/admin/seo-center>
