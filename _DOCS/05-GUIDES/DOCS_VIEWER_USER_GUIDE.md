# 📚 Hướng Dẫn Sử Dụng Documentation Viewer

> **Phiên bản:** 1.0  
> **Cập nhật:** 2025-11-29  
> **Tác giả:** LongSang Admin Team

---

## 📖 Giới Thiệu

**Documentation Viewer** là công cụ quản lý và xem tài liệu tích hợp trong Admin Dashboard, cho phép bạn:

- 📂 Duyệt tất cả tài liệu theo categories
- 🔍 Tìm kiếm nhanh
- 📝 Xem nội dung với syntax highlighting
- 📋 Copy nội dung
- 🔗 Mở file trong VS Code

---

## 🚀 Truy Cập

### Cách 1: Từ Sidebar
1. Mở Admin Dashboard: `http://localhost:8080/admin`
2. Click vào **📖 Docs Viewer** trong sidebar

### Cách 2: Direct URL
```
http://localhost:8080/admin/docs/viewer
```

### Cách 3: Từ nút Help (?)
- Click nút **?** ở góc trên bên phải của bất kỳ trang nào

---

## 🖥️ Giao Diện

### Sidebar (Bên Trái)

```
┌─────────────────────────┐
│ 📂 Project Path         │  ← Chọn project
│ [D:\0.PROJECTS\...]  🔄 │
├─────────────────────────┤
│ 🔍 Tìm kiếm...          │  ← Search box
├─────────────────────────┤
│ 🚀 BẮT ĐẦU              │
│   👔 Giới thiệu         │  ← Quick links
│   📖 Hướng dẫn          │
│   ⚡ Quick Start        │
├─────────────────────────┤
│ 📁 01-ARCHITECTURE (14) │  ← Categories
│   ├─ ARCHITECTURE.md    │
│   └─ SYSTEM_DESIGN.md   │
│ 📁 02-FEATURES (104)    │
│   └─ ...                │
├─────────────────────────┤
│ Total: 299 │ Recent: 45 │  ← Stats
└─────────────────────────┘
```

### Main Content (Bên Phải)

```
┌───────────────────────────────────────────┐
│ 🏠 > 02-FEATURES > AUTH_COMPLETE.md   📋 📤│  ← Toolbar
├───────────────────────────────────────────┤
│                                           │
│  # Authentication Complete                │
│                                           │
│  ## Overview                              │  ← Rendered
│  This document describes...               │     Markdown
│                                           │
│  ```javascript                            │
│  const auth = new Auth();                 │  ← Syntax
│  ```                                      │     Highlighting
│                                           │
└───────────────────────────────────────────┘
```

---

## 📂 Categories (Danh Mục)

| Category | Icon | Mô tả |
|----------|------|-------|
| **01-ARCHITECTURE** | 🏗️ | Kiến trúc hệ thống, design patterns |
| **02-FEATURES** | ✨ | Tài liệu tính năng, implementations |
| **03-OPERATIONS** | ⚙️ | Vận hành, troubleshooting |
| **04-DEPLOYMENT** | 🚀 | Hướng dẫn deploy, CI/CD |
| **05-GUIDES** | 📖 | Hướng dẫn sử dụng |
| **06-AI** | 🤖 | AI, Machine Learning |
| **07-API** | 🔌 | API documentation |
| **08-DATABASE** | 🗄️ | Database schemas |
| **09-REPORTS** | 📊 | Báo cáo, status |
| **10-ARCHIVE** | 📦 | Tài liệu cũ |

---

## 🔍 Tìm Kiếm

### Search Box
1. Nhập từ khóa vào ô **"Tìm kiếm tài liệu..."**
2. Kết quả filter real-time theo:
   - Tên file
   - Đường dẫn

### Tips
- Tìm theo tên: `AUTH`
- Tìm theo category: `DEPLOYMENT`
- Tìm theo extension: `.md`

---

## 📝 Xem Tài Liệu

### Bước 1: Chọn Document
Click vào tên file trong sidebar

### Bước 2: Đọc Nội Dung
- Markdown được render đẹp
- Code blocks có syntax highlighting
- Tables hiển thị đúng format
- Links clickable

### Bước 3: Actions

| Nút | Chức năng |
|-----|-----------|
| 📋 Copy | Copy toàn bộ nội dung |
| 📤 Open | Mở file trong VS Code |

---

## 🔄 Chuyển Project

1. Nhập đường dẫn project vào ô **Project Path**
   ```
   D:\0.PROJECTS\02-SABO-ECOSYSTEM\sabo-arena\app
   ```
2. Click nút 🔄 **Refresh**
3. Sidebar cập nhật với docs của project mới

### Các Project Có Sẵn

| Project | Path |
|---------|------|
| longsang-admin | `D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin` |
| sabo-arena | `D:\0.PROJECTS\02-SABO-ECOSYSTEM\sabo-arena\app` |
| sabo-hub | `D:\0.PROJECTS\02-SABO-ECOSYSTEM\sabo-hub` |
| ai_secretary | `D:\0.PROJECTS\01-MAIN-PRODUCTS\ai_secretary` |

---

## ⌨️ Keyboard Shortcuts

| Phím | Chức năng |
|------|-----------|
| `Ctrl + K` | Focus vào Search |
| `Ctrl + C` | Copy nội dung (khi đang xem doc) |
| `↑` `↓` | Navigate trong tree |
| `Enter` | Mở document được chọn |
| `Esc` | Clear search |

---

## 🔧 Troubleshooting

### Document không load?
1. Kiểm tra API server đang chạy: `http://localhost:3001/api/health`
2. Refresh trang
3. Kiểm tra console log (F12)

### Search không hoạt động?
- Đảm bảo đã nhập ít nhất 2 ký tự
- Clear và thử lại

### Syntax highlighting lỗi?
- Đảm bảo code block có language tag:
  ````markdown
  ```javascript
  // code here
  ```
  ````

---

## 📊 API Endpoints

Documentation Viewer sử dụng các API:

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/docs/scan` | GET | Scan tất cả documents |
| `/api/docs/stats` | GET | Thống kê |
| `/api/docs/content/:id` | GET | Lấy nội dung file |
| `/api/docs/search?q=` | GET | Tìm kiếm |
| `/api/docs/categories` | GET | Danh sách categories |

---

## 🎯 Best Practices

### Khi Viết Documentation

1. **Đặt tên file rõ ràng**
   ```
   ✅ AUTH_IMPLEMENTATION.md
   ❌ doc1.md
   ```

2. **Bắt đầu với heading**
   ```markdown
   # Tiêu đề chính
   > Mô tả ngắn
   ```

3. **Sử dụng categories đúng**
   - Feature docs → `02-FEATURES`
   - API docs → `07-API`
   - Guides → `05-GUIDES`

4. **Include metadata**
   ```markdown
   > **Version:** 1.0
   > **Updated:** 2025-11-29
   > **Author:** Your Name
   ```

---

## 🔗 Liên Kết Hữu Ích

- [Admin Dashboard](/admin)
- [API Health Check](http://localhost:3001/api/health)
- [Documentation System Guide](./_DOCS/DOCS_SYSTEM_GUIDE.md)

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Check console log (F12 → Console)
2. Kiểm tra API: `http://localhost:3001/api/docs/categories`
3. Restart servers nếu cần

---

*Documentation Viewer v1.0 - LongSang Admin*
