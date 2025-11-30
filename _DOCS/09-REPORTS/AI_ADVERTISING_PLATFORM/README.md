# Long Sang Portfolio & Platform

## 🌐 Project Overview

**Portfolio Website** với các tính năng AI Marketplace, Academy và Investment Portal.

**Production URL**: [https://lovable.dev/projects/1c78c058-532c-4f85-9cd5-a754c6ee895d](https://lovable.dev/projects/1c78c058-532c-4f85-9cd5-a754c6ee895d)

---

## 🗺️ Site Map (Routes)

| Route                                | Mô tả                  | Status           |
| ------------------------------------ | ---------------------- | ---------------- |
| `/`                                  | 🏠 Trang chủ Portfolio | ✅ Public        |
| `/cv`                                | 📄 Trang CV cá nhân    | ✅ Public        |
| `/pricing`                           | 💰 Bảng giá dịch vụ    | ✅ Public        |
| `/consultation`                      | 📅 Đặt lịch tư vấn     | ✅ Public        |
| `/project-showcase`                  | 🎨 Showcase các dự án  | ✅ Public        |
| `/project-showcase/:slug`            | 📱 Chi tiết dự án      | ✅ Public        |
| `/project-showcase/:slug/investment` | 💼 Investment Portal   | ✅ Public        |
| `/academy`                           | 🎓 Học viện AI Academy | ✅ Public        |
| `/academy/course/:id`                | 📚 Chi tiết khóa học   | ✅ Public        |
| `/marketplace`                       | 🤖 AI Marketplace      | ✅ Public        |
| `/marketplace/:agentId`              | 🔧 Chi tiết AI Agent   | ✅ Public        |
| `/dashboard`                         | 👤 User Dashboard      | 🔒 Cần đăng nhập |

---

## 🚀 Quick Start

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi động development server (Frontend + API)
npm run dev

# 3. Truy cập website
# Frontend: http://localhost:8080
# API: http://localhost:3001
```

---

## 🎮 Thử Nghiệm Ngay

### **1. Xem Portfolio**

Truy cập trang chủ để xem:

- Giới thiệu & dịch vụ
- Các dự án đã thực hiện
- Tech stack
- Thông tin liên hệ

### **2. AI Marketplace**

Truy cập `/marketplace` để:

- Khám phá các AI Agents
- Xem chi tiết & giá
- Kích hoạt agent (cần đăng nhập)

### **3. Academy**

Truy cập `/academy` để:

- Xem các khóa học
- Đăng ký học (cần đăng nhập)

### **4. Đăng nhập**

- Click "Đăng nhập" trên navigation
- Nhập email
- Check email nhận magic link
- Click link → Đã đăng nhập!

---

## 🚀 Deployment Commands

```bash
# Deploy everything (database + functions + build)
npm run deploy:all

# Deploy database only
npm run deploy:db

# Deploy Edge Functions only
npm run deploy:functions

# Check Supabase status
npm run supabase:status

# Link to Supabase project
npm run supabase:link
```

---

## 🔑 Environment Variables

Tạo file `.env` với các biến sau:

```env
# Supabase (Required)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI APIs (Optional - for real AI generation)
VITE_OPENAI_API_KEY=sk-your-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-key

# Email (Optional - for sending emails)
VITE_RESEND_API_KEY=re_your-key

# Social Media (Optional - for auto-posting)
VITE_LINKEDIN_ACCESS_TOKEN=your-token
VITE_FACEBOOK_ACCESS_TOKEN=your-token

# Google APIs (Optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 🛠️ Tech Stack

| Category     | Technologies                          |
| ------------ | ------------------------------------- |
| **Frontend** | React 18, TypeScript, Vite            |
| **UI**       | shadcn/ui, TailwindCSS, Framer Motion |
| **State**    | TanStack Query, React Context         |
| **Backend**  | Express.js, Supabase Edge Functions   |
| **Database** | PostgreSQL (Supabase)                 |
| **Auth**     | Supabase Auth (Magic Link)            |
| **AI**       | OpenAI GPT-4, Anthropic Claude        |
| **Testing**  | Vitest, Testing Library               |

---

## 📁 Project Structure

```
├── src/
│   ├── pages/           # Các trang chính
│   ├── components/      # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── auth/        # Authentication
│   │   ├── academy/     # Academy components
│   │   ├── agent-center/ # Marketplace components
│   │   └── sections/    # Homepage sections
│   ├── lib/             # Utilities & services
│   ├── hooks/           # Custom React hooks
│   └── integrations/    # Supabase client
├── api/                 # Express.js backend
│   ├── routes/          # API routes
│   └── config/          # Configuration
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
└── tests/               # Test files
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

---

## 📖 Development

### Local Development

```bash
# Frontend only
npm run dev:frontend

# API only
npm run dev:api

# Both (recommended)
npm run dev
```

### Code Quality

```bash
# Lint check
npm run lint

# Build check
npm run build
```

---

## 🔗 Useful Links

- [Lovable Project](https://lovable.dev/projects/1c78c058-532c-4f85-9cd5-a754c6ee895d)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [shadcn/ui Docs](https://ui.shadcn.com)

---

## 📝 License

Private project - All rights reserved.
