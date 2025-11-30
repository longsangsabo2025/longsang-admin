# Open Source Tools Research cho AI Advertising MVP (2025-2026)

## 📋 Tổng quan

Tài liệu này tổng hợp các công cụ mã nguồn mở có thể tận dụng để xây dựng MVP nền tảng quảng cáo AI hiện đại.

---

## 🎬 1. VIDEO GENERATION AI

### 1.1 OpenV

- **Mô tả**: Nền tảng mã nguồn mở tạo video bằng AI
- **Tính năng**:
  - Hỗ trợ nhiều mô hình: Mochi 1, FastHunyuan
  - Tạo video từ text hoặc image
  - Giao diện web (Next.js)
  - API video AI
- **Tech Stack**: Next.js, Vercel, Clerk (auth), Supabase (DB)
- **GitHub**: https://github.com/openv-ai/openv
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Rất phù hợp cho MVP)
- **Use Case**: Core video generation engine

### 1.2 LTX Video / LTX Studio

- **Mô tả**: Mô hình tạo video mã nguồn mở (Lightricks)
- **Tính năng**:
  - Tạo video 4K chất lượng cao
  - Âm thanh đồng bộ
  - Tốc độ nhanh (5s video trong 4s với LTXV-13B)
  - Công cụ chỉnh sửa tích hợp
- **Đánh giá**: ⭐⭐⭐⭐ (Tốt, nhưng có thể phức tạp hơn)
- **Use Case**: High-quality video generation

### 1.3 Wan v2.2 (Alibaba)

- **Mô tả**: Mô hình tạo video đầu tiên dùng MoE architecture
- **Tính năng**:
  - Text-to-video, Image-to-video
  - Độ phân giải 720p
  - Chạy được trên PC thông thường
- **Đánh giá**: ⭐⭐⭐⭐ (Mới, cần test)
- **Use Case**: Alternative video generation

### 1.4 Waver

- **Mô tả**: Unified platform cho image & video generation
- **Tính năng**:
  - Text-to-video (T2V)
  - Image-to-video (I2V)
  - Text-to-image (T2I)
  - Video 5-10s, 720p → 1080p upscale
- **Architecture**: Hybrid Stream DiT
- **Đánh giá**: ⭐⭐⭐⭐ (Unified approach tốt)
- **Use Case**: Multi-modal generation

### 1.5 UniVA

- **Mô tả**: Multi-agent framework cho video systems
- **Tính năng**:
  - Video understanding
  - Video segmentation
  - Video editing
  - Video generation
  - Plan-and-Act architecture với multi-level memory
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Rất mạnh cho complex workflows)
- **Use Case**: Advanced video processing pipeline

### 1.6 Mora

- **Mô tả**: Multi-agent framework tái tạo Sora functionality
- **Tính năng**:
  - Tận dụng các module open source có sẵn
  - Multi-agent fine-tuning
  - Human-in-the-loop
- **Đánh giá**: ⭐⭐⭐⭐ (Good alternative to Sora)
- **Use Case**: Sora alternative

---

## 🖼️ 2. IMAGE GENERATION

### 2.1 Fooocus

- **Mô tả**: UI mã nguồn mở cho Stable Diffusion XL
- **Tính năng**:
  - Text-to-image
  - Giao diện đơn giản
  - Stable Diffusion XL base model
- **GitHub**: https://github.com/lllyasviel/Fooocus
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Rất dễ sử dụng)
- **Use Case**: Image generation cho ads

### 2.2 Stable Diffusion (ComfyUI)

- **Mô tả**: Stable Diffusion với ComfyUI workflow
- **Tính năng**:
  - Text-to-image
  - Image-to-image
  - ControlNet support
  - Workflow-based editing
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Industry standard)
- **Use Case**: Professional image generation

---

## ✂️ 3. VIDEO EDITING

### 3.1 Flowblade

- **Mô tả**: Video editor mã nguồn mở cho Linux
- **Tính năng**:
  - Non-linear editing
  - Multiple formats support
  - Effects & transitions
- **Đánh giá**: ⭐⭐⭐ (Chỉ Linux, hạn chế)
- **Use Case**: Post-processing video

### 3.2 Cinelerra

