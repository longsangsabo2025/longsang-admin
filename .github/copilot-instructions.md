# GitHub Copilot Instructions for LongSang Forge

## Project Context

LongSang Forge is an AI-powered automation platform built with React 18, TypeScript, Vite, and Supabase.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL), n8n workflows
- **AI**: OpenAI GPT-4, Anthropic Claude
- **APIs**: LinkedIn, Facebook, Resend/SendGrid

## Code Style Guidelines

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use shadcn/ui components for UI
- Follow React best practices (memo, useCallback, useMemo)
- Use TanStack Query for data fetching
- Implement proper error boundaries

## File Organization

- Components: `/src/components/{feature}/{ComponentName}.tsx`
- Pages: `/src/pages/{PageName}.tsx`
- Hooks: `/src/hooks/use{HookName}.ts`
- Utils: `/src/lib/{utilName}.ts`
- Types: `/src/types/{featureName}.ts`

## Naming Conventions

- Components: PascalCase (e.g., `UserProfile.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- Utils: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

## Best Practices

- Always add TypeScript types
- Include JSDoc comments for complex functions
- Add error handling with try-catch
- Use environment variables for sensitive data
- Implement loading and error states
- Add accessibility attributes (ARIA)
- Write unit tests for utilities and hooks

## AI Integration

- Use OpenAI for content generation
- Use Claude for complex analysis
- Implement rate limiting and error retry
- Cache AI responses when possible

## Supabase Patterns

```typescript
// Use typed queries
const { data, error } = await supabase.from("table_name").select("*").eq("column", value).single();

// Handle errors properly
if (error) {
  console.error("Error:", error);
  throw new Error(error.message);
}
```

## Common Imports

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
```
