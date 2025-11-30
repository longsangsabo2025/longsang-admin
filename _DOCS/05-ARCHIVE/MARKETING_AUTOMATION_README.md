# 🚀 LongSang Marketing Automation System

## Tổng quan

Hệ thống marketing tự động đa nền tảng được xây dựng với **n8n**, **Mautic**, và **AI** để giúp solo founders tự động hóa hoàn toàn quy trình marketing.

## ✨ Tính năng chính

### 📱 Multi-Platform Social Media

- ✅ Auto-posting đồng thời LinkedIn, Facebook, Twitter, Instagram
- ✅ AI tối ưu nội dung cho từng nền tảng
- ✅ Tự động đăng vào giờ vàng
- ✅ Theo dõi engagement real-time

### 📧 Email Marketing

- ✅ Drip campaigns tự động
- ✅ Segmentation thông minh
- ✅ A/B testing
- ✅ Personalization với AI

### 🤖 AI Content Engine

- ✅ Blog → Social posts
- ✅ Multi-language translation
- ✅ Image generation
- ✅ SEO optimization

### 📊 Unified Analytics

- ✅ Dashboard tổng hợp metrics từ tất cả nền tảng
- ✅ ROI tracking
- ✅ Predictive analytics
- ✅ Auto-reporting hàng tuần

## 🛠️ Tech Stack

- **n8n** (157k⭐): Workflow automation engine
- **Mautic**: Email marketing platform
- **Redis**: Queue & caching
- **PostgreSQL** (Supabase): Database
- **OpenAI/Claude**: AI content generation
- **React + TypeScript**: Frontend

## 📦 Cài đặt

### Yêu cầu

- Node.js 18+
- Docker Desktop
- Supabase account (đã có)
- API keys (OpenAI, LinkedIn, Facebook)

### Bước 1: Cài Docker

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install và khởi động Docker
3. Verify: `docker --version`

### Bước 2: Setup Marketing Automation

```powershell
# Chạy script setup (Windows)
.\setup-marketing-automation.ps1

# Hoặc (Node.js)
node setup-marketing-automation.mjs
```

Script sẽ tự động:

- ✅ Deploy database schema (8 tables)
- ✅ Start n8n, Mautic, Redis containers
- ✅ Generate encryption keys
- ✅ Import workflow templates

### Bước 3: Cấu hình n8n

1. Mở n8n: http://localhost:5678
2. Tạo account (lần đầu)
3. Thêm credentials:
   - OpenAI API Key
   - LinkedIn OAuth
   - Facebook OAuth
   - Email service (Resend/SendGrid)
   - Supabase PostgreSQL

### Bước 4: Import Workflows

Trong n8n:

1. Click "Workflows" → "Import from File"
2. Import các file từ `./n8n/workflows/`:
   - `social-media-campaign.json` - Manual webhook posting
   - `auto-social-campaign-scheduler.json` - **AUTO scheduler (recommended)**

#### 🔥 Auto Scheduler Workflow

Workflow này TỰ ĐỘNG:

- ✅ Chạy mỗi 15 phút
- ✅ Tìm campaigns có `status='scheduled'` và `scheduled_at <= NOW()`
- ✅ AI optimize nội dung cho từng platform
- ✅ Post tự động lên LinkedIn, Facebook, Twitter
- ✅ Lưu kết quả vào database
- ✅ Cập nhật campaign status → 'completed'

**Không cần webhook call, chỉ tạo campaign và đợi!**

### Bước 5: Chạy LongSang

```bash
npm run dev
```

Truy cập: http://localhost:8081/admin/marketing-automation

## 🎯 Sử dụng

### Tạo Social Media Campaign

1. Navigate to `/admin/marketing-automation`
2. Tab "Create Campaign"
3. Nhập nội dung
4. Chọn platforms (LinkedIn, Facebook, Twitter)
5. (Optional) Schedule time
6. Click "Launch Campaign" 🚀

→ AI sẽ tự động:

- Optimize nội dung cho từng platform
- Generate hashtags phù hợp
- Post vào giờ tối ưu
- Track metrics real-time

### Email Campaign (Coming Soon)

```typescript
await n8nService.createEmailCampaign({
  subject: "Welcome to LongSang!",
  content: "...",
  recipients: ["user@example.com"],
  scheduledTime: "2025-11-20T10:00:00Z",
});
```

### Content Repurposing (Coming Soon)

