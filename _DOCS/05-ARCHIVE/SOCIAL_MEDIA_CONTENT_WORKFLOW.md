# 🚀 Social Media Content Workflow - Complete Guide

## 📋 Tổng Quan

Hệ thống tích hợp hoàn chỉnh từ **n8n workflow** → **Content Queue** → **Social Media Publishing** với 2 chế độ:

- **Manual Mode**: Review và chỉnh sửa trước khi đăng (có preview)
- **Auto-Publish Mode**: Tự động đăng không cần review (không preview)

---

## 🔄 Luồng Hoạt Động

```
┌─────────────┐
│ N8N Workflow│ (AI tạo nội dung)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Content Queue   │ (status: pending)
│ - title         │
│ - content.body  │
│ - metadata      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Admin Review    │
│ - View content  │
│ - Edit text     │
│ - Approve/Reject│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Social Publish  │ (Chọn nền tảng)
│ ✓ LinkedIn      │
│ ✓ Twitter/X     │
│ ✓ Facebook      │
│ ✓ Instagram     │
│ ✓ YouTube       │
│ ✓ Telegram      │
│ ✓ Discord       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Multi-Platform  │
│ Publishing      │
│ (Parallel posts)│
└─────────────────┘
```

---

## 🎯 Các Bước Sử Dụng

### **Bước 1: N8N Workflow Tạo Nội Dung**

N8N workflow (ví dụ: AI Content Writer) tạo nội dung và lưu vào `content_queue`:

```sql
INSERT INTO content_queue (
  title,
  content,
  content_type,
  status,
  metadata
) VALUES (
  'Your Blog Title',
  '{"body": "Full blog content here...", "seo": {...}}',
  'blog_post',
  'pending',
  '{"tags": ["ai", "automation"], "source": "n8n_workflow"}'
);
```

### **Bước 2: Review Nội Dung**

Truy cập: **`/admin/content-queue`**

1. Xem danh sách content đang pending
2. Click vào content để xem chi tiết
3. Review modal hiển thị:
   - ✅ Title
   - ✅ Full content body
   - ✅ SEO metadata
   - ✅ Created date
   - ✅ Agent info

### **Bước 3: Chỉnh Sửa (Nếu Cần)**

Trong review modal:

1. Click nút **"Edit"**
2. Chỉnh sửa content trực tiếp
3. Click **"Save Changes"**

### **Bước 4: Duyệt Hoặc Từ Chối**

**Option A: Approve**

- Click **"Approve & Publish"**
- Status → `approved`

**Option B: Reject**

- Click **"Reject"**
- Status → `rejected`
- Nội dung sẽ không được publish

### **Bước 5: Publish Lên Social Media**

Sau khi approve (hoặc trong khi review):

1. Click **"Share to Social Media"**
2. Modal mới mở ra với:

   - ✅ Content preview
   - ✅ Platform selection (checkboxes)
   - ✅ Post text (auto-generated từ content, có thể edit)
   - ✅ Hashtags (auto-parsed từ metadata)
   - ✅ Link URL
   - ✅ Image URL

3. Customize post:

   ```
   Post Text: [280 chars from blog content]
   Hashtags: #ai #automation #marketing
   Link: https://yoursite.com/blog/post-slug
   Image: https://yoursite.com/images/featured.jpg
   ```

4. Chọn platforms (có thể chọn nhiều):

   - ☑️ LinkedIn (3000 chars)
   - ☑️ Twitter (280 chars)
   - ☑️ Facebook (63206 chars)
   - ☑️ Instagram (2200 chars - cần image)
   - ☑️ Telegram (4096 chars)
   - ☑️ Discord (2000 chars)

5. Click **"Publish to X Platforms"**

### **Bước 6: Xem Kết Quả**

Sau khi publish:

- ✅ Real-time results cho từng platform
- ✅ Success/Failed status
- ✅ Post URLs (nếu thành công)
- ✅ Summary: `X/Y platforms successful`

Metadata được lưu vào `content_queue`:

