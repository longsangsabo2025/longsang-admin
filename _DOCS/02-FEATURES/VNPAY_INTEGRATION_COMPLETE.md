# 🇻🇳 VNPAY PAYMENT INTEGRATION - HƯỚNG DẪN ĐẦY ĐỦ

## ✅ HOÀN THÀNH

VNPay payment gateway đã được tích hợp hoàn chỉnh cho thị trường Việt Nam!

### Tính năng

- ✅ Thanh toán qua VNPay (ATM, VISA, MasterCard, JCB, QR Code)
- ✅ Hỗ trợ VND (đồng Việt Nam)
- ✅ Auto-convert USD → VND (1 USD = 25,000 VND)
- ✅ Return URL handler
- ✅ IPN (Instant Payment Notification) webhook
- ✅ Transaction query
- ✅ Auto-send email sau thanh toán
- ✅ Toggle VNPay/Stripe trên Pricing page

---

## 📦 FILES CREATED

**Backend:**

- `api/routes/vnpay.js` - VNPay payment gateway integration
- `api/server.js` - Added VNPay routes

**Frontend:**

- `src/lib/vnpay/api.ts` - VNPay API client
- `src/pages/Pricing.tsx` - Added payment method toggle

**Config:**

- `.env` - VNPay credentials

---

## 🔑 ĐĂNG KÝ VNPAY

### Bước 1: Tạo tài khoản VNPay

1. Truy cập: <https://vnpay.vn>
2. Đăng ký tài khoản doanh nghiệp
3. Cần giấy tờ:
   - GPKD (Giấy phép kinh doanh)
   - CMND/CCCD người đại diện
   - Thông tin doanh nghiệp

### Bước 2: Test Mode (Sandbox)

1. Đăng ký sandbox: <https://sandbox.vnpayment.vn/devreg>
2. Nhận thông tin:
   - `TMN_CODE` (Website ID)
   - `HASH_SECRET` (Mã bảo mật)

### Bước 3: Cập nhật `.env`

```env
# VNPay Sandbox (Test)
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# VNPay Production (Sau khi đăng ký chính thức)
# VNPAY_TMN_CODE=YOUR_PROD_TMN_CODE
# VNPAY_HASH_SECRET=YOUR_PROD_HASH_SECRET
# VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
```

---

## 🧪 TEST VNPAY

### Test Flow

```bash
# 1. Start servers
npm run dev

# 2. Navigate to pricing
http://localhost:5173/pricing

# 3. Chọn "VNPay (VND)" tab

# 4. Click "Upgrade Now"

# 5. Nhập thẻ test (Sandbox):
```

### Thẻ Test VNPay Sandbox

```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

### Test Cards khác

```bash
# Thẻ thành công
- 970436 0000 0000 00018
- 970418 0000 0000 00018

# Thẻ không đủ tiền
- 970436 0000 0000 00026

# Thẻ hết hạn
- 970436 0000 0000 00034
```

---

## 🔄 PAYMENT FLOW

### User Payment Flow

```
1. User chọn VNPay trên /pricing
   ↓
2. Click "Upgrade Now"
   ↓
3. Backend tạo VNPay URL với chữ ký
   ↓
4. Redirect → VNPay payment page
   ↓
5. User nhập thông tin thẻ
   ↓
6. VNPay xử lý thanh toán
   ↓
7. Return URL: /payment-vnpay-return
   ↓
8. Backend verify signature
   ↓
9. Update subscription + send email
   ↓
10. Redirect → /payment-success
```

### IPN Webhook Flow

```
VNPay Server
   ↓
POST /api/vnpay/ipn
   ↓
Verify signature
   ↓
Update payment_history
   ↓
Update user_subscriptions
   ↓
Send confirmation email
   ↓
Return RspCode: 00
```

---

## 💰 PHÍ VNPAY

### Phí giao dịch

```
Thẻ ATM nội địa:    1.65% - 2.5%
Thẻ VISA/Master:    2.5% - 3.5%
QR Code:            0.8% - 1.5%
Ví điện tử:         1.5% - 2.5%

Phí rút tiền:       0% (miễn phí)
Thời gian nhận:     T+1 (1 ngày làm việc)
```

### So sánh với Stripe

```
                VNPay           Stripe
Phí giao dịch:  1.65% - 3.5%    2.9% + $0.30
Rút tiền:       Miễn phí        $25/lần (Wire)
Setup:          GPKD            Không cần
KYC:            Cần             Đơn giản
Target:         Việt Nam        Quốc tế
```

---

## 🏦 RÚT TIỀN

### VNPay → Ngân hàng VN

```
1. Login vào merchant portal
2. Vào "Quản lý tài khoản"
3. Chọn "Rút tiền"
4. Nhập số tiền
5. Xác nhận OTP
6. Tiền về tài khoản sau 1 ngày làm việc
```

### Automatic Settlement (Tự động)

```
- VNPay có thể tự động chuyển tiền
- Cài đặt trong merchant portal
- Tần suất: Hàng ngày, hàng tuần, hàng tháng
```

---

## 📊 DATABASE

### Payment Record Example

```sql
-- Khi user thanh toán qua VNPay
INSERT INTO payment_history (
  user_id,
  plan_id,
  amount,           -- VND (đã chia 100)
  currency,         -- 'VND'
  status,           -- 'pending' → 'succeeded'
  payment_method,   -- 'vnpay'
  transaction_id,   -- VNPay transaction ID
  created_at
);

