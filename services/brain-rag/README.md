# Brain RAG Service (Standalone)

Standalone RAG microservice for Brain domain.

## What This Service Owns

- `POST /api/brain/rag/search`
- `POST /api/brain/rag/context`
- `POST /api/brain/rag/chat`
- `POST /api/brain/rag/smart-chat`
- `POST /api/brain/rag/check-relevance`
- `GET /api/brain/rag/health`
- `GET /api/brain/status`
- `GET /health`

## Local Run

```bash
npm install
cp .env.example .env
npm run dev
```

Default port: `3012`

## Monorepo Integration

In `api/.env` (or runtime env), set:

```bash
BRAIN_RAG_SERVICE_URL=http://localhost:3012
```

When set, monorepo endpoint `/api/brain/rag/*` forwards core RAG calls to this service.
If unavailable, monorepo falls back to the legacy in-process implementation.

## Extraction Note

This service now uses local core module `lib/standalone-brain-rag.js` and no longer imports `../../api/services/brainRAG`.
