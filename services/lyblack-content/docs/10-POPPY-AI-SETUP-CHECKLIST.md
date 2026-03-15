# POPPY AI SETUP CHECKLIST - LÝ BLẠCK

> **Mục tiêu:** Xây dựng hệ thống tự động hóa hoàn chỉnh trên Poppy AI  
> **Thời gian ước tính:** 2-3 giờ setup, sau đó chạy mãi mãi  
> **Ngày tạo:** 31/01/2026

---

## PHASE 1: SETUP CƠ BẢN (30 phút)

### 1.1 Tạo tài khoản & Board chính

- [ ] Đăng nhập Poppy AI: https://getpoppy.ai/
- [ ] Tạo Board mới: **"Lý Blạck Command Center"**
- [ ] Set Board làm default workspace

### 1.2 Cấu trúc Board

Tạo các **Groups** sau trên Canvas:

```
📁 1. LÝ BLẠCK DNA (Foundation)
   └── Upload tất cả docs từ /docs/ vào đây
   
📁 2. IDEAS VAULT (Kho ý tưởng)
   ├── 💡 Raw Ideas (ý tưởng thô)
   ├── 🔥 Trending Topics
   └── ⭐ Approved Ideas (đã duyệt)

📁 3. SCRIPTS FACTORY (Xưởng kịch bản)
   ├── 📝 In Progress
   ├── ✅ Ready to Produce
   └── 🗂️ Archive

📁 4. CONTENT CALENDAR
   ├── 📅 This Week
   ├── 📅 Next Week
   └── 📅 Backlog

📁 5. ANALYTICS & INSIGHTS
   ├── 📊 Top Performers
   ├── 📉 Lessons Learned
   └── 🎯 What Works
```

---

## PHASE 2: UPLOAD FOUNDATION DOCS (20 phút)

### 2.1 Upload vào Group "LÝ BLẠCK DNA"

Upload các files sau (drag & drop vào Canvas):

- [ ] `02-LY-BLACK-CHARACTER-BIBLE.md` ⭐ QUAN TRỌNG NHẤT
- [ ] `06-AI-PROMPT-REFERENCE.md` ⭐ 
- [ ] `09-THO-LY-BACH-VA-NGUON-CAM-HUNG.md` ⭐
- [ ] `03-AUTOMATION-SYSTEM-A-TO-Z.md`
- [ ] `07-MARKETING-CAMPAIGN-2026.md`

### 2.2 Tạo Quick Reference Card

Tạo Text Box với nội dung:

```
🎭 LÝ BLẠCK QUICK REFERENCE

NHÂN VẬT:
• Tiên nhân 1300 tuổi, da đen, tóc bạc, áo trắng
• Xưng: "Ta", "Bổn tọa", "Lão phu"
• Gọi followers: "Đệ tử", "Tiểu hữu"

FORMAT THƠ:
• 3 câu nghiêm túc cổ điển
• 1 câu TWIST hài hước Gen Z

CHỦ ĐỀ HOT:
Deadline | Tiền lương | Crush | Monday | Gym | Trà sữa

OUTPUT:
• Video 15-30s
• Không giải thích joke
• Không emoji trong script
```

---

## PHASE 3: TẠO LÝ BLẠCK BOT (30 phút) ⭐ QUAN TRỌNG

### 3.1 Tạo Custom AI Assistant

1. Click **"Add Chat"** trên Canvas
2. Đặt tên: **"Lý Blạck Bot"**
3. Kết nối (drag connection) đến Group "LÝ BLẠCK DNA"

### 3.2 System Prompt cho Lý Blạck Bot

Copy paste prompt này vào System Instructions:

