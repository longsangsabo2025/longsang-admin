# 🔑 HƯỚNG DẪN LẤY GOOGLE MAPS API KEY

## ✅ KÍCH HOẠT GOOGLE MAPS API

### 1. Truy cập Google Cloud Console

```
https://console.cloud.google.com/
```

### 2. Chọn Project "long-sang-automation"

- Click vào dropdown project ở góc trên bên trái
- Chọn "long-sang-automation"

### 3. Enable các APIs cần thiết

Vào **APIs & Services → Library** và enable các APIs sau:

#### ✅ Maps JavaScript API

- Dùng cho: Embed maps trong UI
- Status: Enable nó

#### ✅ Geocoding API

- Dùng cho: Convert địa chỉ ↔️ tọa độ GPS
- Status: **CẦN ENABLE**

#### ✅ Places API (New)

- Dùng cho: Tìm kiếm nearby places, place details
- Status: **CẦN ENABLE**

#### ✅ Distance Matrix API

- Dùng cho: Tính khoảng cách & thời gian giữa các địa điểm
- Status: **CẦN ENABLE**

#### ✅ Directions API

- Dùng cho: Lấy route chỉ đường
- Status: **CẦN ENABLE**

#### ✅ Google My Business API

- Dùng cho: Tạo/quản lý business locations trên Google Maps
- Status: **CẦN ENABLE**

### 4. Tạo API Key

**Bước 1:** Vào **APIs & Services → Credentials**

**Bước 2:** Click **"+ CREATE CREDENTIALS"** → **"API Key"**

**Bước 3:** Copy API Key (format: `AIzaSy...`)

**Bước 4:** Click vào "Edit API Key" để restrict:

#### Option 1: Application restrictions (Recommended)

```
HTTP referrers (web sites)
```

Add:

- `http://localhost:*/*`
- `https://longsang.com/*`
- `https://*.longsang.com/*`

#### Option 2: API restrictions

Select these APIs:

- ✅ Geocoding API
- ✅ Places API (New)
- ✅ Distance Matrix API
- ✅ Directions API
- ✅ Maps JavaScript API
- ✅ My Business Business Information API

**Bước 5:** Save

### 5. Add vào .env file

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🔍 TEST API KEY

Run test script:

```bash
node test-google-apis.mjs
```

Expected results:

- ✅ Geocoding API: WORKING
- ✅ Places API: WORKING
- ✅ Distance Matrix API: WORKING
- ✅ Indexing API: WORKING (with 403 error is normal - needs domain verification)

---

## 📊 KIỂM TRA QUOTA & BILLING

### 1. Enable Billing

- Google Maps APIs require billing account
- Free tier: $200 credit/month
- Vào **Billing** → **Link billing account**

### 2. Check Quotas

```
APIs & Services → Enabled APIs → [Select API] → Quotas
```

**Free tier limits:**

- Geocoding API: 40,000 requests/month
- Places API: $200 credit (~28,500 requests)
- Distance Matrix API: 40,000 elements/month
- Directions API: 40,000 requests/month

### 3. Monitor Usage

```
APIs & Services → Dashboard
```

Check daily/monthly usage statistics

---

## ⚠️ IMPORTANT NOTES

### Security Best Practices

1. **Restrict API Key:**
   - Always add HTTP referrer restrictions
   - Only enable required APIs
   - Never commit API key to public repos

2. **Service Account vs API Key:**
   - **API Key:** For Maps, Geocoding, Places, Distance Matrix (frontend)
   - **Service Account:** For My Business, Indexing, Gmail, Calendar (backend)

3. **Billing Alerts:**
   - Set up budget alerts in Google Cloud
   - Monitor usage regularly
   - Set daily quotas if needed

---

## 🎯 NEXT STEPS

After getting Maps API Key:

1. ✅ Add to `.env` file
2. ✅ Run `node test-google-apis.mjs`
3. ✅ Verify all APIs work
4. ✅ Test in UI dashboard (`/admin/google-maps`)
5. ✅ Setup Google My Business account for location creation

---

## 🔗 USEFUL LINKS

- Google Cloud Console: <https://console.cloud.google.com/>
- Maps API Pricing: <https://mapsplatform.google.com/pricing/>
- API Key Best Practices: <https://cloud.google.com/docs/authentication/api-keys>
- Geocoding API Docs: <https://developers.google.com/maps/documentation/geocoding>
- Places API Docs: <https://developers.google.com/maps/documentation/places>
- My Business API: <https://developers.google.com/my-business>

---

## 🆘 TROUBLESHOOTING

### Error: "This API project is not authorized to use this API"

→ Enable the API in Google Cloud Console → APIs & Services → Library

### Error: "REQUEST_DENIED"

→ Check API key restrictions, make sure it's allowed for your domain

### Error: "OVER_QUERY_LIMIT"

→ Exceeded daily quota, wait 24h or enable billing

### Error: "Billing must be enabled"

→ Link billing account in Google Cloud Console