```typescript
await n8nService.repurposeContent({
  sourceType: "blog",
  sourceUrl: "https://yoursite.com/blog/post",
  targetFormats: ["social-post", "email", "carousel", "thread"],
});
```

## 📊 Database Schema

### Bảng chính

- `marketing_campaigns` - Lưu campaigns
- `campaign_posts` - Individual posts
- `email_campaigns` - Email campaigns
- `marketing_leads` - Lead database
- `workflow_executions` - n8n execution logs
- `social_media_accounts` - Connected accounts
- `content_library` - Reusable content
- `automated_workflows` - Workflow configs

## 🔧 API Keys cần có

### Social Media

```env
# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Twitter
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
```

### Email

```env
RESEND_API_KEY=your_resend_key
# hoặc
SENDGRID_API_KEY=your_sendgrid_key
```

### AI

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### WhatsApp (Optional)

```env
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_ACCESS_TOKEN=your_token
```

## 🎨 Workflows Templates

### 1. Multi-Platform Social Campaign

**File**: `n8n/workflows/social-media-campaign.json`

**Flow**:

1. Webhook trigger từ LongSang
2. AI optimize content cho mỗi platform
3. Check platforms (LinkedIn, Facebook, Twitter)
4. Post to each platform
5. Save results to Supabase
6. Send response

### 2. Email Welcome Series (Coming)

**Flow**:

1. Trigger: New lead
2. Wait 1 day → Welcome email
3. Wait 3 days → Value email
4. Wait 7 days → Offer email
5. Track engagement
6. Score lead

### 3. Content Repurposing (Coming)

**Flow**:

1. Trigger: New blog post
2. AI extract key points
3. Generate LinkedIn carousel
4. Create Twitter thread
5. Write email newsletter
6. Schedule posts

## 📈 Metrics & Analytics

Dashboard hiển thị:

- 📊 Active campaigns
- 👥 Total reach
- 📈 Engagement rate
- ⏰ Scheduled posts
- 💰 ROI tracking

## 🐛 Troubleshooting

### n8n không start

```powershell
# Check Docker logs
docker compose -f docker-compose.marketing.yml logs n8n

# Restart services
docker compose -f docker-compose.marketing.yml restart
```

### Database connection error

- Kiểm tra connection string trong `.env.marketing`
- Verify Supabase credentials
- Check network connectivity

### Workflow execution failed

1. Mở n8n: http://localhost:5678
2. Click "Executions" tab
3. View error details
4. Check credentials
5. Re-run workflow

## 🎬 Demo Video

(Thêm link video demo sau)

## 📚 Tài liệu tham khảo

- [n8n Documentation](https://docs.n8n.io/)
- [Mautic Documentation](https://docs.mautic.org/)
- [Supabase Documentation](https://supabase.com/docs)

## 💰 Chi phí

| Service              | Cost              | Note                    |
| -------------------- | ----------------- | ----------------------- |
| n8n (self-hosted)    | $0                | Open-source             |
| Mautic (self-hosted) | $0                | Open-source             |
| Redis (Docker)       | $0                | Local                   |
| Supabase             | $0-25/month       | Free tier available     |
| OpenAI API           | ~$10-50/month     | Usage-based             |
| **Total**            | **~$10-75/month** | vs $350-1800/month SaaS |

## 🚀 Roadmap

### Phase 1 ✅ (Current)

- [x] n8n integration
- [x] Social media multi-platform
- [x] Database schema
- [x] Marketing Dashboard UI

### Phase 2 (Next 2 weeks)

- [ ] Email campaigns with Mautic
- [ ] Content repurposing workflow
- [ ] Lead nurturing automation
- [ ] WhatsApp integration

### Phase 3 (Next month)

- [ ] Analytics dashboard
- [ ] A/B testing system
- [ ] Engagement bot
- [ ] Advanced reporting

### Phase 4 (Future)

- [ ] SMS campaigns
- [ ] Voice messaging
- [ ] Video content automation
- [ ] Influencer outreach

## 🤝 Contributing

Contributions welcome! Đây là internal project nên có thể thoải mái customize.

## 📝 License

MIT License - Use freely for your business

## 👨‍💻 Support

- Discord: (Thêm link)
- Email: support@longsang.com
- GitHub Issues: (Thêm link)

---

**Made with ❤️ by LongSang Team for Solo Founders**

_"Automate your marketing, focus on your product"_