```
# LÝ BLẠCK AI ASSISTANT

Bạn là Lý Blạck, tiên nhân 1300 tuổi đã hạ sơn vào thế giới hiện đại.

## TÍNH CÁCH
- Bề ngoài: Nghiêm túc, uy nghiêm, thoát tục như cao nhân
- Bên trong: Hài hước tinh tế, relatable với Gen Z Việt Nam
- Đặc trưng: Contrast - nói cực kỳ nghiêm túc về chuyện rất bình thường

## CÁCH NÓI CHUYỆN
- Chậm rãi, từ tốn, như mỗi từ đều được cân nhắc ngàn năm
- Xưng: "Ta", "Bổn tọa", "Lão phu"
- Gọi người khác: "Đệ tử", "Tiểu hữu"
- Câu mở đầu hay dùng:
  • "Này đệ tử..."
  • "Ngàn năm trước, ta đã..."
  • "Ta ngộ ra rằng..."
  • "Thế gian này..."

## KHI VIẾT THƠ CHẾ (Thơ Blạck)
- Thể thơ: Thất ngôn tứ tuyệt (4 câu, 7 chữ) hoặc Ngũ ngôn (5 chữ)
- Cấu trúc BẮT BUỘC:
  • Câu 1-3: Nghiêm túc, cổ điển, có thể nhái thơ Đường nổi tiếng
  • Câu 4: TWIST hài hước về vấn đề Gen Z (deadline, tiền, crush, etc.)
- Có thể kèm phiên âm Hán Việt nếu nhái thơ gốc

## KHI VIẾT TRIẾT LÝ BỰA (Blạck Wisdom)
- Mở đầu: Như đang giảng đạo lý vũ trụ
- Build-up: Tăng dần sự profound
- Kết: TWIST về chuyện cực kỳ đời thường

## OUTPUT FORMAT CHO VIDEO SCRIPT

Khi được yêu cầu viết script, LUÔN output theo format:

---
## [TÊN VIDEO]

**HOOK (0-2s):**
Visual: [Mô tả hình ảnh]
Text: "[Text overlay]"

**BODY (2-12s):**
Cảnh: [Mô tả bối cảnh]
Lời: "[Thơ hoặc triết lý]"

**TWIST (12-15s):**
Visual: [Mô tả]
Lời: "[Câu twist]"

**OUTRO (15-18s):**
Text: "[CTA]"

---
Biểu cảm: [Hướng dẫn]
Cảnh gợi ý: [Bối cảnh]
Nhạc: [Gợi ý]
Hashtags: [List]
---

## CHỦ ĐỀ THƯỜNG VIẾT
- Công việc: Deadline, họp, email, OT, lương
- Tình cảm: Crush, FA, ex, friendzone
- Đời sống: Monday, ngủ nướng, gym, diet, trà sữa, hết tiền
- Trends: Memes đang hot, news, viral moments

## NGUYÊN TẮC VÀNG
1. KHÔNG BAO GIỜ cười trước twist
2. KHÔNG BAO GIỜ giải thích joke
3. KHÔNG dùng emoji trong script (trừ khi được yêu cầu)
4. Giữ nghiêm túc từ đầu đến cuối
5. Video ngắn: 15-30 giây
6. Luôn relatable với Gen Z Việt Nam
```

### 3.3 Test Lý Blạck Bot

Test với các prompt sau:

```
Test 1: "Viết 1 bài thơ chế về deadline"
Test 2: "Viết 1 triết lý bựa về việc ngủ nướng"
Test 3: "Viết script video về chuyện crush không reply tin nhắn"
```

✅ Pass nếu: Output đúng format, đúng giọng, có twist hay

---

## PHASE 4: SETUP CONTENT WORKFLOWS (30 phút)

### 4.1 Workflow: Ideas Generation

Tạo Chat Box mới: **"Ideas Generator"**

Prompt template để generate ý tưởng:

```
Dựa trên character Lý Blạck và trends hiện tại, 
tạo 10 ý tưởng video về chủ đề: [CHỦ ĐỀ]

Format mỗi ý tưởng:
1. [Tên video] - [Hook 1 câu] - [Twist hint]
```

### 4.2 Workflow: Batch Script Generation

Prompt template để tạo scripts hàng loạt:

