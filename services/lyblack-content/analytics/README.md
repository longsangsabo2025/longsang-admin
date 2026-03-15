# 📊 ANALYTICS & TRACKING GUIDE

## Cách sử dụng file tracking.csv

### Các cột quan trọng

| Cột | Mô tả | Cách điền |
|-----|-------|-----------|
| `video_id` | ID video (001, 002...) | Tự động tăng |
| `title` | Tên video | Copy từ script |
| `type` | Loại content | Thơ Blạck / Blạck Wisdom / Blạck Reaction |
| `topic` | Chủ đề | Tiền, Deadline, Crush, Monday... |
| `publish_date` | Ngày đăng | YYYY-MM-DD |
| `platform` | Nền tảng | TikTok / Reels / Shorts |
| `views_1h` | Views sau 1 giờ | Số |
| `views_24h` | Views sau 24 giờ | Số |
| `views_7d` | Views sau 7 ngày | Số |
| `views_total` | Tổng views | Số |
| `likes` | Số likes | Số |
| `comments` | Số comments | Số |
| `shares` | Số shares | Số |
| `saves` | Số saves | Số |
| `completion_rate` | % xem hết video | % (nếu có) |
| `hook_type` | Loại hook | Close-up / Text / Contrast... |
| `twist_type` | Loại twist | Thay từ / Gen Z hóa / Đổi ngữ cảnh |
| `music` | Nhạc nền | Tên track |
| `duration_sec` | Thời lượng (giây) | Số |
| `notes` | Ghi chú | Bất kỳ |

---

## Metrics quan trọng cần track

### 🎯 KPIs chính

1. **Views_24h / Views_1h ratio** → Đánh giá viral potential
   - Ratio > 10x = Đang viral
   - Ratio 5-10x = Tốt
   - Ratio < 5x = Cần cải thiện

2. **Engagement Rate** = (Likes + Comments + Shares + Saves) / Views × 100
   - > 10% = Xuất sắc
   - 5-10% = Tốt
   - 2-5% = Trung bình
   - < 2% = Cần cải thiện

3. **Completion Rate** (nếu có từ TikTok Analytics)
   - > 70% = Hook & content tốt
   - 50-70% = Cần cải thiện retention
   - < 50% = Hook yếu hoặc video dài quá

4. **Shares/Views ratio** → Viral coefficient
   - > 5% = Viral potential cao
   - 2-5% = Tốt
   - < 2% = Content chưa đủ shareable

---

## Weekly Analysis Template

```
TUẦN [SỐ] - [NGÀY]

📈 TỔNG QUAN
- Videos đăng: [số]
- Tổng views: [số]
- Best performer: [tên video] ([views] views)
- Worst performer: [tên video] ([views] views)

🔥 WHAT WORKED
- Hook type perform tốt: [...]
- Topic perform tốt: [...]
- Music perform tốt: [...]

❌ WHAT DIDN'T WORK
- [...]

📝 LESSONS
1. [...]
2. [...]

🎯 NEXT WEEK PLAN
1. [...]
2. [...]
```

---

## Automation Ideas

### Auto-tracking với n8n
1. TikTok API → Pull stats hàng ngày
2. Append vào Google Sheets
3. Weekly summary email

### Manual tracking (đơn giản)
1. Mỗi sáng check stats video hôm qua
2. Update CSV
3. Weekly review vào Chủ Nhật
