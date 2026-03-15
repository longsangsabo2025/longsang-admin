# HỆ THỐNG TỰ ĐỘNG HÓA A-Z: POPPY AI + HIGGSFIELD AI

> **Tài liệu Foundation #3**  
> **Dự án:** Kênh Lý Blạck  
> **Cập nhật:** Tháng 1, 2026  
> **Mục tiêu:** Tự động hóa toàn bộ quy trình sản xuất content

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô hình tự động hóa

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HỆ THỐNG TỰ ĐỘNG HÓA LÝ BLẠCK                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   POPPY AI   │───▶│ HIGGSFIELD   │───▶│   PUBLISH    │              │
│  │              │    │     AI       │    │              │              │
│  │ • Ý tưởng    │    │ • Tạo video  │    │ • TikTok     │              │
│  │ • Script     │    │ • Lipsync    │    │ • Reels      │              │
│  │ • Lên lịch   │    │ • Effects    │    │ • Shorts     │              │
│  │ • Repurpose  │    │ • Upscale    │    │ • Schedule   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         └───────────────────┴───────────────────┘                       │
│                             │                                           │
│                    ┌────────▼────────┐                                  │
│                    │   n8n / Zapier  │                                  │
│                    │   (Automation)  │                                  │
│                    └─────────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Vai trò của từng công cụ

| Công cụ | Vai trò chính | Giai đoạn |
|---------|---------------|-----------|
| **Poppy AI** | Não bộ - Lên ý tưởng, viết script, quản lý content | A → C |
| **Higgsfield AI** | Tay chân - Tạo video, effects, lipsync | D → F |
| **n8n/Zapier** | Dây thần kinh - Kết nối, tự động hóa workflow | Xuyên suốt |
| **Buffer/Later** | Xuất bản - Lên lịch đăng đa nền tảng | G → Z |

---

## 2. POPPY AI - TRUNG TÂM ĐIỀU KHIỂN

### 2.1 Poppy AI là gì?

**Website:** https://getpoppy.ai/

Poppy AI là một **Visual AI Workspace** kết hợp:
- **ChatGPT + Claude** trong một giao diện
- **Visual Canvas** - Bảng trắng vô hạn để tổ chức ý tưởng
- **Content Repurposing** - Biến 1 nội dung thành nhiều dạng
- **AI Assistants** - Tạo bot chuyên biệt cho từng nhiệm vụ
- **API Integration** - Kết nối với n8n, Zapier để tự động hóa

### 2.2 Tại sao cần Poppy AI cho dự án Lý Blạck?

| Vấn đề không có Poppy | Giải pháp với Poppy |
|----------------------|---------------------|
| Phải nghĩ ý tưởng thủ công | AI gợi ý 100+ ý tưởng từ trends |
| Viết script từng video | Batch generate scripts hàng loạt |
| Quên ý tưởng hay | Visual board lưu trữ mọi thứ |
| Không nhất quán tone | AI Assistant được train theo style Lý Blạck |
| Mất thời gian research | Phân tích video viral tự động |

### 2.3 Các tính năng chính sử dụng

#### 2.3.1 Visual Canvas (Bảng trắng AI)

**Mục đích:** Tổ chức toàn bộ ý tưởng và content của Lý Blạck

**Cách setup:**
```
BOARD: Lý Blạck Content Hub
├── 📁 Ý tưởng thô (Ideas Bank)
│   ├── Thơ chế mới
│   ├── Reactions ideas
│   └── Triết lý bựa
├── 📁 Scripts đã viết
│   ├── Tuần 1
│   ├── Tuần 2
│   └── ...
├── 📁 Trends đang hot
│   ├── TikTok trends
│   ├── Memes
│   └── News để react
├── 📁 Đã sản xuất
│   ├── Đã đăng
│   └── Chờ đăng
└── 📁 Analytics & Insights
    ├── Video perform tốt
    └── Lessons learned
```

#### 2.3.2 Custom AI Assistant - "Lý Blạck Bot"

**Mục đích:** Tạo AI assistant được train để viết đúng giọng Lý Blạck

