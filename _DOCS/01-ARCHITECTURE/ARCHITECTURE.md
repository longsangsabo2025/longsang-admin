# LongSang Forge Architecture

## Overview

LongSang Forge is an AI-powered automation platform built with a modern, scalable architecture. This document outlines the system design, components, and data flow.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Browser   │  │    Mobile    │  │   Desktop    │       │
│  │   (React)   │  │   (Planned)  │  │  (Planned)   │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   UI     │  │  State   │  │  Hooks   │  │  Utils   │   │
│  │ Components│→│Management│→│  (Custom)│→│(Validation│   │
│  │(shadcn/ui)│  │  (React) │  │          │  │ Format)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Express)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │→│Middleware│→│Controllers│→│ Services │   │
│  │          │  │  (Auth,  │  │          │  │          │   │
│  │          │  │  CORS)   │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
┌─────────────────────────┐  ┌─────────────────────────┐
│   Database (Supabase)   │  │  External Services      │
│  ┌──────────────────┐   │  │  ┌──────────────────┐  │
│  │  PostgreSQL      │   │  │  │  OpenAI (GPT-4)  │  │
│  │  Row-Level       │   │  │  │  Anthropic       │  │
│  │  Security        │   │  │  │  (Claude)        │  │
│  └──────────────────┘   │  │  └──────────────────┘  │
│  ┌──────────────────┐   │  │  ┌──────────────────┐  │
│  │  Storage         │   │  │  │  Google APIs     │  │
│  │  (Files, Images) │   │  │  │  (Drive, Gmail,  │  │
│  └──────────────────┘   │  │  │   Calendar, etc.)│  │
│  ┌──────────────────┐   │  │  └──────────────────┘  │
│  │  Realtime        │   │  │  ┌──────────────────┐  │
│  │  (Websockets)    │   │  │  │  Social Media    │  │
│  └──────────────────┘   │  │  │  (LinkedIn, FB)  │  │
│                          │  │  └──────────────────┘  │
└─────────────────────────┘  └─────────────────────────┘
```

## Core Components

### 1. Frontend (React + Vite)

**Technology Stack:**

- React 18.3.1 with TypeScript
- Vite 5.4.21 for fast development
- TailwindCSS + shadcn/ui for styling
- TanStack Query for data fetching
- React Router for navigation

**Key Features:**

- Component-based architecture
- Type-safe development with TypeScript
- Responsive design (mobile-first)
- Progressive Web App (PWA) support
- Code splitting and lazy loading

**Directory Structure:**

```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── agent-center/    # Agent management components
│   ├── automation/      # Automation workflow components
│   ├── notifications/   # Notification system
│   └── settings/        # Settings and configuration
├── pages/
│   ├── Index.tsx        # Homepage
│   ├── AgentCenter.tsx  # Agent management
│   ├── Settings.tsx     # User settings
│   └── ...
├── hooks/
│   ├── use-auth.ts      # Authentication hook
│   ├── use-toast.ts     # Toast notifications
│   └── ...
├── lib/
│   ├── utils.ts         # Utility functions
│   ├── api.ts           # API client
│   └── validation.ts    # Input validation
└── integrations/
    └── supabase/        # Supabase client
```

### 2. Backend API (Express)

**Technology Stack:**

- Node.js 22.20.0
- Express.js
- Supabase Client
- Google APIs

**Key Services:**

```
api/
├── server.js            # Main server entry point
├── routes/
│   ├── agents.js        # AI agent endpoints
│   ├── automation.js    # Workflow automation
│   ├── google/          # Google API integrations
│   │   ├── drive.js
│   │   ├── gmail.js
│   │   ├── calendar.js
│   │   └── maps.js
│   └── seo.js          # SEO management
├── middleware/
│   ├── auth.js         # Authentication middleware
│   ├── cors.js         # CORS configuration
│   └── errorHandler.js # Global error handling
└── services/
    ├── ai/             # AI service integrations
    ├── email/          # Email services
    └── storage/        # File storage
```

### 3. Database (Supabase PostgreSQL)

**Schema Overview:**

```sql
-- Users and Authentication
users
  - id (uuid, primary key)
  - email (text)
  - created_at (timestamp)

profiles
  - id (uuid, references users)
  - full_name (text)
  - avatar_url (text)
  - updated_at (timestamp)

-- AI Agents
agents
  - id (uuid, primary key)
  - name (text)
  - description (text)
  - type (text)
  - config (jsonb)
  - user_id (uuid, references users)
  - created_at (timestamp)

agent_executions
  - id (uuid, primary key)
  - agent_id (uuid, references agents)
  - status (text)
  - input (jsonb)
  - output (jsonb)
  - executed_at (timestamp)

