# 🎬 Sora Video Generator - Complete Integration

Hệ thống tạo video AI tự động với Sora 2, tích hợp Google Drive và Admin UI.

## 📋 Tổng quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLOW TẠO VIDEO                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌────────┐    ┌──────────┐    ┌──────────────────┐ │
│  │ Admin UI │───▶│  n8n   │───▶│  Sora 2  │───▶│  Google Drive   │ │
│  │  (React) │◀───│Workflow│◀───│   API    │    │  (Auto Upload)   │ │
│  └──────────┘    └────────┘    └──────────┘    └──────────────────┘ │
│       │                                                ▲             │
│       │                                                │             │
│       └────────────────────────────────────────────────┘             │
│                    Xem/Tải video từ Google Drive                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Import Workflow vào n8n

```bash
# Mở n8n UI
http://localhost:5678

# Import workflow từ file:
n8n\workflows\sora-video-generator-complete.json
```

### 2. Cấu hình Credentials trong n8n

Cần 2 credentials:

#### a) Kie API (cho Sora 2)
- **Type**: HTTP Header Auth
- **Name**: `Kie`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer YOUR_KIE_API_KEY`

#### b) OpenRouter API (cho AI Enhance)
- **Type**: OpenRouter API
- **Name**: `OpenRouter account 2`
- **API Key**: `YOUR_OPENROUTER_API_KEY`

### 3. Activate Workflow

1. Mở workflow trong n8n
2. Click nút **Activate** (toggle on)
3. Webhook URL sẽ là: `http://localhost:5678/webhook/sora-generate-video`

### 4. Truy cập Admin UI

```bash
cd longsang-admin
npm run dev
# Mở: http://localhost:8083/admin/sora-video
```

## 📡 API Reference

### POST /webhook/sora-generate-video

**Request Body:**
```json
{
  "prompt": "Một con heo đang bay trên bầu trời hoàng hôn",
  "use_ai_enhance": true,
  "model": "sora-2-text-to-video",
  "aspect_ratio": "16:9",
  "duration": 5,
  "folder_id": "root",
  "video_name": "my_video"
}
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| prompt | string | required | Mô tả video muốn tạo |
| use_ai_enhance | boolean | true | Có dùng AI enhance prompt không |
| model | string | "sora-2-text-to-video" | Model Sora 2 |
| aspect_ratio | string | "16:9" | "16:9", "9:16", hoặc "1:1" |
| duration | number | 5 | Thời lượng video (giây) |
| folder_id | string | "root" | Google Drive folder ID |
| video_name | string | auto-generated | Tên file video |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video đã được tạo và upload thành công!",
  "data": {
    "task_id": "abc123",
    "video_url": "https://...",
    "google_drive": {
      "file_id": "1ABC...",
      "file_name": "my_video.mp4",
      "view_link": "https://drive.google.com/file/d/1ABC.../view",
      "download_link": "https://drive.google.com/uc?export=download&id=1ABC..."
    },
    "prompt": {
      "original": "Một con heo đang bay...",
      "enhanced": "A whimsical pink pig...",
      "used": "A whimsical pink pig..."
    },
    "settings": {
      "model": "sora-2-text-to-video",
      "aspect_ratio": "16:9",
      "duration": 5
    },
    "processing": {
      "poll_count": 24,
      "total_time_seconds": 120
    }
  },
  "timestamp": "2025-01-XX..."
}
```

## 🔧 Cấu hình

### Environment Variables (.env.local)

```env
# n8n Webhook
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook
VITE_N8N_WEBHOOK_SECRET=your-webhook-secret

# Google Drive API (Backend)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### n8n Configuration (.n8n.env)

```env
N8N_HOST=localhost
N8N_PORT=5678
WEBHOOK_URL=http://localhost:5678

# CORS cho Admin UI
N8N_CORS_ALLOWED_ORIGINS=http://localhost:8083,http://localhost:5173
```

## 📁 File Structure

```
longsang-admin/
├── n8n/
│   └── workflows/
│       └── sora-video-generator-complete.json  # Main workflow
├── src/
│   ├── lib/
│   │   └── api/
│   │       └── sora-video-service.ts           # API Service
│   └── pages/
│       └── SoraVideoGenerator.tsx              # UI Component
├── api/
│   └── google-drive.js                         # Google Drive API
└── .env.local                                  # Credentials
```

## 🎯 Features

### ✅ Implemented
- [x] AI Prompt Enhancement (GPT-4o-mini via OpenRouter)
- [x] Sora 2 Text-to-Video generation
- [x] Auto-polling for task completion
- [x] Automatic Google Drive upload
- [x] Multiple aspect ratios (16:9, 9:16, 1:1)
- [x] Custom video duration
- [x] Error handling with retry
- [x] React UI component

### 🔄 Planned
- [ ] Image-to-Video support
- [ ] Storyboard support
- [ ] Video gallery in Admin
- [ ] Generation history
- [ ] Batch generation

## 🐛 Troubleshooting

### Video không tạo được
1. Check n8n workflow đã active chưa
2. Kiểm tra Kie API key còn hạn không
3. Check logs trong n8n Executions

### Không upload được Google Drive
1. Verify GOOGLE_SERVICE_ACCOUNT_JSON trong .env
2. Check backend API đang chạy (port 3001)
3. Service account có quyền access folder không

### Webhook không response
1. Check CORS settings trong n8n
2. Verify webhook URL đúng
3. Check n8n logs

## 📞 Support

- **n8n Community**: https://community.n8n.io
- **Kie.ai Support**: support@kie.ai
- **Internal**: Liên hệ team dev