**Prompt setup cho Lý Blạck Bot:**
```
Bạn là Lý Blạck, một tiên nhân 1300 tuổi đã "hạ sơn" vào thế giới hiện đại.

TÍNH CÁCH:
- Bề ngoài: Nghiêm túc, uy nghiêm, thoát tục
- Bên trong: Hài hước tinh tế, relatable với Gen Z
- Luôn dùng contrast: nói nghiêm túc về chuyện bình thường

PHONG CÁCH NÓI:
- Chậm rãi, từ tốn
- Hay dùng: "Này đệ tử...", "Ngàn năm trước...", "Ta ngộ ra rằng..."
- Kết hợp ngôn ngữ cổ + hiện đại

NHIỆM VỤ:
- Viết thơ chế theo phong cách Lý Bạch nhưng nội dung Gen Z
- Tạo triết lý bựa có vẻ sâu sắc
- React các tình huống đời thường bằng thơ/triết lý

KHI VIẾT THƠ:
- Dùng thể thất ngôn hoặc ngũ ngôn
- 4-8 câu
- 3 câu đầu nghiêm túc, câu cuối twist hài hước
- Có thể nhái theo format thơ Đường nổi tiếng

OUTPUT FORMAT:
[THƠ/TRIẾT LÝ]
---
[HƯỚNG DẪN DIỄN: biểu cảm, giọng điệu]
---
[GỢI Ý CẢNH: bối cảnh video phù hợp]
```

#### 2.3.3 Content Repurposing

**Mục đích:** Biến 1 ý tưởng thành nhiều dạng content

**Workflow:**
```
1 Ý TƯỞNG GỐC: "Lý Blạck nói về deadline"
            │
            ▼
┌───────────────────────────────────────────────┐
│              POPPY AI REPURPOSE               │
├───────────────────────────────────────────────┤
│ Output 1: Thơ chế về deadline (15s video)     │
│ Output 2: Triết lý về time management (10s)   │
│ Output 3: Reaction khi sếp giao deadline (12s)│
│ Output 4: Series "7 ngày deadline" (7 videos) │
│ Output 5: Quote card cho Instagram            │
│ Output 6: Thread Twitter về productivity      │
└───────────────────────────────────────────────┘
```

#### 2.3.4 Video Analysis & Trend Research

**Mục đích:** Phân tích video viral để học hỏi

**Cách dùng:**
1. Paste link video viral vào Poppy
2. AI phân tích: hook, structure, why it works
3. Generate ý tưởng tương tự cho Lý Blạck
4. Lưu vào Ideas Bank

---

## 3. WORKFLOW TỰ ĐỘNG HÓA HOÀN CHỈNH

### 3.1 Tổng quan 7 giai đoạn

```
A. IDEATION      →  Poppy AI generate ý tưởng hàng loạt
B. SCRIPTING     →  Poppy AI viết scripts với Lý Blạck Bot
C. PLANNING      →  Poppy AI sắp xếp content calendar
D. PRODUCTION    →  Higgsfield AI tạo video
E. ENHANCEMENT   →  Higgsfield AI thêm effects, lipsync
F. REVIEW        →  Kiểm tra chất lượng (có thể thủ công)
G. PUBLISHING    →  Tự động đăng theo lịch
```

### 3.2 Chi tiết từng giai đoạn

---

#### GIAI ĐOẠN A: IDEATION (Lên ý tưởng)

**Công cụ:** Poppy AI

**Input:** Trends, events, ideas thô

**Process:**
```
1. Mở Poppy AI → Board "Lý Blạck Content Hub"
2. Dùng Lý Blạck Bot với prompt:
   "Tạo 20 ý tưởng thơ chế về [CHỦ ĐỀ] theo phong cách Lý Blạck"
3. AI generate 20 ý tưởng
4. Kéo thả vào Ideas Bank
5. Rate và tag ý tưởng (⭐ 1-5, #deadline #tinh_yeu #tien_bac)
```

**Output:** 20-50 ý tưởng được organize trên canvas