-- Automation Workflows
workflows
  - id (uuid, primary key)
  - name (text)
  - description (text)
  - steps (jsonb)
  - user_id (uuid, references users)
  - is_active (boolean)

workflow_executions
  - id (uuid, primary key)
  - workflow_id (uuid, references workflows)
  - status (text)
  - result (jsonb)
  - executed_at (timestamp)

-- Content Management
posts
  - id (uuid, primary key)
  - title (text)
  - content (text)
  - platform (text)
  - status (text)
  - user_id (uuid, references users)
  - scheduled_at (timestamp)

-- SEO Management
websites
  - id (uuid, primary key)
  - name (text)
  - url (text)
  - user_id (uuid, references users)

keywords
  - id (uuid, primary key)
  - website_id (uuid, references websites)
  - keyword (text)
  - rank (integer)
  - last_checked (timestamp)
```

**Row-Level Security (RLS):**

- All tables have RLS enabled
- Users can only access their own data
- Admin role for platform management

### 4. External Integrations

#### AI Services

- **OpenAI GPT-4**: Content generation, chat, analysis
- **Anthropic Claude**: Complex reasoning, long-context tasks

#### Google Services

- **Google Drive**: File storage and management
- **Gmail**: Email automation
- **Google Calendar**: Event scheduling
- **Google Maps**: Location services
- **Google Analytics**: Website analytics
- **Google Indexing**: SEO indexing

#### Social Media

- **LinkedIn**: Profile automation, post scheduling
- **Facebook**: Content publishing
- **Twitter** (planned): Tweet automation

#### Payment Gateways

- **Stripe**: Subscription management
- **VNPAY**: Vietnamese payment integration

## Data Flow

### 1. User Authentication Flow

```
User → Frontend → Supabase Auth → Database
  ↓
JWT Token
  ↓
Stored in localStorage
  ↓
Included in all API requests
```

### 2. AI Agent Execution Flow

```
1. User creates agent configuration
2. Frontend sends request to API
3. API validates and stores in database
4. Agent executor fetches configuration
5. Calls AI service (OpenAI/Claude)
6. Processes response
7. Stores result in database
8. Returns to user via websocket/polling
```

### 3. Content Publishing Flow

```
1. User creates content draft
2. AI enhancement (optional)
3. Schedule publishing
4. Background job picks up scheduled posts
5. Publishes to target platforms
6. Updates status in database
7. Sends notification to user
```

## Security

### Authentication & Authorization

- **JWT-based authentication** via Supabase
- **Row-Level Security (RLS)** in database
- **API key rotation** for external services
- **Environment variable** management

### Data Protection

- **Encrypted connections** (HTTPS/TLS)
- **Sensitive data encryption** at rest
- **Input validation** on all endpoints
- **Rate limiting** on API calls

### Best Practices

- Never commit secrets to Git
- Use `.env` for local development
- Store secrets in Vercel/Supabase dashboard
- Regular security audits

## Performance Optimization

### Frontend

- **Code splitting** with lazy loading
- **Image optimization** with WebP
- **Caching** with TanStack Query
- **Memoization** of expensive components
- **Bundle size optimization** (<500KB gzipped)

### Backend

- **Connection pooling** for database
- **Redis caching** (planned)
- **CDN** for static assets
- **Compression** (gzip/brotli)

### Database

- **Proper indexing** on frequently queried columns
- **Query optimization** with EXPLAIN ANALYZE
- **Pagination** for large datasets
- **Materialized views** for complex aggregations

## Deployment

### Production Environment

- **Frontend**: Vercel (edge network)
- **Backend API**: Vercel Serverless Functions
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network

### CI/CD Pipeline

```
Git Push → GitHub
  ↓
Automated Tests
  ↓
Build & Deploy (Vercel)
  ↓
Database Migration (Supabase)
  ↓
Health Check
  ↓
Production Live
```

## Monitoring & Logging

### Application Monitoring

- **Error tracking**: Sentry (planned)
- **Performance monitoring**: Web Vitals
- **User analytics**: Google Analytics

### Logging

- **Frontend**: Console with log levels
- **Backend**: Winston logger
- **Database**: Supabase logs

## Future Enhancements

### Planned Features

- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Marketplace for agents/workflows
- [ ] Multi-language support (i18n)

### Technical Improvements

- [ ] Redis caching layer
- [ ] GraphQL API
- [ ] Microservices architecture
- [ ] Event-driven architecture (message queue)
- [ ] Kubernetes orchestration

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Last Updated**: November 17, 2025
**Version**: 1.0.0
