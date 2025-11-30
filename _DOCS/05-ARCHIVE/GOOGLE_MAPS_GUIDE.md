# 🗺️ Google Maps & Local SEO Integration Guide

## 📋 Tổng Quan

Hệ thống tích hợp **Google Maps API** và **My Business API** để tạo/quản lý địa chỉ business và tối ưu local SEO.

### ✅ CÁC CHỨC NĂNG CHÍNH

#### 1. 📍 **Google My Business Management**

- ✅ Tạo business location trên Google Maps
- ✅ Update thông tin business (địa chỉ, phone, giờ mở cửa)
- ✅ Quản lý multiple locations
- ✅ Add photos & descriptions
- **→ BUSINESS XUẤT HIỆN TRÊN GOOGLE MAPS THẬT**

#### 2. 🔍 **Geocoding & Places API**

- ✅ Convert địa chỉ → GPS coordinates (lat/lng)
- ✅ Reverse geocoding (coordinates → địa chỉ)
- ✅ Search nearby places
- ✅ Get place details
- **→ TÌM VÀ XÁC ĐỊNH CHÍNH XÁC VỊ TRÍ**

#### 3. 🎯 **Local SEO Optimization**

- ✅ Optimize business listings
- ✅ Complete NAP (Name, Address, Phone) info
- ✅ Add categories & keywords
- ✅ Geo-tagging for local search
- **→ TĂNG RANKING TRONG LOCAL SEARCH**

#### 4. 📊 **Geolocation Services**

- ✅ Calculate distance between locations
- ✅ Get directions (driving, walking, transit)
- ✅ Store locator functionality
- ✅ Route optimization
- **→ TÍNH TOÁN KHOẢNG CÁCH & CHỈ ĐƯỜNG**

---

## 🎯 CÁCH SỬ DỤNG

### 1. Setup Google Maps API Key