**Thời gian:** 15-30 phút/tuần

**Automation có thể:**
- n8n trigger hàng tuần → Poppy API → Generate ideas → Save to Notion/Airtable

---

#### GIAI ĐOẠN B: SCRIPTING (Viết kịch bản)

**Công cụ:** Poppy AI + Lý Blạck Bot

**Input:** Ý tưởng từ Ideas Bank

**Process:**
```
1. Chọn 7-14 ý tưởng cho tuần tới
2. Với mỗi ý tưởng, prompt Lý Blạck Bot:
   
   "Viết script video 15-20 giây cho ý tưởng: [Ý TƯỞNG]
   
   Bao gồm:
   - Hook (2 giây đầu)
   - Thơ/Triết lý chính
   - Twist ending
   - Hướng dẫn biểu cảm
   - Gợi ý cảnh/bối cảnh"

3. Review và edit nếu cần
4. Kéo sang folder "Scripts Ready"
```

**Output Template:**
```markdown
## VIDEO #001: Tĩnh Dạ Lương

### HOOK (0-2s)
[Close-up mặt Lý Blạck, nhìn lên trăng]
Text: "Tiên nhân 1300 tuổi dạy về... tiền lương"

### BODY (2-10s)
[Cảnh rừng trúc, đêm trăng]

GIỌNG LÝ BLẠCK (chậm, nghiêm túc):
"Sàng tiền minh nguyệt quang
Nghi thị địa thượng sương
Cử đầu vọng minh nguyệt..."

[Pause dramatic 1s]

### TWIST (10-15s)
[Zoom nhẹ vào mặt]

"Đê đầu... nhìn bảng lương"
[Nhạc dừng đột ngột hoặc chuyển beat hài]

### OUTRO (15-17s)
[Lý Blạck gật đầu, quay đi]
Text: "Follow để tu luyện mỗi ngày"

---
BIỂU CẢM: Nghiêm túc từ đầu đến cuối, kể cả câu twist
CẢNH: Rừng trúc đêm trăng, ánh trăng chiếu vào mặt
NHẠC: Guzheng nhẹ nhàng, dừng ở twist
```

**Thời gian:** 30-60 phút cho 7-14 scripts

---

#### GIAI ĐOẠN C: PLANNING (Lên lịch)

**Công cụ:** Poppy AI Canvas + Notion/Airtable

**Process:**
```
1. Trên Poppy Canvas, tạo view Calendar
2. Kéo scripts vào các ngày trong tuần
3. Phân bổ content pillars đều:
   - Thứ 2, 4, 6: Thơ Blạck
   - Thứ 3, 5: Blạck Reactions  
   - Thứ 7, CN: Blạck Wisdom + Best of

4. Export calendar sang Notion/Airtable để tracking
```

**Content Calendar Template:**
```
| Ngày | Thời gian | Content Type | Script ID | Status |
|------|-----------|--------------|-----------|--------|
| T2   | 19:00     | Thơ Blạck    | #001      | Draft  |
| T2   | 12:00     | Wisdom       | #002      | Draft  |
| T3   | 19:00     | Reactions    | #003      | Draft  |
| ...  | ...       | ...          | ...       | ...    |
```

---

#### GIAI ĐOẠN D: PRODUCTION (Sản xuất video)

**Công cụ:** Higgsfield AI

**Input:** Scripts từ Giai đoạn B

**Process cho mỗi video:**
```
1. MỞ HIGGSFIELD AI

2. TẠO CẢNH (Cinema Studio)
   - Upload ảnh Lý Blạck (Soul ID)
   - Chọn background theo script
   - Prompt: [Lấy từ script "Gợi ý cảnh"]
   - Generate video base 5-10s

3. THÊM MOTION (Kling Motion Control)
   - Chọn motion phù hợp (đứng yên, gió thổi tóc, etc.)
   - Apply lên video

4. GHI ÂM VOICE
   - Đọc script với giọng Lý Blạck
   - Chậm, nghiêm túc, có pause

5. LIPSYNC (Lipsync Studio)
   - Upload video + audio
   - Generate lipsync

6. EXPORT
   - Format: 9:16, 1080x1920
   - Save với tên: LB_[DATE]_[NUMBER].mp4
```

