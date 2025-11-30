# 🔥 Auto Marketing Workflow - Quick Start

## Giới thiệu

**Auto Social Campaign Scheduler** là workflow tự động HOÀN TOÀN - không cần trigger manual hay webhook call!

## 🎯 Cách hoạt động

```
┌─────────────────────────────────────────────────────────┐
│ 1. Schedule Trigger (Every 15 minutes)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Query Database: Find scheduled campaigns            │
│    WHERE status='scheduled' AND scheduled_at <= NOW()  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Update Status: 'scheduled' → 'running'              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. AI Optimize: Create platform-specific content       │
│    - LinkedIn: Professional tone                        │
│    - Facebook: Conversational                           │
│    - Twitter: Concise (<280 chars)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Multi-Post: Publish to all selected platforms       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Save Results: Update campaign_posts table           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Complete: Update status to 'completed'              │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Setup trong 3 bước

### Bước 1: Import Workflow vào n8n

1. Mở n8n: <http://localhost:5678>
2. Click "Add workflow" → "Import from file"
3. Chọn: `n8n/workflows/auto-social-campaign-scheduler.json`
4. Click "Import"

### Bước 2: Configure Credentials

Trong workflow, thêm các credentials:

#### OpenAI API

- Type: OpenAI
- API Key: `sk-...` (từ <https://platform.openai.com>)

#### Supabase PostgreSQL

- Host: `aws-1-us-east-2.pooler.supabase.com`
- Port: `6543`
- Database: `postgres`
- User: `postgres.diexsbzqwsbpilsymnfb`
- Password: `Acookingoil123`
- SSL: `prefer`

#### LinkedIn OAuth2 (Optional)

- Client ID: Từ LinkedIn Developer Portal
- Client Secret: Từ LinkedIn Developer Portal
- Scopes: `w_member_social`, `r_basicprofile`

#### Facebook Graph API (Optional)

- Access Token: Từ Facebook Developers
- Page ID: Your Facebook Page ID

### Bước 3: Activate Workflow

1. Toggle switch bật "Active"
2. Workflow sẽ tự động chạy mỗi 15 phút
3. ✅ Done! Không cần làm gì thêm

## 📝 Cách sử dụng

### Option 1: Qua Dashboard (Recommended)

1. Mở LongSang: `npm run dev`
2. Navigate: `/admin/marketing-automation`
3. Tạo campaign mới:
   - Title: "Product Launch Announcement"
   - Content: "We're launching our new AI automation platform! 🚀"
   - Platforms: Check LinkedIn, Facebook
   - Schedule: Chọn ngày/giờ muốn post
   - Click "Create Campaign"
4. ✅ Xong! Workflow sẽ tự động post vào đúng giờ

### Option 2: Direct Database Insert

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://diexsbzqwsbpilsymnfb.supabase.co", "your-anon-key");

// Create campaign
const { data } = await supabase
  .from("marketing_campaigns")
  .insert({
    user_id: "your-user-id",
    name: "Test Auto Post",
    type: "social_media",
    status: "scheduled",
    content: "🚀 Testing auto-posting!",
    platforms: ["linkedin", "facebook"],
    scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  })
  .select()
  .single();

// Create pending posts
for (const platform of data.platforms) {
  await supabase.from("campaign_posts").insert({
    campaign_id: data.id,
    platform,
    content: data.content,
    status: "pending",
  });
}
```

### Option 3: Quick Test Script

```bash
node test-auto-scheduler.mjs
```

Script này tạo campaign scheduled 1 phút sau.

## 🔍 Monitoring

### Check Campaign Status

```javascript
// Via Node.js
node -e "import('@supabase/supabase-js').then(async({createClient})=>{
  const s=createClient('https://diexsbzqwsbpilsymnfb.supabase.co','key');
  const c=await s.from('marketing_campaigns').select('*').eq('status','running');
  console.log('Running:',c.data.length);
})"
```

### n8n Execution Logs

1. Mở: <http://localhost:5678/executions>
2. Xem executions của workflow "Auto Social Campaign Scheduler"
3. Click vào execution để xem chi tiết

### Database Queries

```sql
-- Check scheduled campaigns
SELECT * FROM marketing_campaigns
WHERE status = 'scheduled'
AND scheduled_at <= NOW()
ORDER BY scheduled_at;

-- Check running campaigns
SELECT * FROM marketing_campaigns
WHERE status = 'running';

-- Check post results
SELECT c.name, cp.platform, cp.status, cp.posted_at
FROM marketing_campaigns c
JOIN campaign_posts cp ON cp.campaign_id = c.id
WHERE c.status = 'completed'
ORDER BY cp.posted_at DESC;
```

## ⚙️ Customization

### Thay đổi tần suất chạy

Trong n8n workflow, edit node "Every 15 Minutes":

- Mỗi 5 phút: `minutesInterval: 5`
- Mỗi 30 phút: `minutesInterval: 30`
- Mỗi giờ: `hoursInterval: 1`

### Thay đổi AI prompts

Edit node "AI Multi-Platform Optimizer":

```javascript
systemMessage: "Your custom prompt here...";
```

### Thêm platforms khác

1. Add condition node: "Is Instagram?"
2. Add post node: Instagram API
3. Connect to save node
4. Update SQL queries to include 'instagram'

## 🐛 Troubleshooting

### Workflow không chạy

```bash
# Check n8n logs
docker logs longsang-n8n

# Check if workflow is active
# In n8n UI: Workflows → Check "Active" toggle
```

### Campaign không được post

1. Check campaign status: `SELECT * FROM marketing_campaigns WHERE id='...'`
2. Check scheduled_at: Phải <= NOW()
3. Check n8n execution logs: <http://localhost:5678/executions>
4. Check credentials: LinkedIn, Facebook tokens còn valid không?

### AI optimization lỗi

1. Check OpenAI API key còn valid không
2. Check API quota/credits
3. Check n8n logs: `docker logs longsang-n8n`

## 💡 Best Practices

### Scheduling

- ✅ Schedule 1-2 giờ trước giờ post thực tế
- ✅ Post vào giờ vàng: 8-10am, 12-2pm, 5-7pm
- ✅ Tránh post vào cuối tuần/lễ

### Content

- ✅ Dùng emojis phù hợp
- ✅ Thêm call-to-action
- ✅ Tag người/công ty relevant
- ✅ Include links

### Testing

- ✅ Test với 1 platform trước
- ✅ Dùng test accounts
- ✅ Monitor executions
- ✅ Check analytics sau 24h

## 📊 Analytics

Sau khi campaigns chạy, xem metrics:

```sql
-- Top performing platforms
SELECT platform, AVG(engagement) as avg_engagement
FROM campaign_posts
WHERE status = 'posted'
GROUP BY platform
ORDER BY avg_engagement DESC;

-- Campaign success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM marketing_campaigns
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status;
```

## 🎉 Success!

Giờ bạn có marketing automation hoàn toàn tự động:

- ✅ Tạo campaign → Set schedule → Forget it!
- ✅ AI tự optimize content
- ✅ Multi-platform auto-posting
- ✅ Tự động tracking & reporting

**Zero manual work needed!** 🚀

---

**Next Steps:**

1. Import workflow vào n8n
2. Run `node test-auto-scheduler.mjs`
3. Wait 15 minutes
4. Check results!

**Questions?** Check logs hoặc xem MARKETING_AUTOMATION_README.md