\`\`\`.env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
\`\`\`

### 2. Geocode Address

\`\`\`typescript
import { geocodeAddress } from '@/lib/google/maps-api';

// Convert địa chỉ → tọa độ
const result = await geocodeAddress('123 Nguyễn Huệ, Quận 1, TP.HCM');

console.log(result);
// {
//   latitude: 10.7754,
//   longitude: 106.7009,
//   formattedAddress: '123 Đ. Nguyễn Huệ, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
//   placeId: 'ChIJXXXXXXXXXXX'
// }
\`\`\`

### 3. Create Business Location

\`\`\`typescript
import { createBusinessLocation } from '@/lib/google/maps-api';

const location = {
  name: 'Long Sang Automation',
  storefrontAddress: {
    regionCode: 'VN',
    languageCode: 'vi',
    postalCode: '700000',
    locality: 'Ho Chi Minh',
    addressLines: ['123 Nguyễn Huệ, Quận 1'],
  },
  websiteUri: '<https://longsang.com>',
  phoneNumbers: {
    primaryPhone: '+84 xxx xxx xxx',
  },
  latlng: {
    latitude: 10.7754,
    longitude: 106.7009,
  },
  categories: {
    primaryCategory: {
      displayName: 'Business Consulting',
      categoryId: 'gcid:business_consulting',
    },
  },
};

const result = await createBusinessLocation(
  '<business@longsang.com>',
  'accounts/YOUR_ACCOUNT_ID',
  location
);

// → Business xuất hiện trên Google Maps!
\`\`\`

### 4. Optimize for Local SEO

\`\`\`typescript
import { optimizeLocationForSEO } from '@/lib/google/maps-api';

const seoData = {
  businessName: 'Long Sang Automation',
  address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
  phone: '+84 xxx xxx xxx',
  website: '<https://longsang.com>',
  categories: ['Business Consulting', 'Automation Services'],
  description: 'Leading automation and consulting services in Vietnam',
};

await optimizeLocationForSEO(
  '<business@longsang.com>',
  'locations/YOUR_LOCATION_ID',
  seoData
);

// → Location được tối ưu cho local search
\`\`\`

### 5. Auto-sync Consultation Locations

\`\`\`typescript
import { autoSyncConsultationLocations } from '@/lib/google/maps-api';

// Tự động tạo map markers cho consultation addresses
const result = await autoSyncConsultationLocations(
  '<business@longsang.com>',
  'accounts/YOUR_ACCOUNT_ID'
);

console.log(`Synced ${result.synced} consultation locations to Maps`);
\`\`\`

### 6. Calculate Distance

\`\`\`typescript
import { calculateDistance } from '@/lib/google/maps-api';

const distance = await calculateDistance(
  '123 Nguyễn Huệ, Q1, TP.HCM',
  '456 Lê Lợi, Q1, TP.HCM'
);

console.log(distance);
// { distance: '2.5 km', duration: '8 mins' }
\`\`\`

### 7. Get Directions

\`\`\`typescript
import { getDirections } from '@/lib/google/maps-api';

const route = await getDirections(
  '123 Nguyễn Huệ, Q1, TP.HCM',
  '456 Lê Lợi, Q1, TP.HCM',
  'driving'
);

// Returns detailed route with steps
console.log(route.legs[0].steps);
\`\`\`

### 8. Search Nearby Places

\`\`\`typescript
import { searchNearbyPlaces } from '@/lib/google/maps-api';

// Tìm coffee shops trong bán kính 1km
const places = await searchNearbyPlaces(
  10.7754, // latitude
  106.7009, // longitude
  1000, // radius in meters
  'cafe'
);

console.log(places);
// Array of nearby cafes with details
\`\`\`

---

## 📊 GOOGLE MY BUSINESS API

### Setup Required

1. **Enable APIs in Google Cloud Console:**
   - Google Maps JavaScript API
   - Google Maps Geocoding API
   - Google Places API
   - Google My Business API
   - Distance Matrix API
   - Directions API

2. **Setup Service Account:**

   ```json
   {
     "type": "service_account",
     "project_id": "your-project",
     "private_key_id": "xxx",
     "private_key": "-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n",
     "client_email": "your-service-account@project.iam.gserviceaccount.com",
     "client_id": "xxx",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token"
   }
   ```

3. **Enable Domain-wide Delegation:**
   - Go to Google Workspace Admin Console
   - Security → API Controls → Domain-wide Delegation
   - Add Service Account với scopes:
     - `https://www.googleapis.com/auth/business.manage`

4. **Get Google My Business Account ID:**

   ```bash
   # List accounts
   curl -X GET \
     'https://mybusinessbusinessinformation.googleapis.com/v1/accounts' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
   ```

---

## 🗺️ MAP EMBEDDING

### Embed Google Map in UI