- **Mô tả**: Professional video editing & compositing
- **Tính năng**:
  - Advanced editing
  - Keying, mattes
  - Multiple effects
  - Keyframe automation
- **Đánh giá**: ⭐⭐⭐ (Chỉ Linux, phức tạp)
- **Use Case**: Professional post-production

---

## 🤖 4. AI AGENT FRAMEWORKS

### 4.1 LangChain / LangGraph

- **Mô tả**: Framework xây dựng AI agents
- **Tính năng**:
  - Multi-agent orchestration
  - Tool calling
  - Memory management
  - Workflow automation
- **GitHub**: https://github.com/langchain-ai/langchain
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Industry standard)
- **Use Case**: Autonomous ad agents

### 4.2 AutoGPT / BabyAGI

- **Mô tả**: Autonomous AI agents
- **Tính năng**:
  - Goal-oriented agents
  - Self-planning
  - Tool usage
- **Đánh giá**: ⭐⭐⭐⭐ (Good for automation)
- **Use Case**: Campaign management agents

---

## 📊 5. A/B TESTING & ANALYTICS

### 5.1 Robyn (Meta Marketing Science)

- **Mô tả**: Open source marketing mix modeling
- **Tính năng**:
  - Media mix analysis
  - Channel effectiveness
  - Budget optimization
- **GitHub**: https://github.com/facebookexperimental/Robyn
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Từ Meta, rất mạnh)
- **Use Case**: Campaign optimization

### 5.2 Scipy.stats / Statsmodels

- **Mô tả**: Statistical testing libraries
- **Tính năng**:
  - A/B testing
  - Statistical significance
  - Hypothesis testing
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Standard libraries)
- **Use Case**: A/B test analysis

---

## 🔌 6. SOCIAL MEDIA API WRAPPERS

### 6.1 Facebook Marketing API (Python)

- **Package**: `facebook-business` (official)
- **GitHub**: https://github.com/facebook/facebook-python-business-sdk
- **Tính năng**:
  - Campaign management
  - Ad creation
  - Analytics
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Official SDK)

### 6.2 TikTok Marketing API

- **Package**: `TikTokAds` (community)
- **Tính năng**:
  - Campaign management
  - Ad creation
- **Đánh giá**: ⭐⭐⭐ (Community maintained)

### 6.3 Google Ads API

- **Package**: `google-ads-api` (official)
- **GitHub**: https://github.com/googleads/google-ads-python
- **Tính năng**:
  - Campaign management
  - Keyword management
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Official SDK)

---

## 🎯 7. AD CREATIVE TOOLS

### 7.1 AdGenie-LM

- **Mô tả**: Open source ad content generation
- **Tính năng**:
  - Text ad generation
  - Multi-language
  - SEO optimization
- **Đánh giá**: ⭐⭐⭐⭐ (Specialized for ads)
- **Use Case**: Ad copy generation

### 7.2 VidSynth

- **Mô tả**: Framework tạo video ads từ text
- **Tính năng**:
  - Text-to-video ads
  - Character consistency
  - Auto-resize cho platforms
- **Đánh giá**: ⭐⭐⭐⭐ (Platform-aware)
- **Use Case**: Multi-platform ad generation

---

## 🗄️ 8. DATABASE & BACKEND

### 8.1 Supabase

- **Mô tả**: Open source Firebase alternative
- **Tính năng**:
  - PostgreSQL database
  - Real-time subscriptions
  - Auth
  - Storage
- **GitHub**: https://github.com/supabase/supabase
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Rất tốt cho MVP)

### 8.2 FastAPI

- **Mô tả**: Modern Python web framework
- **Tính năng**:
  - Fast performance
  - Auto API docs
  - Async support
- **GitHub**: https://github.com/tiangolo/fastapi
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Perfect for API)

### 8.3 Celery

- **Mô tả**: Distributed task queue
- **Tính năng**:
  - Background jobs
  - Scheduled tasks
  - Distributed processing
- **GitHub**: https://github.com/celery/celery
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Standard for async tasks)

---

## 🧠 9. ML/LLM FRAMEWORKS

### 9.1 Hugging Face Transformers

- **Mô tả**: Pre-trained models library
- **Tính năng**:
  - Thousands of models
  - Easy fine-tuning
  - Model hub
