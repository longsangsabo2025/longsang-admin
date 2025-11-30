# 🔐 Development Authentication Guide

## Quick Start for Developers

### Option 1: Quick Login Button (Fastest! ⚡)

In development mode, you'll see a **"Quick Login as Admin (Dev)"** button with a purple gradient. Just click it and you're in!

- **Email**: `admin@test.com`
- **Password**: `admin123`

### Option 2: Manual Login with Password

1. Click "Sign in" button
2. Toggle to "Use password instead" (at the bottom)
3. Enter credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
4. Click "Sign in"

### Option 3: Magic Link (Production Method)

This is the default for production:

1. Enter your email
2. Click "Send magic link"
3. Check your email for the login link

---

## Setup Test Admin User

If the test admin user doesn't work, run this command:

```powershell
# Windows PowerShell
.\scripts\setup-test-admin.ps1
```

Or manually run the migration:

```bash
supabase db reset
```

---

## Features in Dev Mode

✅ **Password Authentication** - Fast login without email verification  
✅ **Quick Login Button** - One-click admin access  
✅ **Toggle Auth Methods** - Switch between password and magic link  
✅ **Auto-confirmed Email** - No need to verify email in dev  

---

## Production vs Development

| Feature | Development | Production |
|---------|------------|------------|
| Quick Login Button | ✅ Visible | ❌ Hidden |
| Password Auth | ✅ Default | ❌ Not available |
| Magic Link Auth | ✅ Available | ✅ Default |
| Email Verification | ❌ Skipped | ✅ Required |
| Test Admin Account | ✅ Available | ❌ Not created |

---

## Troubleshooting

### "Authentication failed" error

1. Make sure Supabase is running:

   ```bash
   supabase status
   ```

2. Reset the database:

   ```bash
   supabase db reset
   ```

3. Check if test user exists:

   ```sql
   SELECT email FROM auth.users WHERE email = 'admin@test.com';
   ```

### Quick Login button not showing

- Make sure you're in **development mode** (`npm run dev`)
- The button only appears when `import.meta.env.DEV === true`

### Password login not working

- Toggle to password mode using the link at the bottom of the login form
- If in production, password auth is disabled by default

---

## Security Notes

⚠️ **IMPORTANT**: The test admin account and quick login features are **ONLY for development**.

In production:

- Test admin account is not created
- Quick login button is hidden
- Password authentication is disabled (magic link only)
- All emails must be verified

---

## Creating Additional Test Users

You can create more test users by running SQL in Supabase Studio:

```sql
-- Insert a new test user
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
)
VALUES (
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name":"Test User"}'::jsonb
);
```

---

## Development Tips

💡 Use the Quick Login button for rapid testing  
💡 Create multiple test accounts for different roles  
💡 Toggle between auth methods to test both flows  
💡 Check browser console for detailed auth errors  

---

Made with ❤️ for faster development