\`\`\`tsx
import { useState, useEffect } from 'react';

export const MapEmbed = ({ address }: { address: string }) => {
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    // Geocode address
    geocodeAddress(address).then(result => {
      setCoordinates({
        lat: result.latitude,
        lng: result.longitude,
      });
    });
  }, [address]);

  if (!coordinates) return <div>Loading map...</div>;

  const mapUrl = \`<https://www.google.com/maps/embed/v1/place?key=\${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=\${coordinates.lat},\${coordinates.lng}\`>;

  return (
    <iframe
      width="100%"
      height="400"
      frameBorder="0"
      src={mapUrl}
      allowFullScreen
    />
  );
};
\`\`\`

---

## 🎯 LOCAL SEO BEST PRACTICES

### 1. Complete NAP Information

- **Name:** Business name chính xác
- **Address:** Địa chỉ đầy đủ, chuẩn format
- **Phone:** Số điện thoại local

### 2. Optimize Business Categories

```typescript
const categories = {
  primaryCategory: {
    displayName: 'Business Consulting', // Main category
    categoryId: 'gcid:business_consulting',
  },
  additionalCategories: [
    { displayName: 'Marketing Agency', categoryId: 'gcid:marketing_agency' },
    { displayName: 'Software Company', categoryId: 'gcid:software_company' },
  ],
};
```

### 3. Add Business Hours

```typescript
const regularHours = {
  periods: [
    {
      openDay: 'MONDAY',
      openTime: '09:00',
      closeDay: 'MONDAY',
      closeTime: '18:00',
    },
    // ... other days
  ],
};
```

### 4. Add Photos & Media

- Logo
- Cover photo
- Interior/exterior photos
- Team photos
- Product photos

### 5. Encourage Reviews

- Request reviews from customers
- Respond to all reviews
- Maintain 4+ star rating

---

## 🔥 USE CASES THỰC TẾ

### Case 1: Restaurant Chain với Multiple Locations

\`\`\`typescript
const locations = [
  { name: 'Branch 1', address: 'Q1, TP.HCM' },
  { name: 'Branch 2', address: 'Q3, TP.HCM' },
  { name: 'Branch 3', address: 'Q7, TP.HCM' },
];

for (const loc of locations) {
  const geocoding = await geocodeAddress(loc.address);
  
  await createBusinessLocation(businessEmail, accountId, {
    name: \`Restaurant - \${loc.name}\`,
    storefrontAddress: { addressLines: [loc.address] },
    latlng: {
      latitude: geocoding.latitude,
      longitude: geocoding.longitude,
    },
  });
}

// → Tất cả chi nhánh xuất hiện trên Google Maps
\`\`\`

### Case 2: Store Locator Feature

\`\`\`typescript
// User nhập địa chỉ của họ
const userAddress = '789 Lê Văn Việt, Q9, TP.HCM';

// Geocode user address
const userLocation = await geocodeAddress(userAddress);

// Find nearest store
const nearbyStores = await searchNearbyPlaces(
  userLocation.latitude,
  userLocation.longitude,
  5000, // 5km radius
  'store'
);

// Calculate distance to each store
for (const store of nearbyStores) {
  const distance = await calculateDistance(
    userAddress,
    store.formatted_address
  );
  store.distance = distance.distance;
}

// Sort by distance
nearbyStores.sort((a, b) =>
  parseFloat(a.distance) - parseFloat(b.distance)
);

// → User thấy stores gần nhất với thông tin khoảng cách
\`\`\`

### Case 3: Consultation Location Management

\`\`\`typescript
// Khi user đặt consultation với địa chỉ
const consultation = {
  client_name: 'Nguyễn Văn A',
  client_address: '123 Phạm Văn Đồng, Thủ Đức, TP.HCM',
};

// Auto-create map marker
const geocoding = await geocodeAddress(consultation.client_address);

await createBusinessLocation(businessEmail, accountId, {
  name: \`Consultation: \${consultation.client_name}\`,
  latlng: {
    latitude: geocoding.latitude,
    longitude: geocoding.longitude,
  },
  labels: ['consultation'],
});

// → Địa chỉ consultation xuất hiện trên map cho team tracking
\`\`\`

---

## 📈 TRACKING & ANALYTICS

### Google My Business Insights

\`\`\`typescript
// Coming soon: Track views, searches, actions on your business listing
// - How many people viewed your business
// - Search queries that found you
// - Direction requests
// - Phone calls
// - Website clicks
\`\`\`

---

## 🎉 KẾT LUẬN

Google Maps Integration mang lại:

✅ **Local SEO**: Business xuất hiện trên Google Maps → Tăng local traffic
✅ **Visibility**: Customers tìm thấy bạn dễ dàng hơn
✅ **Trust**: Google Maps listing tăng credibility
✅ **Convenience**: Direction requests, phone calls ngay từ Maps
✅ **Analytics**: Track how customers find & interact với business

**→ TÁC ĐỘNG TRỰC TIẾP: BUSINESS CỦA BẠN XUẤT HIỆN TRÊN GOOGLE MAPS CHO HÀNG TRIỆU NGƯỜI THẤY!** 🗺️