- **GitHub**: https://github.com/huggingface/transformers
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Essential)

### 9.2 Ollama

- **Mô tả**: Run LLMs locally
- **Tính năng**:
  - Local LLM inference
  - Multiple models
  - API server
- **GitHub**: https://github.com/ollama/ollama
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Great for cost savings)

### 9.3 vLLM

- **Mô tả**: Fast LLM inference
- **Tính năng**:
  - High throughput
  - Continuous batching
  - OpenAI-compatible API
- **GitHub**: https://github.com/vllm-project/vllm
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Production-ready)

---

## 📝 10. DATA ANNOTATION

### 10.1 CVAT (Computer Vision Annotation Tool)

- **Mô tả**: Web-based annotation tool
- **Tính năng**:
  - Image annotation
  - Video annotation
  - Object detection
  - Segmentation
- **GitHub**: https://github.com/opencv/cvat
- **Đánh giá**: ⭐⭐⭐⭐⭐ (Professional tool)
- **Use Case**: Training data preparation

---

## 🎨 11. RECOMMENDED STACK CHO MVP

### Core Stack:

```
Backend:
- FastAPI (API server)
- Celery (Background jobs)
- PostgreSQL + Supabase (Database)
- Redis (Caching & Queue)

AI/ML:
- OpenV hoặc Waver (Video generation)
- Fooocus hoặc Stable Diffusion (Image generation)
- LangChain (Agent framework)
- Hugging Face Transformers (LLM models)
- Ollama hoặc vLLM (LLM inference)

Ad Platforms:
- facebook-business (Facebook/Instagram)
- google-ads-api (Google Ads)
- TikTok Ads API wrapper

Analytics:
- Robyn (Marketing mix modeling)
- Custom A/B testing với scipy.stats

Frontend:
- Next.js (React framework)
- Tailwind CSS (Styling)
```

### Architecture Layers:

```
┌─────────────────────────────────┐
│   Frontend (Next.js)            │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   API Gateway (FastAPI)         │
└──────────────┬──────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────┐    ┌────────▼──────┐
│ AI Agents  │    │ Video/Image    │
│ (LangChain)│    │ Generation     │
│            │    │ (OpenV/Waver)  │
└───┬────────┘    └────────┬───────┘
    │                     │
┌───▼─────────────────────▼────────┐
│   Task Queue (Celery)           │
└───┬─────────────────────────────┘
    │
┌───▼─────────────────────────────┐
│   Ad Platform APIs              │
│   (Facebook, Google, TikTok)    │
└──────────────────────────────────┘
```

---

## ✅ PRIORITY RANKING

### Must Have (MVP Core):

1. **FastAPI** - Backend API
2. **OpenV hoặc Waver** - Video generation
3. **LangChain** - Agent framework
4. **facebook-business SDK** - Facebook/Instagram ads
5. **Supabase** - Database & Auth
6. **Celery** - Background jobs

### Should Have (MVP+):

7. **Fooocus/Stable Diffusion** - Image generation
8. **Robyn** - Campaign optimization
9. **Ollama/vLLM** - Local LLM inference
10. **Next.js** - Frontend

### Nice to Have (Future):

11. **UniVA** - Advanced video processing
12. **Mora** - Sora alternative
13. **CVAT** - Data annotation
14. **TikTok/YouTube API wrappers**

---

## 🔗 USEFUL LINKS

- OpenV: https://openv.ai
- LangChain: https://github.com/langchain-ai/langchain
- FastAPI: https://fastapi.tiangolo.com
- Supabase: https://supabase.com
- Robyn: https://github.com/facebookexperimental/Robyn
- Hugging Face: https://huggingface.co

---

## 📌 NOTES

1. **Video Generation**: OpenV có vẻ là lựa chọn tốt nhất cho MVP vì có sẵn web UI và API
2. **Agent Framework**: LangChain là standard, dễ tích hợp
3. **Database**: Supabase cung cấp đầy đủ tính năng (DB + Auth + Storage)
4. **Ad APIs**: Facebook SDK là official và stable nhất
5. **Cost Optimization**: Dùng Ollama cho local LLM inference để giảm chi phí

---

_Last updated: 2025-2026_
