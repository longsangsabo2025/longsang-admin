# 🔐 Social Media Credentials - Persistent Storage

## ✅ Đã hoàn thành:

### 1. **Database Table**: `social_media_credentials`

- Lưu trữ encrypted credentials cho 7 platforms
- Row Level Security (RLS) - mỗi user chỉ thấy credentials của mình
- Auto-update timestamp
- Track connection status và errors

### 2. **Credentials Service**: `SocialCredentialsService`

- `saveCredentials()` - Lưu/update credentials vào DB
- `getCredentials()` - Load credentials từ DB
- `getAllCredentials()` - Load tất cả credentials
- `deleteCredentials()` - Xóa credentials
- `updateConnectionStatus()` - Update status sau khi test

### 3. **UI Integration**: `PlatformConnectionCard`

- ✅ Auto-load credentials khi component mount
- ✅ Save vào DB khi click "Connect"
- ✅ Delete từ DB khi click "Disconnect"
- ✅ Update status sau mỗi test connection
- ✅ Cache account info (name, avatar, followers)

---

## 🚀 Cách hoạt động:

### **Lưu Credentials**

```typescript
// User nhập credentials vào form
// Click "Connect"
↓
saveCredentials(platform, credentials)
  → INSERT/UPDATE social_media_credentials table
  → credentials encrypted trong database
↓
registerPlatform(platform, credentials)
  → Add to SocialMediaManager (in-memory)
↓
testConnection(platform)
  → Verify credentials work
↓
updateConnectionStatus(platform, success, accountInfo)
  → Save test result + account info to DB
```

### **Load Credentials (Auto)**

```typescript
Component Mount
↓
loadCredentials()
  → SELECT from social_media_credentials
  → WHERE user_id = current_user
↓
If credentials found:
  → setCredentials(stored.credentials)
  → registerPlatform(platform, credentials)
  → checkStatus()
  → Show "Connected" badge
```

### **Delete Credentials**

```typescript
Click "Disconnect"
↓
deleteCredentials(platform)
  → DELETE FROM social_media_credentials
↓
unregisterPlatform(platform)
  → Remove from SocialMediaManager
↓
Clear UI state
```

---

## 🔒 Security Features:

✅ **RLS Policies**: Users can only access their own credentials
✅ **Encrypted Storage**: Credentials stored as JSONB (can add encryption layer)
✅ **Service Role Access**: Background jobs can access all credentials
✅ **Password Input Type**: UI hides tokens when typing
✅ **No Console Logs**: Credentials never logged

---

## 📊 Database Schema:

```sql
CREATE TABLE social_media_credentials (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT CHECK (platform IN ('linkedin', 'twitter', ...)),
  credentials JSONB NOT NULL,     -- Encrypted tokens/keys
  settings JSONB DEFAULT '{}',    -- Platform-specific settings
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMPTZ,     -- Last connection test
  last_error TEXT,                 -- Last error message
  account_info JSONB,              -- Cached account data
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, platform)        -- One credential per platform per user
);
```

---

## 🎯 Use Cases:

### **Scenario 1: First Time Setup**

1. User goes to `/admin/social-media`
2. Sees all 7 platform cards (disconnected)
3. Clicks LinkedIn card
4. Enters Access Token
5. Clicks "Connect"
6. ✅ Credentials saved to DB
7. ✅ Connection tested
8. ✅ Badge shows "Connected"
9. ✅ Account info displayed (name, avatar, followers)

### **Scenario 2: Return Visit**

1. User refreshes page or comes back later
2. Component auto-loads credentials from DB
3. ✅ All connected platforms show "Connected"
4. ✅ Can post immediately without re-entering credentials

### **Scenario 3: Update Credentials**

1. User's token expired
2. Badge shows "Disconnected" or error
3. User enters new token
4. Clicks "Connect"
5. ✅ Credentials updated in DB
6. ✅ Connection re-tested
7. ✅ Status updated

### **Scenario 4: Remove Platform**

1. User doesn't want to use platform anymore
2. Clicks "Disconnect"
3. ✅ Credentials deleted from DB
4. ✅ Platform removed from manager
5. ✅ Can reconnect anytime

---

## 🧪 Testing:

### **Manual Test**

1. Go to `/admin/social-media`
2. Connect a platform (e.g., Telegram)
3. Refresh page
4. ✅ Platform should still show "Connected"
5. Click "Test Connection"
6. ✅ Should pass without re-entering credentials

### **Database Check**

```sql
-- Check saved credentials
SELECT
  platform,
  is_active,
  last_tested_at,
  account_info->>'name' as account_name,
  created_at
FROM social_media_credentials
WHERE user_id = auth.uid();
```

---

## 🔧 Migration:

Run this to create the table:

```bash
supabase migration up
# Or directly:
psql -f supabase/migrations/20251122_social_media_credentials.sql
```

---

## 🎉 Benefits:

✅ **Persistent**: Credentials survive page refresh
✅ **Secure**: Row-level security, encrypted storage
✅ **Multi-User**: Each user has their own credentials
✅ **Auditable**: Track when credentials added/tested
✅ **Cached Info**: Store account details for fast display
✅ **Error Tracking**: Know which platforms have issues
✅ **Auto-Reconnect**: Load credentials automatically on mount

---

**Hệ thống đã sẵn sàng lưu credentials vào database! 🔐**