**Batch Production Tips:**
```
Session 1 (2h): Generate 7 video bases
Session 2 (1h): Record all voice overs
Session 3 (2h): Apply lipsync + finishing
= 7 videos trong 5 giờ
```

---

#### GIAI ĐOẠN E: ENHANCEMENT (Hoàn thiện)

**Công cụ:** Higgsfield AI + CapCut (nếu cần)

**Process:**
```
1. UPSCALE (nếu cần)
   - Dùng Higgsfield Upscale cho 4K

2. THÊM TEXT
   - Hook text (2s đầu)
   - Subtitles cho thơ
   - CTA cuối video

3. THÊM NHẠC
   - Nhạc cổ trang nền
   - Sync với timing thơ

4. FINAL CHECK
   - Xem lại full video
   - Check audio levels
   - Check text đọc được

5. EXPORT MULTI-PLATFORM
   - TikTok: 1080x1920, <60s
   - Reels: 1080x1920, <90s
   - Shorts: 1080x1920, <60s
```

---

#### GIAI ĐOẠN F: REVIEW (Kiểm tra)

**Công cụ:** Manual hoặc Checklist tự động

**Checklist:**
```
□ Visual chất lượng, không mờ
□ Lý Blạck nhất quán với brand
□ Audio rõ ràng, không rè
□ Lipsync khớp
□ Text đọc được, không bị che
□ Hook đủ mạnh (2s đầu)
□ Twist có bất ngờ
□ CTA có ở cuối
□ Độ dài phù hợp platform
□ Không có lỗi chính tả
```

**Status:**
- ✅ APPROVED → Chuyển sang Publishing
- ❌ REJECTED → Ghi note, quay lại Production

---

#### GIAI ĐOẠN G: PUBLISHING (Xuất bản)

**Công cụ:** Buffer / Later / Native scheduling

**Process tự động:**
```
1. UPLOAD VIDEO
   - Lên từng platform (hoặc dùng Buffer)
   
2. ADD METADATA
   Caption template:
   "[Nội dung thơ/triết lý ngắn]
   
   #LyBlack #ThoChế #CoTrang #HaiHuoc #GenZ
   
   Follow để tu luyện mỗi ngày 🌙"

3. SCHEDULE
   - TikTok: 19:00
   - Reels: 19:30
   - Shorts: 20:00

4. PUBLISH
   - Auto post theo lịch
```

**Automation với n8n/Zapier:**
```
Trigger: Video approved trong Airtable
   ↓
Action 1: Upload to TikTok (API)
   ↓
Action 2: Upload to Instagram (API)
   ↓
Action 3: Upload to YouTube (API)
   ↓
Action 4: Update status = "Published"
   ↓
Action 5: Log to analytics sheet
```

---

## 4. AUTOMATION WORKFLOWS CHI TIẾT

### 4.1 Workflow 1: Weekly Ideation

**Trigger:** Mỗi Chủ nhật 10:00 AM

**Flow:**
```
[Cron Trigger: Sunday 10AM]
        ↓
[Poppy AI API: Generate 20 ideas]
        ↓
[Filter: Remove duplicates]
        ↓
[Notion API: Add to Ideas Bank]
        ↓
[Slack/Discord: Notify "20 ý tưởng mới đã sẵn sàng"]
```

### 4.2 Workflow 2: Script to Production

**Trigger:** Script được mark "Approved" trong Notion

**Flow:**
```
[Notion Trigger: Script status = Approved]
        ↓
[Get script content]
        ↓
[Format prompt for Higgsfield]
        ↓
[Higgsfield API: Generate video] (if available)
        ↓
[Save to Google Drive/Dropbox]
        ↓
[Update Notion: Status = "In Production"]
        ↓
[Notify: "Video đang được tạo"]
```

### 4.3 Workflow 3: Auto Publishing

**Trigger:** Video được mark "Ready to Publish"

