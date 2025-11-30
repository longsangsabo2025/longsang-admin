# 🎛️ LongSang Admin - Central Management System

> **"Quản lý tất cả dự án, AI agents, và automation từ một nơi duy nhất"**

---

## 👋 Chào Mừng

**LongSang Admin** là hệ thống quản trị trung tâm cho toàn bộ hệ sinh thái LongSang:
- 🤖 AI Command Center - Quản lý AI agents
- 📊 Analytics Dashboard - Theo dõi metrics
- 🔄 Automation Hub - n8n workflows
- 📁 Multi-project Management - Tất cả projects

---

## 🎯 Bạn Là Ai?

### 👔 Admin / Quản Lý
| Bạn cần | File tham khảo |
|---------|----------------|
| 🚀 Bắt đầu nhanh | `05-GUIDES/QUICK_REFERENCE.md` |
| 📊 Analytics | `02-FEATURES/AI_WORKSPACE_DASHBOARD_INTEGRATION.md` |
| 🔄 Automation | `02-FEATURES/AI_WORKSPACE_N8N_SETUP.md` |
| 📧 Email System | `02-FEATURES/EMAIL_SYSTEM_COMPLETE_PLAN.md` |

### 🔧 Developer
| Bạn cần | File tham khảo |
|---------|----------------|
| 🏗️ Architecture | `01-ARCHITECTURE/EMAIL_SYSTEM_COMPLETE_PLAN.md` |
| 📦 API Docs | `07-API/API_DOCUMENTATION.md` |
| 🚀 Deployment | `04-DEPLOYMENT/DEPLOYMENT_GUIDE.md` |
| 🐛 Troubleshooting | `03-OPERATIONS/TROUBLESHOOTING.md` |

### 🤖 AI/Automation Engineer
| Bạn cần | File tham khảo |
|---------|----------------|
| 🤖 AI Command Center | `02-FEATURES/AI_COMMAND_CENTER_COMPLETE.md` |
| 📝 Copilot Guide | `05-GUIDES/COPILOT_USER_GUIDE.md` |
| 🔄 Workflows | `05-GUIDES/WORKFLOW_EXAMPLE_DETAILED.md` |
| ⚙️ AI Platform Strategy | `06-AI/AI_PLATFORM_FOUNDER_STRATEGY.md` |

---

## 🌟 Core Features

### 1. 🤖 AI Command Center
- Unified AI interface cho tất cả agents
- Multi-provider support (OpenAI, Anthropic, Google)
- Custom agent creation & management

### 2. 📊 Analytics Dashboard
- Real-time metrics tracking
- Multi-project analytics
- Performance insights

### 3. 🔄 Automation Hub
- n8n workflow integration
- Scheduled tasks & triggers
- Cross-platform automation

### 4. 📁 Project Management
- Multi-project dashboard
- Credentials vault
- Agent assignments

### 5. 📧 Email System
- Multi-account management
- Campaign automation
- Anti-spam compliance

---

## 🚀 Quick Start

### Local Development
```bash
# Clone & setup
cd longsang-admin
npm install

# Start development
npm run dev

# Start API server
npm run api
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env với các credentials cần thiết
```

📖 **Chi tiết:** `04-DEPLOYMENT/ENV_KEYS_REFERENCE.md`

---

## 📊 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Express.js API |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Automation | n8n |
| Hosting | Vercel + Supabase |

---

## 📁 Documentation Structure

```
_DOCS/
├── 01-ARCHITECTURE/   ← System architecture (2 files)
├── 02-FEATURES/       ← Feature documentation (31 files)
├── 03-OPERATIONS/     ← Operations & fixes (4 files)
├── 04-DEPLOYMENT/     ← Deployment guides (5 files)
├── 05-GUIDES/         ← User guides (7 files)
├── 06-AI/             ← AI documentation (3 files)
├── 07-API/            ← API documentation (1 file)
├── 09-REPORTS/        ← Reports & summaries (14 files)
└── 00-START-HERE.md   ← This file
```

---

## 🔗 Related Projects

| Project | Description | Status |
|---------|-------------|--------|
| SABO Arena | Billiards tournament app | ✅ Production |
| SABOHUB | Business management app | ✅ Production |
| AI Secretary | Personal AI assistant | 🚧 Development |
| Music Video App | AI video generator | 🚧 Development |

---

## 📞 Support

| Resource | Link |
|----------|------|
| 📧 Email | admin@longsang.dev |
| 💬 Discord | discord.gg/longsang |
| 📚 Docs | `/admin/docs` |

---

**Last Updated:** 2025-01-14  
**Version:** 2.0.0  
**Status:** ✅ Production
