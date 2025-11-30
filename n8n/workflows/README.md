# 📧 N8N Email Automation - Setup Guide

## 🎯 Overview

Complete email automation system using n8n workflows and professional email templates.

## 📂 Workflow Files

### 1. **email-marketing-automation.json**
**Generic email sender - supports all template types**

**Webhook:** `http://localhost:5678/webhook/email-marketing`

**Request Format:**
```json
{
  "template_type": "welcome-email",
  "to": "user@example.com",
  "subject": "Welcome!",
  "from": "admin@longsang.org",
  "variables": {
    "user_name": "John Doe",
    "company_name": "Long Sang"
  }
}
```

**Supported Templates:**
- `welcome-email` - User onboarding
- `order-confirmation` - E-commerce orders
- `password-reset` - Security
- `newsletter` - Marketing campaigns

---

### 2. **welcome-email-automation.json**
**Dedicated user registration flow**

**Webhook:** `http://localhost:5678/webhook/user-registration`

**Request Format:**
```json
{
  "name": "John Doe",
  "email": "user@example.com"
}
```

**Features:**
- Auto-generates activation token
- Sends welcome email
- Logs to Google Sheet
- Returns success response

---

## 🚀 Import Workflows to n8n

### Step 1: Open n8n
```powershell
# Start n8n (if not running)
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
.\START_N8N_CORS.bat
```

### Step 2: Import Workflows

1. Go to http://localhost:5678
2. Click **"+"** → **"Import from File"**
3. Import both workflows:
   - `workflows/email-marketing-automation.json`
   - `workflows/welcome-email-automation.json`

### Step 3: Configure Credentials

#### Gmail OAuth2 (Required)
1. Each workflow node **"Send via Gmail"**
2. Click credentials dropdown
3. Create new **Gmail OAuth2** credential
4. Follow Google OAuth flow
5. Save credential

#### Google Sheets (Already configured)
- Credential ID: `S9FM5C1u4OUgOU86`
- Should work automatically

### Step 4: Activate Workflows
1. Open each workflow
2. Toggle **Active** switch (top right)
3. Save

---

## 🧪 Testing

### Method 1: Python Test Script
```powershell
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\n8n

# Test all email types
python test-email-templates.py
```

### Method 2: Postman/Curl

**Welcome Email:**
```bash
curl -X POST http://localhost:5678/webhook/user-registration \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "longsangsabo@gmail.com"
  }'
```

**Order Confirmation:**
```bash
curl -X POST http://localhost:5678/webhook/email-marketing \
  -H "Content-Type: application/json" \
  -d '{
    "template_type": "order-confirmation",
    "to": "longsangsabo@gmail.com",
    "subject": "Đơn hàng #ORD-001",
    "variables": {
      "customer_name": "Nguyễn Văn A",
      "order_id": "ORD-001"
    }
  }'
```

### Method 3: Admin UI (Coming Soon)
- Email templates manager
- Visual workflow trigger
- Real-time preview

---

## 📊 Monitoring & Logs

### Google Sheet Logs
**Document:** https://docs.google.com/spreadsheets/d/1ZDrD-z7l4rnu5WCdEJ4tvg_oigeoaUHTjdbDGnEPMtk

**Sheets:**
- **Email Logs** - All sent emails
- **User Registrations** - New user signups

### n8n Execution History
1. Go to http://localhost:5678
2. Click **"Executions"** (left sidebar)
3. View detailed logs per workflow

---

## 🔧 Troubleshooting

### Error: "Template file not found"
```powershell
# Verify template exists
Test-Path "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\templates\emails\welcome-email.html"

# Should return: True
```

### Error: "Gmail authentication failed"
1. Re-authenticate Gmail OAuth2
2. Check Google App permissions
3. Enable "Less secure apps" (if using legacy)

### Error: "Google Sheet append failed"
1. Verify credential ID: `S9FM5C1u4OUgOU86`
2. Check sheet exists: "Email Logs", "User Registrations"
3. Re-authenticate if needed

### Webhook not triggering
1. Check n8n is running: http://localhost:5678
2. Verify workflow is **Active**
3. Check webhook path matches URL
4. Test with curl first

---

## 📋 Workflow Details

### Email Marketing Automation Flow
```
Webhook → Load Template → Send Gmail → Log to Sheet → Response
```

**Nodes:**
1. **Webhook Trigger** - Receives email request
2. **Load Email Template** - Reads HTML file, replaces variables
3. **Send via Gmail** - Sends email using OAuth2
4. **Log to Google Sheet** - Records in "Email Logs" tab
5. **Success Response** - Returns JSON response

---

### Welcome Email Flow
```
Webhook → Prepare Data → Load Template → Send Gmail → Save to Sheet → Response
```

**Nodes:**
1. **User Registration Webhook** - Receives user data
2. **Prepare User Data** - Generates activation token
3. **Load Welcome Template** - Processes welcome email
4. **Send Welcome Email** - Sends via Gmail
5. **Save to Google Sheet** - Logs in "User Registrations" tab
6. **Success Response** - Confirms registration

---

## 🎨 Customization

### Add New Template Type

1. **Create template file:**
```powershell
# Copy existing template
cp templates/emails/welcome-email.html templates/emails/my-custom-email.html
# Edit as needed
```

2. **Use in workflow:**
```json
{
  "template_type": "my-custom-email",
  "to": "user@example.com",
  "variables": {
    "custom_var": "value"
  }
}
```

### Modify Email Variables

Edit workflow node **"Load Email Template"**:
```javascript
const vars = {
  ...existingVars,
  new_variable: "new value"
};
```

### Change Google Sheet

Edit **"Log to Google Sheet"** node:
```json
{
  "documentId": "YOUR_SHEET_ID",
  "sheetName": "YOUR_TAB_NAME"
}
```

---

## 🔐 Security Best Practices

### Environment Variables
```env
# .env file (add these)
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Rate Limiting
Gmail limits:
- **Free:** 500 emails/day
- **Workspace:** 2000 emails/day

Add rate limiting in n8n:
1. Workflow Settings → **Rate Limit**
2. Set max executions per hour

### Email Validation
Add validation node before sending:
```javascript
// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test($json.to)) {
  throw new Error('Invalid email format');
}
```

---

## 📚 Related Documentation

- [Email Templates Guide](../templates/emails/README.md)
- [Cloudflare Email Setup](../docs/CLOUDFLARE_EMAIL_SETUP_GUIDE.md)
- [n8n Official Docs](https://docs.n8n.io/)

---

## ✅ Checklist

Setup Complete:
- [ ] n8n running on port 5678
- [ ] Both workflows imported
- [ ] Gmail OAuth2 configured
- [ ] Google Sheets credential verified
- [ ] Workflows activated
- [ ] Test emails sent successfully
- [ ] Logs appearing in Google Sheet

---

**Last Updated:** 2025-11-23  
**Maintained By:** Long Sang  
**Version:** 1.0  
**Status:** ✅ Production Ready