```json
{
  "social_posts": {
    "posted_at": "2025-11-22T10:30:00Z",
    "platforms": ["linkedin", "twitter", "facebook"],
    "results": [
      {
        "platform": "linkedin",
        "success": true,
        "postId": "12345",
        "postUrl": "https://linkedin.com/posts/..."
      }
    ],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0
    }
  }
}
```

---

## 🎨 UI Components

### 1. **ContentQueueList** (`/admin/content-queue`)

- Danh sách tất cả content
- Filter theo status: pending, approved, published, rejected
- Click để mở review modal

### 2. **ContentReviewModal**

- View và edit content
- Approve/Reject actions
- **NEW**: "Share to Social Media" button

### 3. **PublishToSocialModal** (NEW)

- Platform selection
- Post customization
- Character limit tracking
- Real-time publishing results

### 4. **SocialMediaManagement** (`/admin/social-media`)

- Manage platform connections
- Direct posting
- Post history

---

## 🔌 Platform Credentials

Trước khi publish, cần connect platforms tại `/admin/social-media`:

### LinkedIn

```
Access Token: [OAuth 2.0 token]
```

### Twitter/X

```
Bearer Token: [API v2 Bearer Token]
```

### Facebook

```
Page Access Token: [Token]
Page ID: [Your Page ID]
```

### Instagram

```
Access Token: [Token]
Business Account ID: [IG Business Account]
```

### YouTube

```
Access Token: [OAuth 2.0 token]
```

### Telegram

```
Bot Token: [Bot token from @BotFather]
Channel ID: [@your_channel or chat_id]
```

### Discord

```
Webhook URL: [Discord webhook URL]
```

---

## 📊 Database Schema

### `content_queue` table

```sql
CREATE TABLE content_queue (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES ai_agents(id),
  title TEXT,
  content JSONB, -- {body, seo: {title, description, tags}}
  content_type TEXT, -- 'blog_post', 'social_post', 'email'
  status TEXT, -- 'pending', 'approved', 'rejected', 'published'
  metadata JSONB, -- Custom data, includes social_posts after publish
  scheduled_for TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ Code Examples

### Trigger from N8N

```javascript
// N8N HTTP Request Node
const payload = {
  title: "AI-Generated Blog Post",
  content: {
    body: blogContent,
    seo: {
      title: "SEO Title",
      description: "Meta description",
      tags: ["ai", "automation"],
    },
  },
  content_type: "blog_post",
  status: "pending",
};

// POST to Supabase
await supabase.from("content_queue").insert(payload);
```

### Publish to Social from Code

```typescript
import { getSocialMediaManager } from "@/lib/social";

const manager = getSocialMediaManager();

const result = await manager.postToMultiplePlatforms({
  platforms: ["linkedin", "twitter", "facebook"],
  contentType: "text",
  text: "Your post content here",
  hashtags: ["ai", "automation"],
  linkUrl: "https://yoursite.com/blog",
});