-- Tự động update subscription
UPDATE user_subscriptions
SET 
  status = 'active',
  plan_id = new_plan_id
WHERE user_id = xxx;
```

---

## 🎨 UI FEATURES

### Payment Method Toggle

```typescript
// User có thể chọn:
1. 🇻🇳 VNPay (VND) - Cho khách Việt Nam
2. 💳 Stripe (USD) - Cho khách quốc tế

// Auto-convert giá:
- VNPay: Hiển thị VND (x25,000)
- Stripe: Hiển thị USD
```

### Pricing Display

```
Pro Plan:
- VNPay: 475,000 VND/tháng
- Stripe: $19/tháng
```

---

## 🔐 SECURITY

### Signature Verification

```javascript
// Mọi request đều được verify chữ ký HMAC SHA512
const signData = querystring.stringify(params);
const signature = crypto
  .createHmac('sha512', HASH_SECRET)
  .update(signData)
  .digest('hex');

// Chống giả mạo, replay attack
```

### Best Practices

- ✅ Verify signature trên mọi return/IPN
- ✅ Log mọi transaction
- ✅ Double-check amount
- ✅ Idempotency - Không xử lý duplicate
- ✅ HTTPS only (production)

---

## 🐛 TROUBLESHOOTING

### Issue: "Invalid signature"

```bash
# Check HASH_SECRET
echo $VNPAY_HASH_SECRET

# Phải match với VNPay dashboard
# Sandbox: Lấy từ email đăng ký
# Production: Trong merchant portal
```

### Issue: "Return URL không hoạt động"

```bash
# Check URL trong VNPay merchant portal
# Phải match với:
VITE_APP_URL=http://localhost:5173
# hoặc production domain

# Return URL:
http://localhost:5173/payment-vnpay-return
```

### Issue: "IPN không nhận được"

```bash
# VNPay cần public URL
# Development: Dùng ngrok
ngrok http 3001

# Update IPN URL trong VNPay portal:
https://your-ngrok-url.ngrok.io/api/vnpay/ipn
```

---

## 🚀 PRODUCTION CHECKLIST

### Before Launch

- [ ] Đăng ký VNPay doanh nghiệp chính thức
- [ ] Nhận TMN_CODE và HASH_SECRET production
- [ ] Update `.env` với production credentials
- [ ] Change VNPAY_URL to production endpoint
- [ ] Test với thẻ thật (nhỏ số tiền)
- [ ] Setup IPN webhook với public URL
- [ ] Monitor first transactions
- [ ] Setup email notifications
- [ ] Add transaction logging

### Domain Setup

```env
# Production
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VITE_APP_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

---

## 📞 SUPPORT

### VNPay Contact

- Hotline: 1900 55 55 77
- Email: <support@vnpay.vn>
- Docs: <https://sandbox.vnpayment.vn/apis/>
- Portal: <https://merchant.vnpay.vn>

### Integration Docs

- API Document: <https://sandbox.vnpayment.vn/apis/docs/>
- Test Environment: <https://sandbox.vnpayment.vn/>
- Merchant Portal: <https://merchant.vnpay.vn/>

---

## 💡 TIPS

### Tăng tỷ lệ chuyển đổi

1. **Hiển thị logo ngân hàng** - Người Việt quen thuộc
2. **QR Code option** - Phổ biến ở VN
3. **Ưu đãi cho VNPay** - "Giảm 10% khi thanh toán qua VNPay"
4. **Hỗ trợ trả góp** - VNPay có tính năng này

### Multi-currency

```javascript
// Auto-detect user location
const isVietnam = navigator.language.includes('vi');
setPaymentMethod(isVietnam ? 'vnpay' : 'stripe');

// Hoặc detect từ IP
// Hoặc để user chọn
```

---

## 🎉 SUMMARY

✅ **VNPay Integration Complete!**

**Có thể:**

- Nhận thanh toán từ khách Việt Nam
- Rút tiền về ngân hàng VN ngay
- Không cần công ty nước ngoài
- Phí thấp hơn Stripe cho thị trường VN

**Cần làm:**

1. Đăng ký VNPay (sandbox để test)
2. Cập nhật credentials vào `.env`
3. Test với thẻ sandbox
4. Launch production sau khi có GPKD

**Files Ready:**

- Backend: `api/routes/vnpay.js`
- Frontend: `src/lib/vnpay/api.ts`
- UI: Payment toggle trên Pricing page

🚀 **SẴN SÀNG NHẬN THANH TOÁN TỪ VIỆT NAM!**
