# 🧪 N8N Testing Guide - Hướng Dẫn Test N8N

## 📋 Checklist Test N8N cho Các Dự Án

### ✅ PHASE 1: Setup & Connection (10 phút)

#### 1.1 Khởi động n8n
- [ ] Double-click shortcut `N8N-Auto-Login` trên Desktop
- [ ] Truy cập http://localhost:5678
- [ ] Đăng nhập với: `admin / longsang2025`
- [ ] Verify dashboard hiển thị OK

#### 1.2 Test Webhook cơ bản
```bash
# Test webhook từ terminal
curl -X POST http://localhost:5678/webhook-test/test -H "Content-Type: application/json" -d '{"message":"Hello from test"}'
```

---

### 🎨 PHASE 2: Test với Từng Dự Án

#### 2.1 🤖 AI SECRETARY (EVA)
**Use Cases:**
- [ ] Tự động trả lời email
- [ ] Tóm tắt meeting notes
- [ ] Tạo task từ email
- [ ] Nhắc nhở lịch hẹn

**Test Workflow:**
1. Tạo workflow: "Email to Task"
2. Trigger: Webhook nhận email data
3. Action: Gọi OpenAI API để phân tích
4. Output: Tạo task trong database

**Sample Workflow JSON:**
```json
{
  "name": "EVA - Email to Task",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "webhookId": "eva-email"
    },
    {
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "operation": "message"
    },
    {
      "name": "Supabase",
      "type": "n8n-nodes-base.supabase",
      "operation": "insert"
    }
  ]
}
```

---

#### 2.2 🎓 AINEWBIE WEB
**Use Cases:**
- [ ] Tự động tạo nội dung khóa học
- [ ] Gửi email khi user đăng ký
- [ ] Theo dõi progress học viên
- [ ] Tạo certificate tự động

**Test Workflow:**
1. Workflow: "New Student Onboarding"
2. Trigger: Supabase webhook (new user)
3. Actions:
   - Gửi welcome email
   - Tạo learning path
   - Gán courses
   - Schedule follow-up

---

#### 2.3 💼 LONGSANG PORTFOLIO
**Use Cases:**
- [ ] Auto-reply contact form
- [ ] Track visitor analytics
- [ ] Backup portfolio data
- [ ] Generate monthly reports

**Test Workflow:**
1. Workflow: "Contact Form Handler"
2. Trigger: Webhook từ contact form
3. Actions:
   - Lưu vào Supabase
   - Gửi email notification cho bạn
   - Auto-reply cho khách
   - Add to CRM

---

#### 2.4 🏠 VUNGTAU DREAM HOMES
**Use Cases:**
- [ ] Lead qualification tự động
- [ ] Gửi property listings qua email
- [ ] Schedule viewing appointments
- [ ] Follow-up với potential buyers

**Test Workflow:**
1. Workflow: "Lead Capture & Qualification"
2. Trigger: Form submission
3. Actions:
   - Score lead bằng AI
   - Gửi property matches
   - Create calendar event
   - Notify sales team

---

#### 2.5 🎵 MUSIC VIDEO APP
**Use Cases:**
- [ ] Auto-publish video khi upload xong
- [ ] Generate thumbnails
- [ ] Moderate comments
- [ ] Send notifications to followers

**Test Workflow:**
1. Workflow: "Video Processing Pipeline"
2. Trigger: New video uploaded
3. Actions:
   - Generate thumbnail
   - AI moderation check
   - Publish to feed
   - Notify subscribers

---

#### 2.6 🎱 SABO ARENA
**Use Cases:**
- [ ] Tournament notifications
- [ ] Match result updates
- [ ] Payment processing
- [ ] Leaderboard updates

**Test Workflow:**
1. Workflow: "Match Result Handler"
2. Trigger: Match completed
3. Actions:
   - Update leaderboard
   - Calculate rewards
   - Send notifications
   - Update statistics

---

#### 2.7 📚 SABO HUB
**Use Cases:**
- [ ] Content recommendation
- [ ] Knowledge base sync
- [ ] Document versioning
- [ ] Search indexing

**Test Workflow:**
1. Workflow: "Content Sync & Index"
2. Trigger: Document updated
3. Actions:
   - Index in search
   - Generate embeddings
   - Update recommendations
   - Notify team

---

### ⚡ PHASE 3: Advanced Workflows (Multi-Project)

#### 3.1 Master Orchestrator
**Workflow phối hợp tất cả dự án:**
- [ ] Daily health check tất cả services
- [ ] Aggregate analytics từ 8 dự án
- [ ] Backup data across projects
- [ ] Generate master dashboard report

#### 3.2 Cross-Project Automations
- [ ] User từ AiNewbie → Lead cho Portfolio
- [ ] Success story từ Arena → Content cho Portfolio
- [ ] Music từ App → Background cho Videos

---

### 📊 PHASE 4: Monitoring & Analytics

#### 4.1 Setup Monitoring
- [ ] Error notifications
- [ ] Performance tracking
- [ ] Execution logs
- [ ] Success/failure rates

#### 4.2 Analytics Dashboard
- [ ] Total workflows executed
- [ ] Success rate per project
- [ ] Average execution time
- [ ] Cost tracking (API calls)

---

## 🚀 Quick Start Templates

### Template 1: Simple Webhook Test
```javascript
// n8n webhook handler
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "test",
        "responseMode": "responseNode",
        "responseData": "{ \"status\": \"success\", \"message\": \"Webhook received!\" }"
      }
    }
  ]
}
```

### Template 2: Supabase to Email
```javascript
{
  "nodes": [
    {
      "name": "Supabase Trigger",
      "type": "n8n-nodes-base.supabaseTrigger"
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend"
    }
  ]
}
```

### Template 3: AI Content Generator
```javascript
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger"
    },
    {
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi"
    },
    {
      "name": "Save to Database",
      "type": "n8n-nodes-base.supabase"
    }
  ]
}
```

---

## 🎯 Testing Priority

### Week 1: Foundation
- [x] Setup n8n
- [ ] Test basic webhooks
- [ ] Connect Supabase
- [ ] Setup error handling

### Week 2: Core Projects (3 dự án quan trọng nhất)
- [ ] AI Secretary - Email automation
- [ ] Portfolio - Contact form
- [ ] SABO Arena - Notifications

### Week 3: Remaining Projects
- [ ] AiNewbie Web
- [ ] Vungtau Homes
- [ ] Music Video App
- [ ] SABO Hub

### Week 4: Advanced
- [ ] Cross-project workflows
- [ ] Master orchestrator
- [ ] Analytics & reporting

---

## 📝 Notes & Best Practices

### Security
- ✅ N8N credentials đã được setup
- ⚠️ Không expose webhook URLs publicly
- ⚠️ Validate all incoming data
- ⚠️ Rate limit API calls

### Performance
- Monitor execution times
- Set appropriate timeouts
- Use queue for heavy tasks
- Cache frequently used data

### Debugging
- Enable detailed logging
- Test workflows manually first
- Use small data samples
- Check error webhooks

---

## 🆘 Troubleshooting

### Workflow không chạy
1. Check webhook URL
2. Verify credentials
3. Check logs
4. Test manually

### API errors
1. Check API keys
2. Verify rate limits
3. Check data format
4. Review error messages

### Performance issues
1. Reduce batch size
2. Add delays between calls
3. Use async operations
4. Monitor resource usage

---

## 📞 Support

- **n8n Docs:** https://docs.n8n.io
- **Community:** https://community.n8n.io
- **Your Webhook URL:** http://localhost:5678/webhook/

**Happy Automating! 🚀**