console.log(`Posted to ${result.summary.successful} platforms`);
```

---

## 🎯 Use Cases

### 1. **AI Blog → Social Promotion**

- N8N tạo blog với OpenAI
- Admin review và edit
- Publish snippet lên social media với link về blog

### 2. **Scheduled Content Campaign**

- Pre-generate content in bulk
- Review và schedule
- Auto-publish theo lịch

### 3. **Multi-Platform Announcement**

- Tạo announcement content
- Customize cho từng platform
- Publish đồng loạt

### 4. **Content Repurposing**

- Blog content → Social snippets
- Long-form → Short-form
- Cross-platform distribution

---

## 🚨 Error Handling

### Publish Failures

- Each platform fails independently
- Failed platforms shown in results
- Successful posts still go through
- Can retry failed platforms

### Content Validation

- Character limits checked per platform
- Required fields validated
- Image URLs verified

### Connection Issues

- Platform credentials checked before posting
- Clear error messages if not connected
- Link to connection page

---

## 📈 Analytics & Tracking

### Content Queue Metrics

- Total pending content
- Approval rate
- Time to review

### Social Media Metrics (Future)

- Post success rate per platform
- Engagement tracking
- Best performing platforms

---

## 🎉 Benefits

✅ **Unified Workflow**: Từ AI generation đến social publishing
✅ **Quality Control**: Review và edit trước khi publish
✅ **Multi-Platform**: Post to 7 platforms cùng lúc
✅ **Flexible**: Customize per platform
✅ **Trackable**: Full audit trail in metadata
✅ **Efficient**: Parallel posting, save time

---

## 🔮 Future Enhancements

- [ ] Scheduled posting (cron jobs)
- [ ] Platform-specific customization (different text per platform)
- [ ] Image generation integration
- [ ] Analytics dashboard
- [ ] A/B testing for social posts
- [ ] Auto-retry failed posts
- [ ] Bulk operations
- [ ] Template library

---

## 🎯 Auto-Publish Mode (NEW!)

### **Setup Auto-Publish**

Truy cập: **`/admin/social-media`** → Tab **"Auto-Publish"**

1. **Enable Auto-Publish**: Bật switch "Enable Auto-Publish"

2. **Select Default Platforms**: Chọn platforms sẽ tự động đăng

   - ☑️ LinkedIn
   - ☑️ Twitter
   - ☑️ Facebook
   - ☑️ Instagram
   - ☑️ Telegram
   - ☑️ Discord

3. **Configure Options**:

   - ✅ Auto-approve content (mark as approved before posting)
   - ✅ Add hashtags (from metadata)
   - ✅ Include link (back to original content)

4. **Save Settings**

### **How Auto-Publish Works**

```mermaid
N8N Workflow
    ↓
Insert to content_queue (status: pending)
    ↓
Auto-Publish Trigger
    ↓
Check Settings (enabled?)
    ↓
Extract Content (text, hashtags, link, image)
    ↓
Post to Selected Platforms (parallel)
    ↓
Update content_queue
    - status: published
    - metadata.auto_published: true
    - metadata.social_posts: {results}
```

### **Key Differences**

| Feature            | Manual Mode | Auto-Publish Mode |
| ------------------ | ----------- | ----------------- |
| Review             | ✅ Yes      | ❌ No             |
| Edit               | ✅ Yes      | ❌ No             |
| Approve/Reject     | ✅ Yes      | ✅ Auto-approve   |
| Platform Selection | ✅ Per-post | ⚙️ Pre-configured |
| Customization      | ✅ Full     | ⚙️ Settings-based |
| Speed              | 🐢 Manual   | ⚡ Instant        |

### **When to Use Each Mode**

**Manual Mode**:

- Important announcements
- Branded content
- Need customization per platform
- Quality control required

**Auto-Publish Mode**:

- High-volume content
- Automated campaigns
- Trusted AI workflows
- Time-sensitive posts

### **Safety Features**

✅ **Settings Required**: Must explicitly enable auto-publish
✅ **Platform Gating**: Only posts to pre-configured platforms
✅ **Error Handling**: Failed posts logged in metadata
✅ **Audit Trail**: Full tracking of auto-published content
✅ **Can Override**: Switch modes anytime

---

## 📚 Related Documentation

- [SOCIAL_MEDIA_FOUNDATION.md](./SOCIAL_MEDIA_FOUNDATION.md) - Platform integrations
- [AI_AGENT_MASTER_ARCHITECTURE.md](./AI_AGENT_MASTER_ARCHITECTURE.md) - N8N workflows
- [AUTOMATION_COMPLETE_GUIDE.md](./AUTOMATION_COMPLETE_GUIDE.md) - Overall automation

---

## 💡 Quick Start

1. **Setup platforms**: `/admin/social-media` → Connect accounts
2. **Create workflow**: N8N → Content Writer → Save to content_queue
3. **Review content**: `/admin/content-queue` → Click item
4. **Publish**: Click "Share to Social Media" → Select platforms → Publish
5. **Done!** Check results in modal

---

**Hệ thống đã sẵn sàng! 🚀**
