# 🧪 VNPAY TEST GUIDE

## Servers Running ✅

- Frontend: <http://localhost:8084>
- API: <http://localhost:3001>

## Test Steps

### 1. Test Return URL Handler

```bash
# Open browser
http://localhost:8084/payment-vnpay-return?vnp_Amount=47500000&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_TransactionNo=14398770&vnp_TxnRef=VNPAY-TEST-123456

# Should see:
- Signature verification
- Payment success message
- Redirect to /payment-success
```

### 2. Test Full Payment Flow (Requires VNPay Sandbox Account)

**Step 1: Register Sandbox Account**

- Visit: <https://sandbox.vnpayment.vn/devreg>
- Fill form:

  ```
  Business Name: Long Sang Forge
  Email: your-email@example.com
  Phone: +84 xxx xxx xxx
  ```

- Nhận email với:
  - TMN_CODE
  - HASH_SECRET

**Step 2: Update .env**

```env
VNPAY_TMN_CODE=YOUR_TMN_CODE_FROM_EMAIL
VNPAY_HASH_SECRET=YOUR_HASH_SECRET_FROM_EMAIL
```

**Step 3: Test Payment**

1. Go to <http://localhost:8084/pricing>
2. Click tab "VNPay (VND)"
3. Select "Pro Plan" (475,000 VND/tháng)
4. Click "Nâng cấp ngay"
5. Redirect to VNPay sandbox
6. Use test card:

   ```
   Ngân hàng: NCB
   Số thẻ: 9704198526191432198
   Tên: NGUYEN VAN A
   Ngày phát hành: 07/15
   OTP: 123456
   ```

7. Complete payment
8. Return to app → See payment success

### 3. Test IPN Webhook

**Option A: Production (Requires public URL)**

- Deploy to production
- VNPay will POST to: <https://yourdomain.com/api/vnpay/ipn>

**Option B: Local Testing with ngrok**

```bash
# Install ngrok
winget install ngrok

# Tunnel port 3001
ngrok http 3001

# Copy URL (e.g., https://abc123.ngrok.io)
# Update VNPay merchant portal:
IPN URL: https://abc123.ngrok.io/api/vnpay/ipn
```

### 4. Test Without VNPay Account (Mock Test)

**Direct API Call:**

```powershell
# Test create payment URL
$body = @{
  planId = "pro"
  userId = "your-user-id"
  billingCycle = "monthly"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/vnpay/create-payment-url" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Response:
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..."
}
```

**Test Return URL (Simulated):**

```powershell
# Simulate successful payment return
$params = "vnp_Amount=47500000&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_TransactionNo=14398770&vnp_TxnRef=VNPAY-TEST-123456&vnp_SecureHash=dummy"

Invoke-RestMethod -Uri "http://localhost:3001/api/vnpay/return?$params"
```

### 5. Check Payment Records

**Database Query:**

```sql
-- Check payment_history
SELECT * FROM payment_history 
WHERE payment_method = 'vnpay' 
ORDER BY created_at DESC LIMIT 10;

-- Check subscriptions
SELECT * FROM user_subscriptions 
WHERE status = 'active' 
ORDER BY updated_at DESC LIMIT 10;
```

**API Endpoint:**

```bash
# Add this endpoint to vnpay.js for testing:
GET /api/vnpay/transactions/:userId
```

---

## Expected Results

### ✅ Success Flow

```
1. User clicks "Nâng cấp ngay"
2. POST /api/vnpay/create-payment-url
   → Returns VNPay payment URL
3. Redirect to VNPay
4. User completes payment
5. VNPay redirects back:
   GET /api/vnpay/return?vnp_ResponseCode=00&...
6. Backend verifies signature
7. Updates database:
   - payment_history: status = 'succeeded'
   - user_subscriptions: status = 'active'
8. Sends email
9. Redirect to /payment-success

VNPay also POSTs to:
   POST /api/vnpay/ipn
   → Backup notification
```

### ❌ Failure Flow

```
1. Payment fails at VNPay
2. VNPay redirects back:
   GET /api/vnpay/return?vnp_ResponseCode=24&...
3. Backend marks payment as 'failed'
4. Sends failure email
5. Redirect to /pricing?error=payment_failed
```

---

## Debugging

### Check Logs

```bash
# API logs
tail -f api/logs/vnpay.log

# Console logs (browser)
F12 → Console → Look for VNPay errors
```

### Common Issues

**Issue: "Invalid signature"**

```
Fix: Check VNPAY_HASH_SECRET matches VNPay dashboard
```

**Issue: "Return URL not working"**

```
Fix: Check VITE_API_URL and VITE_APP_URL
Should be: http://localhost:8084 (development)
```

**Issue: "IPN not received"**

```
Fix: VNPay needs public URL (use ngrok for testing)
```

---

## Next Steps

1. ✅ Servers running
2. ⏳ Register VNPay sandbox account
3. ⏳ Update credentials
4. ⏳ Test full flow
5. ⏳ Deploy to production
6. ⏳ Register real VNPay merchant account

---

## Production Checklist

- [ ] Register VNPay business account
- [ ] Get production TMN_CODE and HASH_SECRET
- [ ] Update .env with production credentials
- [ ] Change VNPAY_URL to production endpoint
- [ ] Setup IPN webhook with public URL
- [ ] Test with small real payment
- [ ] Monitor first 10 transactions
- [ ] Setup automated email notifications
- [ ] Add transaction dashboard

🚀 **READY TO TEST VNPAY!**