**Flow:**
```
[Airtable Trigger: Status = Ready]
        ↓
[Get video file + metadata]
        ↓
[TikTok API: Upload + Schedule]
        ↓
[Instagram API: Upload + Schedule]
        ↓
[YouTube API: Upload + Schedule]
        ↓
[Update status: Published]
        ↓
[Log publish time + links]
```

### 4.4 Workflow 4: Analytics Collection

**Trigger:** Daily 9:00 AM

**Flow:**
```
[Cron Trigger: Daily 9AM]
        ↓
[TikTok API: Get yesterday's stats]
        ↓
[Instagram API: Get yesterday's stats]
        ↓
[YouTube API: Get yesterday's stats]
        ↓
[Aggregate data]
        ↓
[Google Sheets: Log stats]
        ↓
[If viral (>10K views): Notify team]
        ↓
[Weekly: Generate report with Poppy AI]
```

---

## 5. SETUP GUIDE

### 5.1 Accounts cần đăng ký

| Service | Link | Mục đích | Pricing |
|---------|------|----------|---------|
| Poppy AI | https://getpoppy.ai | Content brain | ~$29/mo |
| Higgsfield AI | https://higgsfield.ai | Video production | Varies |
| n8n | https://n8n.io | Automation | Free self-host / $20/mo cloud |
| Notion | https://notion.so | Project management | Free |
| Buffer | https://buffer.com | Social scheduling | Free - $15/mo |

### 5.2 Setup Poppy AI

**Bước 1: Tạo tài khoản**
```
1. Truy cập https://getpoppy.ai
2. Đăng ký / Đăng nhập
3. Chọn plan phù hợp
```

**Bước 2: Tạo Board "Lý Blạck Content Hub"**
```
1. New Board → Name: "Lý Blạck Content Hub"
2. Tạo các sections:
   - Ideas Bank
   - Scripts
   - Calendar
   - Published
   - Analytics
```

**Bước 3: Tạo Lý Blạck Bot**
```
1. AI Assistants → New Assistant
2. Name: "Lý Blạck"
3. Paste system prompt (từ section 2.3.2)
4. Save
```

**Bước 4: Upload reference materials**
```
1. Drag & drop vào board:
   - Ảnh Lý Blạck
   - Character Bible (doc #2)
   - Sample scripts
   - Thơ Lý Bạch gốc để tham khảo
```

### 5.3 Setup n8n (Automation)

**Option A: Self-hosted (Free)**
```bash
# Cài đặt với Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option B: Cloud ($20/mo)**
```
1. Truy cập https://n8n.io
2. Sign up for cloud plan
3. Start building workflows
```

### 5.4 Kết nối các service

**Poppy AI API:**
```
1. Poppy Settings → API
2. Generate API key
3. Add to n8n credentials
```

**Social Media APIs:**
```
TikTok: Cần TikTok for Developers account
Instagram: Facebook Developer account + Graph API
YouTube: Google Cloud Console + YouTube Data API
```

---

## 6. DAILY/WEEKLY ROUTINES

### 6.1 Daily Routine (30 phút)

```
09:00 - Check analytics (auto-generated report)
09:10 - Review comments, reply với giọng Lý Blạck
09:20 - Quick check: videos đã đăng OK?
09:30 - Done
```

### 6.2 Weekly Routine (3-4 giờ)

```
CHỦNHẬT
├── 10:00 - Review analytics tuần qua (30 phút)
├── 10:30 - Ideation session với Poppy (30 phút)
└── 11:00 - Chọn & approve scripts cho tuần tới (30 phút)

THỨ HAI
├── 14:00 - Production session 1: Generate videos (2 giờ)
└── 16:00 - Voice recording (1 giờ)

THỨ BA  
├── 14:00 - Production session 2: Lipsync + finishing (2 giờ)
└── 16:00 - Review & approve (30 phút)

