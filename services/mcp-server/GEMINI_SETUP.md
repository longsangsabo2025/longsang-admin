# 🚀 Hướng dẫn thiết lập Gemini API (Nov 2025)

## 📋 Tổng quan
Google vừa ra mắt **Gemini 3** (Nov 18, 2025) - mô hình AI thông minh nhất của họ!

### Các mô hình có sẵn:
| Model | Đặc điểm | Use Case |
|-------|----------|----------|
| `gemini-3-pro-preview` | Thông minh nhất, multimodal | Tasks phức tạp |
| `gemini-2.5-pro` | Suy luận mạnh, code | Code generation |
| `gemini-2.5-flash` | Nhanh, cân bằng, 1M context | **Default** |
| `gemini-2.5-flash-lite` | Nhanh nhất, tiết kiệm | High volume |

---

## Bước 1: Truy cập Google AI Studio
Mở link: **https://aistudio.google.com/app/apikey**

## Bước 2: Tạo API Key
1. Click **"Create API Key"**
2. Chọn **"Create API key in new project"** hoặc chọn project có sẵn
3. Copy API Key (bắt đầu bằng `AIza...`)

## Bước 3: Cập nhật .env
Mở file `D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\.env`

```env
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Bước 4: Test
```powershell
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\mcp-server
.\.venv\Scripts\python.exe test_gemini_new.py
```

---

## 🆕 Tính năng MỚI (Nov 2025)

### 1️⃣ Thinking Mode - Suy luận nâng cao
```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Giải phương trình: x² + 5x + 6 = 0",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=-1  # Dynamic thinking
        )
    )
)
```

### 2️⃣ Google Search Grounding - Tìm kiếm realtime
```python
config = types.GenerateContentConfig(
    tools=[types.Tool(google_search=types.GoogleSearch())]
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Ai đã vô địch Euro 2024?",
    config=config
)
# => "Tây Ban Nha đã vô địch Euro 2024, đánh bại Anh 2-1 trong trận chung kết"
```

### 3️⃣ Structured Output - JSON Schema
```python
json_schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "price": {"type": "number"},
        "in_stock": {"type": "boolean"}
    }
}

config = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_json_schema=json_schema
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Thông tin về iPhone 15 Pro",
    config=config
)
# => {"name": "iPhone 15 Pro", "price": 999, "in_stock": true}
```

### 4️⃣ Multi-turn Chat
```python
chat = client.chats.create(model="gemini-2.5-flash")

response1 = chat.send_message("Tôi tên là Long Sang")
response2 = chat.send_message("Tên tôi là gì?")
# => "Tên bạn là Long Sang"
```

### 5️⃣ Image Generation (Nano Banana) 🍌
```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=["Tạo logo cho quán cà phê tên 'Long Sang Coffee'"],
    config={"response_modalities": ['TEXT', 'IMAGE']}
)
```

### 6️⃣ Video Generation (Veo 3.1) 🎬
```python
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="A cat walking on the beach at sunset"
)
```

---

## 📝 Lưu ý quan trọng
- Gemini API **FREE** với giới hạn:
  - 60 requests/phút (2.5 Flash)
  - 1 triệu tokens/ngày
  - 2 requests/phút (2.5 Pro)
- Không cần credit card
- Giữ temperature = 1.0 cho Gemini 3 (khuyến nghị)

## 🎯 MCP Server Tools có sẵn:
| Tool | Mô tả |
|------|-------|
| `gemini_chat` | Chat với AI |
| `gemini_code` | Generate code |
| `gemini_summarize` | Tóm tắt văn bản |
| `gemini_translate` | Dịch ngôn ngữ |
| `gemini_search` | Chat + Google Search |
| `youtube_stats` | Thống kê kênh YouTube |
| `drive_list` | List files Google Drive |
| `calendar_events` | Xem lịch |
| `seo_queries` | Top search queries |

---
Tạo bởi: Long Sang Automation | Updated: Nov 29, 2025
SDK: google-genai v1.0+
