# 🚀 Quick Start - Marketing Automation

## Cài đặt trong 5 phút

### 1. Install Docker

Download: https://www.docker.com/products/docker-desktop

### 2. Chạy Setup

```powershell
.\setup-marketing-automation.ps1
```

### 3. Cấu hình n8n

- Mở: http://localhost:5678
- Tạo account
- Thêm credentials: OpenAI, LinkedIn, Facebook

### 4. Import Workflow

- n8n → Workflows → Import from File
- File: `./n8n/workflows/social-media-campaign.json`

### 5. Test Campaign

```bash
npm run dev
```

→ http://localhost:8081/admin/marketing-automation

## 🎯 Tạo Campaign đầu tiên

1. Nhập content: "Excited to share our new AI automation platform! 🚀"
2. Chọn platforms: LinkedIn ✓ Facebook ✓ Twitter ✓
3. Click "Launch Campaign"

→ AI tự động post lên 3 nền tảng với nội dung đã optimize!

## 📊 Database Created

```sql
✅ marketing_campaigns
✅ campaign_posts
✅ email_campaigns
✅ marketing_leads
✅ workflow_executions
✅ social_media_accounts
✅ content_library
✅ automated_workflows
```

## 🔑 API Keys cần có

```env
OPENAI_API_KEY=sk-...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

## ⚡ Next Steps

1. **Email Campaigns**: Setup Mautic
2. **WhatsApp**: Add Business API
3. **Analytics**: Connect platforms
4. **Automation**: Create more workflows

## 🎬 Demo

POST /webhook/social-media-campaign

```json
{
  "content": "Check out our new product!",
  "platforms": ["linkedin", "facebook"],
  "imageUrl": "https://..."
}
```

→ AI optimize → Multi-platform post → Analytics tracked

## 🆘 Troubleshooting

**Docker not running?**

```powershell
# Restart Docker Desktop
```

**n8n credential error?**

```
n8n → Credentials → Add New
→ OAuth2 for LinkedIn/Facebook
```

**Database connection failed?**

```powershell
# Check .env.marketing file
# Verify Supabase credentials
```

## 📚 Full Documentation

→ See `MARKETING_AUTOMATION_README.md`

---

**Made by LongSang | Save $1800/month on marketing tools** 💰
