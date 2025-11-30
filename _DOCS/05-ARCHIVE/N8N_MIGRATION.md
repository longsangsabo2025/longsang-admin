# 🔄 N8N Workflows - Tách riêng khỏi LongSang

## ✅ Hoàn tất

**Ngày:** 17/11/2025

n8n đã được tách thành project riêng để:

- Giảm từ 2687 → ~500 packages cho LongSang
- Chỉ chạy n8n khi cần phát triển workflows
- Tổ chức code rõ ràng hơn

## 📁 Project mới

**Vị trí:** `D:\PROJECTS\01-MAIN-PRODUCTS\n8n-workflows`

**Cấu trúc:**

```
n8n-workflows/
├── package.json       # Chỉ có n8n dependency
├── .env.example       # Environment template
├── workflows/         # Export/import workflows
└── README.md         # Hướng dẫn sử dụng
```

## 🚀 Cách sử dụng

### Từ LongSang (khuyến nghị)

```bash
npm run workflows
```

### Trực tiếp từ n8n-workflows

```bash
cd ../n8n-workflows
npm install      # Lần đầu tiên
npm start        # Chạy n8n local
npm run dev      # Chạy với tunnel (public URL)
```

## 🔗 Kết nối

n8n (port 5678) có thể gọi LongSang API (port 3000):

- HTTP Request node → `http://localhost:3000/api/*`
- Webhook từ n8n → LongSang nhận webhook

## 📝 Thay đổi trong LongSang

### Scripts đã xóa

- `n8n:start`
- `n8n:dev`
- `n8n:service`
- `dev:full`
- `workflows:create`

### Script mới

- `workflows` - Chạy script helper để start n8n project

### Dependencies

- Đã xóa `n8n` khỏi devDependencies

## 🎯 Lợi ích

1. **Giảm kích thước:** 2687 → ~500 packages
2. **Tốc độ:** `npm install` nhanh hơn rất nhiều
3. **Rõ ràng:** Tách biệt concerns
4. **Linh hoạt:** Chỉ chạy khi cần

## 🔄 Migration checklist

- [x] Tạo project n8n-workflows
- [x] Xóa n8n khỏi LongSang package.json
- [x] Tạo helper script start-n8n.ps1
- [x] Cập nhật npm scripts
- [x] Tạo documentation

## 📚 Next steps

Nếu đang có workflows cũ trong `.n8n/`:

```bash
# Export workflows cũ (nếu có)
cd path/to/old/.n8n
n8n export:workflow --all --output=../n8n-workflows/workflows

# Import vào n8n mới
cd ../n8n-workflows
npm start
# Sau đó import qua UI hoặc:
npm run import
```