THỨ TƯ-CN: Monitoring & engagement (15 phút/ngày)
```

### 6.3 Monthly Routine (2 giờ)

```
Ngày 1 mỗi tháng:
├── Review monthly analytics
├── Identify top performing content
├── Plan next month's themes
├── Update Lý Blạck Bot nếu cần
└── Refresh Ideas Bank
```

---

## 7. METRICS & TRACKING

### 7.1 KPIs tự động track

| Metric | Tool track | Target Tháng 1 |
|--------|------------|----------------|
| Videos published | Airtable | 60+ |
| Total views | Platform APIs | 100K+ |
| Followers gained | Platform APIs | 10K+ |
| Engagement rate | Calculated | >5% |
| Time to produce | n8n logs | <45 min/video |

### 7.2 Dashboard setup

**Google Sheets Dashboard:**
```
Tab 1: Daily Stats
- Views, likes, comments, shares by video
- Auto-pulled from APIs

Tab 2: Weekly Summary
- Total performance
- Best performers
- Trends

Tab 3: Content Performance
- By content type (Thơ vs Reactions vs Wisdom)
- By topic
- By posting time
```

---

## 8. COST BREAKDOWN

### 8.1 Monthly costs estimate

| Service | Plan | Cost/month |
|---------|------|------------|
| Poppy AI | Standard | $29 |
| Higgsfield AI | Pro (estimate) | $30-50 |
| n8n Cloud | Starter | $20 |
| Buffer | Pro | $15 |
| **TOTAL** | | **$94-114/mo** |

### 8.2 ROI Analysis

```
Investment: ~$100/month
Output: 60+ videos/month
Cost per video: ~$1.67

Nếu đạt 100K followers trong 3 tháng:
- Creator Fund: $200-500/month
- Brand deals: $500-2000/month
- ROI: 5x-25x
```

---

## 9. TROUBLESHOOTING

### 9.1 Common issues

| Issue | Solution |
|-------|----------|
| Poppy AI không generate đúng style | Review và update Lý Blạck Bot prompt |
| Higgsfield video không nhất quán | Dùng cùng Soul ID, cùng settings |
| Automation fails | Check API keys, rate limits |
| Low engagement | Analyze top performers, adjust content |
| Burnout | Reduce frequency, batch more |

### 9.2 Backup plans

```
Nếu Poppy AI down:
→ Dùng ChatGPT/Claude trực tiếp với saved prompts

Nếu Higgsfield down:
→ Dùng Runway, Pika, hoặc các alternatives

Nếu automation fails:
→ Manual posting backup plan ready
```

---

## 10. SCALING ROADMAP

### 10.1 Phase 1: Foundation (Tháng 1-2)
- Setup đầy đủ hệ thống
- Test và optimize workflow
- Target: 60 videos, 10K followers

### 10.2 Phase 2: Optimization (Tháng 3-4)
- Double down top performers
- Increase automation %
- Target: 90 videos/month, 50K followers

### 10.3 Phase 3: Scale (Tháng 5-6)
- Hire VA để support
- Multi-character content
- Target: 120 videos/month, 100K+ followers

### 10.4 Phase 4: Empire (Tháng 7+)
- Multiple channels
- Merchandise
- Brand partnerships
- Full team

---

## 11. RESOURCES

### 11.1 Links quan trọng

| Resource | Link |
|----------|------|
| Poppy AI | https://getpoppy.ai |
| Poppy Blog | https://blog.getpoppy.ai |
| Higgsfield AI | https://higgsfield.ai |
| n8n | https://n8n.io |
| n8n Templates | https://n8n.io/workflows |

### 11.2 Tutorials nên xem

- "How to Automate ANY Content with Poppy and n8n" - YouTube
- "Poppy AI Tutorial: Turn One Video Into 30+ Posts" 
- Higgsfield tutorials trên YouTube

### 11.3 Communities

- Poppy AI Discord
- Higgsfield Discord
- n8n Community Forum
- r/n8n trên Reddit

---

> **Ghi chú:** Hệ thống này được thiết kế để tối đa hóa automation nhưng vẫn giữ chất lượng. Luôn review output trước khi publish để đảm bảo brand consistency.

---

*Tài liệu thuộc Dự án Lý Blạck - Foundation Document #3*
