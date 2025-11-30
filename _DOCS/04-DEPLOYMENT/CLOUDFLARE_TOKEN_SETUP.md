# ====================================================
# HƯỚNG DẪN TẠO CLOUDFLARE API TOKEN
# Thay vì dùng Global API Key
# ====================================================

## Bước 1: Tạo Custom API Token

1. Vào: https://dash.cloudflare.com/profile/api-tokens
2. Click: **"Create Token"**
3. Tìm template: **"Edit zone DNS"** → Click **"Use template"**

## Bước 2: Chỉnh sửa permissions

**Thêm các permissions sau:**

### Account Permissions:
- Account Settings: Read

### Zone Permissions:  
- Zone: Read
- Zone Settings: Read
- DNS: Edit
- Email Routing Address: Edit
- Email Routing Rules: Edit

## Bước 3: Zone Resources

- Include → Specific zone → **longsang.org**

## Bước 4: TTL & IP

- Client IP Address Filtering: Để trống
- TTL: Start Date (now), End Date (không giới hạn)

## Bước 5: Create & Copy

1. Click **"Continue to summary"**
2. Click **"Create Token"**
3. **COPY TOKEN** (chỉ hiện 1 lần!)

Token sẽ có format: `abcdef123456_LONG_STRING_HERE`

---

## Test Token

Paste token vào đây để test:
```powershell
$TOKEN = "YOUR_TOKEN_HERE"
$headers = @{"Authorization" = "Bearer $TOKEN"}
Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/user/tokens/verify" -Headers $headers
```

---

## Sau khi có token:

Cung cấp cho tôi:
```
CLOUDFLARE_API_TOKEN=your_new_token_here
```

Và tôi sẽ setup email routing ngay! 🚀
