# Integration Architecture - AI Advertising MVP

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│  Next.js + Tailwind CSS + React                             │
│  - Campaign Dashboard                                       │
│  - Creative Preview                                         │
│  - Analytics Dashboard                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  FastAPI (Python)                                           │
│  - /api/campaigns                                            │
│  - /api/creatives                                            │
│  - /api/analytics                                            │
│  - /api/generate                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐
│  AI AGENTS   │ │  CREATIVE   │ │  AD      │
│  LAYER       │ │  GENERATION │ │  PLATFORM│
│              │ │  LAYER      │ │  LAYER   │
│ LangChain    │ │             │ │          │
│ - Campaign   │ │ OpenV       │ │ Facebook │
│   Manager    │ │ Waver       │ │ Google   │
│ - Optimizer  │ │ Fooocus     │ │ TikTok   │
│ - Analyzer   │ │ Stable Diff │ │          │
└───────┬──────┘ └─────┬──────┘ └────┬─────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              TASK QUEUE & WORKERS                            │
│  Celery + Redis                                             │
│  - Async video generation                                   │
│  - Campaign deployment                                      │
│  - Analytics processing                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              DATA LAYER                                      │
│  Supabase (PostgreSQL)                                      │
│  - Campaigns                                                │
│  - Creatives                                                │
│  - Performance metrics                                      │
│  - User data                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Integration Flow

### 1. Campaign Creation Flow

```
User Input (Product Info)
    │
    ▼
FastAPI Endpoint
    │
    ▼
LangChain Agent (Campaign Manager)
    ├─→ Analyzes product
    ├─→ Generates strategy
    └─→ Creates campaign plan
    │
    ▼
Creative Generation Pipeline
    ├─→ Text Generation (LLM via Ollama)
    ├─→ Image Generation (Fooocus/Stable Diffusion)
    └─→ Video Generation (OpenV/Waver)
    │
    ▼
Celery Task Queue
    ├─→ Process video (async)
    ├─→ Generate variants
    └─→ Store in Supabase
    │
    ▼
Ad Platform Integration
    ├─→ Facebook Ads API
    ├─→ Google Ads API
    └─→ TikTok Ads API
    │
    ▼
Campaign Deployed
    │
    ▼
Monitoring & Optimization
    ├─→ Robyn (Marketing Mix)
    └─→ A/B Testing
```

---

## 📦 Component Integration Details

### Component 1: FastAPI + LangChain Agent

**Purpose**: Campaign management agent

**Integration Points**:
- FastAPI endpoints trigger LangChain agents
- Agents use tools to call other services
- Results stored in Supabase

### Component 2: Video Generation Pipeline

**Purpose**: Generate video ads from product info

**Integration Points**:
- LangChain agent calls OpenV/Waver API
- Celery handles async processing
- Results stored in Supabase Storage

### Component 3: Ad Platform Integration

**Purpose**: Deploy campaigns to ad platforms

**Integration Points**:
- LangChain agent orchestrates deployment
- Uses official SDKs (facebook-business, google-ads-api)
- Tracks status in Supabase

### Component 4: Analytics & Optimization

**Purpose**: Monitor and optimize campaigns

**Integration Points**:
- Robyn analyzes performance
- A/B testing with scipy.stats
- Results feed back to LangChain optimizer agent

---

## 🔌 API Integration Patterns

### Pattern 1: Synchronous API Calls
- Fast response needed
- Simple operations
- Example: Text generation

### Pattern 2: Asynchronous Task Queue
- Long-running operations
- Video generation
- Campaign deployment
- Example: Celery tasks

### Pattern 3: Webhook/Event-Driven
- Real-time updates
- Platform callbacks
- Example: Ad platform webhooks

---

## 🗄️ Data Flow

### Campaign Data Flow:
```
User Input → FastAPI → LangChain Agent
    ↓
Campaign Plan → Supabase (Campaigns table)
    ↓
Creative Generation → Supabase (Creatives table)
    ↓
Ad Deployment → Supabase (Deployments table)
    ↓
Performance Data → Supabase (Metrics table)
    ↓
Analytics → Robyn → Optimization
    ↓
Updated Campaign → Supabase (Campaigns table)
```

---

## 🔐 Authentication & Authorization

- Supabase Auth for user management
- API keys for ad platforms (stored securely)
- JWT tokens for API authentication

---

## 📊 Monitoring & Logging

- FastAPI logging
- Celery task monitoring
- Supabase real-time subscriptions for updates
- Error tracking and alerting

