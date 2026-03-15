# GitHub Copilot Instructions — LongSang Admin

## Project Overview

LongSang Admin is an all-in-one AI-powered admin platform with 120+ pages, 85+ API routes, and 40+ feature modules. It manages AI agents, social media, video production, workflows, academy, and more.

## Codebase Map

```
admin/                        ← YOU ARE HERE
├── src/                      # React 18 + TypeScript frontend (ACTIVE)
│   ├── components/           # 40+ feature folders + ui/ (shadcn)
│   ├── pages/                # 120+ lazy-loaded pages
│   ├── hooks/                # 60+ custom hooks
│   ├── stores/               # Zustand (appStore, aiWorkspaceStore)
│   ├── services/             # Frontend API service classes
│   ├── brain/                # RAG knowledge system
│   ├── lib/                  # Utilities, Supabase client, AI integrations
│   └── types/                # TypeScript interfaces
│
├── api/                      # Express.js 4.18 backend (ACTIVE)
│   ├── routes/               # 85+ route files (1 per feature)
│   ├── services/             # 80+ business logic services
│   ├── middleware/            # auth, rateLimiter, validation, error-handler
│   ├── config/               # supabase.js, swagger.js
│   ├── routes/_deprecated/   # ⚠️ 23 DEAD files — NEVER reference
│   └── server.js             # Main entry, all route registrations
│
├── scripts/                  # 200+ utility scripts
├── mcp-server/               # Python MCP server
├── n8n-workflows/            # n8n automation exports
├── supabase/                 # DB migrations & edge functions
├── electron/                 # Desktop app
├── long-sang-forge/          # ⚠️ DEPRECATED — old project version, IGNORE
├── _DOCS/                    # Documentation
└── _archive/                 # Archived code
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript strict, Vite, shadcn/ui, TailwindCSS |
| State | Zustand v5 (UI), TanStack Query v5 (server), React Context (i18n only) |
| Backend | Express.js 4.18, CommonJS |
| Database | Supabase PostgreSQL 15 (project: diexsbzqwsbpilsymnfb) |
| AI | OpenAI (gpt-4o-mini/4o), Anthropic Claude, Google Gemini |
| Deployment | Vercel (frontend), Railway (API, PORT 10000), Electron (desktop) |

## Critical Rules

1. **Frontend = ESM** (`import/export`), **Backend = CommonJS** (`require/module.exports`)
2. **shadcn/ui** in `components/ui/` — DO NOT MODIFY these files
3. **`long-sang-forge/`** — DEPRECATED old version, never reference
4. **`api/routes/_deprecated/`** — 23 dead files, never import
5. **Two Supabase clients**: `src/lib/supabase.ts` (frontend), `api/config/supabase.js` (backend)
6. **API response format**: always `{ success: true/false, data/error }`
7. **Env vars**: frontend uses `VITE_*` prefix, backend uses plain names

## Code Patterns

### Frontend Component
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props { readonly title: string; }
export function MyComponent({ title }: Props) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader></Card>;
}
```

### Backend Route
```javascript
router.post('/endpoint', async (req, res) => {
  try {
    const result = await doSomething(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Supabase Query
```typescript
const { data, error } = await supabase.from('table').select('*').eq('column', value);
if (error) throw error;
```

## Naming Conventions

- Components: PascalCase (`UserProfile.tsx`)
- Hooks: `use` prefix (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Route files: kebab-case (`ai-workspace-chat.js`)

## Common Imports

```typescript
// Frontend
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores';
import { useQuery } from '@tanstack/react-query';

// Backend
const { supabase } = require('../config/supabase');
const { asyncHandler, AppError } = require('../middleware/error-handler');
```

## Detailed Instructions

- Frontend-specific rules: see `src/.instructions.md`
- Backend-specific rules: see `api/.instructions.md`
- Agent modes: see `.github/agents/*.agent.md`
- Reusable prompts: see `.vscode/prompts/*.prompt.md`
