# 🔧 FIX 401 ERROR - WRONG SUPABASE KEY CACHED

## ❌ Problem

Browser is using OLD cached Supabase key:

- Cached Key IAT: 1730452959 (Oct 31, 2024)
- Current Key IAT: 1760392191 (Jan 13, 2026)

## ✅ Solution: Clear Cache & Hard Refresh

### **Method 1: Hard Refresh (FASTEST)**

1. Open: <http://localhost:8080/marketplace>
2. Press: **Ctrl + Shift + R** (Windows/Linux)
   Or: **Cmd + Shift + R** (Mac)
3. This forces browser to reload from server, not cache

### **Method 2: Clear Site Data**

1. Press **F12** to open DevTools
2. Go to **Application** tab
3. Click **Clear site data**
4. Refresh page: **Ctrl + R**

### **Method 3: Incognito/Private Window**

1. Open new **Incognito window** (Ctrl + Shift + N)
2. Navigate to: <http://localhost:8080/marketplace>
3. Test activation

### **Method 4: Clear Service Worker**

1. Press **F12** → **Application** tab
2. Click **Service Workers**
3. Click **Unregister** for localhost:8080
4. Hard refresh: **Ctrl + Shift + R**

## 🔍 Verify Fix

After clearing cache, check Console for:

```
client.ts:19 Key IAT: 1760392191 ✅ CORRECT
```

Then test agent activation!

## 🚀 Alternative: Restart Dev Server

If cache persists, stop and restart:

```powershell
# Stop all Node processes
Get-Process -Name node | Stop-Process -Force

# Restart dev server
npm run dev
```

Then open: <http://localhost:8080/marketplace>

## ✅ Expected Result

After clearing cache:

- ✅ Key IAT: 1760392191 (correct)
- ✅ No 401 errors
- ✅ Agent activation works