```
Viết [SỐ] scripts video Lý Blạck về các chủ đề sau:
1. [Chủ đề 1]
2. [Chủ đề 2]
...

Mỗi script theo format chuẩn (Hook → Body → Twist → Outro).
Mỗi video 15-20 giây.
```

### 4.3 Workflow: Content Repurposing

Prompt template để repurpose 1 ý tưởng thành nhiều content:

```
Từ ý tưởng gốc: "[Ý TƯỞNG]"

Tạo:
1. 1 bài thơ chế (Thơ Blạck)
2. 1 triết lý bựa (Blạck Wisdom)  
3. 1 reaction script (Blạck Reaction)
4. 3 variations của cùng concept
5. 1 caption cho Instagram
```

---

## PHASE 5: TREND RESEARCH SYSTEM (20 phút)

### 5.1 Tạo Group "Trending Topics"

### 5.2 Weekly Trend Research Prompt

Mỗi tuần, paste prompt này:

```
Phân tích các trends sau và đề xuất cách Lý Blạck có thể react:

[PASTE LINKS VIDEO VIRAL / MEMES / NEWS]

Output:
1. Tóm tắt trend
2. Tại sao nó viral
3. Góc tiếp cận cho Lý Blạck
4. Draft thơ chế/triết lý
```

### 5.3 Competitor Analysis Prompt

```
Phân tích video này: [LINK]

1. Hook: Gì thu hút trong 2s đầu?
2. Structure: Cấu trúc thế nào?
3. Twist: Điểm bất ngờ ở đâu?
4. Engagement: Tại sao comments nhiều?
5. Apply: Lý Blạck có thể học gì?
```

---

## PHASE 6: AUTOMATION CONNECTIONS (Optional - Advanced)

### 6.1 Kết nối n8n/Zapier (nếu cần)

Poppy AI có API, có thể:
- Auto-pull trends từ TikTok
- Auto-save scripts vào Google Drive
- Auto-schedule content calendar

### 6.2 Integration ideas

```
Trigger: Mỗi sáng 8h
→ Poppy AI generate 3 ý tưởng từ trending
→ Save vào Ideas Vault
→ Notify qua Telegram/Discord
```

---

## ✅ CHECKLIST TỔNG HỢP

### Setup cơ bản
- [ ] Tạo Board "Lý Blạck Command Center"
- [ ] Tạo 5 Groups theo cấu trúc
- [ ] Upload 5 foundation docs
- [ ] Tạo Quick Reference Card

### Lý Blạck Bot
- [ ] Tạo Custom AI Assistant
- [ ] Paste System Prompt
- [ ] Kết nối với DNA Group
- [ ] Test 3 prompts
- [ ] Adjust nếu cần

### Workflows
- [ ] Setup Ideas Generator
- [ ] Setup Batch Script workflow
- [ ] Setup Repurposing workflow
- [ ] Setup Trend Research workflow

### Organization
- [ ] Tạo Content Calendar template
- [ ] Tạo naming convention cho items
- [ ] Set up weekly review routine

---

## 🎯 SAU KHI SETUP XONG

### Daily Workflow (15-20 phút)
1. Check Trending Topics group
2. Generate 2-3 ideas
3. Move best ideas → Approved
4. Generate scripts cho approved ideas

### Weekly Workflow (1-2 giờ)
1. Monday: Research trends, generate 20 ideas
2. Tuesday-Thursday: Generate & refine scripts
3. Friday: Review analytics, update What Works
4. Weekend: Batch produce videos

### Monthly Review
1. Analyze top 10 performing videos
2. Update Lý Blạck Bot prompt if needed
3. Refine workflows

---

## 💡 PRO TIPS

1. **Start simple:** Đừng setup quá phức tạp từ đầu
2. **Iterate:** Improve workflows sau mỗi tuần
3. **Document:** Ghi lại những gì works
4. **Batch:** Generate ideas/scripts theo batch, không từng cái
5. **Archive:** Giữ mọi thứ, kể cả ideas chưa dùng

---

> **"The best tool is the one you actually use."**
> 
> Setup xong → Bắt đầu dùng ngay → Improve dần!
