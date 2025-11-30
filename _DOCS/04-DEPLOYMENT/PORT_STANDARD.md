# 🔧 Port Configuration Standard

## ⚠️ CHUẨN HÓA - KHÔNG ĐỔI! ⚠️

| Service | Port | URL |
|---------|------|-----|
| **Frontend (Vite)** | `8080` | http://localhost:8080 |
| **API Server (Express)** | `3001` | http://localhost:3001 |
| **OAuth Callback** | `3333` | http://localhost:3333/oauth2callback |

## 📁 Configuration Files

### Backend (.env)
```env
# SERVER PORTS (Chuẩn hóa - KHÔNG ĐỔI!)
VITE_PORT=8080
API_PORT=3001
VITE_API_URL=http://localhost:3001
OAUTH_CALLBACK_PORT=3333
```

### Backend (api/config.js)
```javascript
const config = require('./api/config');
console.log(config.API_PORT);        // 3001
console.log(config.VITE_PORT);       // 8080
console.log(config.API_URL);         // http://localhost:3001
```

### Frontend (src/config/api.ts)
```typescript
import { API_URL, API_ENDPOINTS } from '@/config/api';
// API_URL = 'http://localhost:3001/api'
```

## 🚀 Commands

```bash
# Start Frontend (port 8080)
npm run dev

# Start API Server (port 3001)
node api/server.js

# OAuth Authorization (port 3333)
node scripts/authorize-google-drive.cjs
```

## 📋 Google Cloud Console - Redirect URIs

Add these to your OAuth Client:
- `http://localhost:3333/oauth2callback`

## ❌ DON'T DO THIS

```javascript
// ❌ WRONG - Hardcoded port
fetch('http://localhost:3001/api/drive')

// ✅ CORRECT - Use config
import { API_ENDPOINTS } from '@/config/api';
fetch(API_ENDPOINTS.DRIVE.LIST())
```

---
Last updated: 2025-11-26
