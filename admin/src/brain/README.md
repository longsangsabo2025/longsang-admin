# AI Second Brain Module

## Overview

AI Second Brain is a personal knowledge management system powered by AI. It
allows you to store, organize, and search your knowledge using semantic vector
search.

## Architecture

### Database Layer

- **pgvector**: PostgreSQL extension for vector similarity search
- **Tables**:
  - `brain_domains`: Knowledge categories/domains
  - `brain_knowledge`: Knowledge chunks with vector embeddings
  - `brain_core_logic`: Distilled knowledge (principles, rules, patterns)
  - `brain_memory`: Episodic, semantic, and procedural memories
  - `brain_query_history`: Query tracking for learning

### Backend API

- **Services**:
  - `embedding-service.js`: Generates embeddings using OpenAI
  - `retrieval-service.js`: Performs vector similarity search
  - `brain-service.js`: Main orchestrator for brain operations
- **Routes**:
  - `/api/brain/domains`: Domain CRUD operations
  - `/api/brain/knowledge/ingest`: Add new knowledge
  - `/api/brain/knowledge/search`: Search knowledge by text query

### Frontend

- **Components**:
  - `BrainDashboard`: Main dashboard with tabs
  - `DomainManager`: Domain CRUD interface
  - `KnowledgeIngestion`: Form to add knowledge
  - `KnowledgeSearch`: Search interface with results
- **Hooks**:
  - `useDomains`: Domain management hooks
  - `useKnowledge`: Knowledge search and ingestion hooks
- **Services**:
  - `brain-api.ts`: API client for brain endpoints

## Usage

### 1. Create a Domain

Domains are categories for organizing your knowledge. Each domain can contain
multiple knowledge items.

```typescript
import { useCreateDomain } from '@/brain/hooks/useDomains';

const createDomain = useCreateDomain();
await createDomain.mutateAsync({
  name: 'Business',
  description: 'Business-related knowledge',
  color: '#3B82F6',
  icon: 'briefcase',
});
```

### 2. Add Knowledge

Add knowledge to a domain. The system will automatically generate embeddings.

```typescript
import { useIngestKnowledge } from '@/brain/hooks/useKnowledge';

const ingestKnowledge = useIngestKnowledge();
await ingestKnowledge.mutateAsync({
  domainId: 'domain-uuid',
  title: 'Meeting Notes: Q4 Planning',
  content: 'We discussed the Q4 roadmap...',
  contentType: 'note',
  tags: ['meeting', 'planning'],
});
```

### 3. Search Knowledge

Search your knowledge base using natural language.

```typescript
import { useSearchKnowledge } from '@/brain/hooks/useKnowledge';

const { data: results } = useSearchKnowledge('What did we discuss about Q4?', {
  domainId: 'domain-uuid', // optional
  matchThreshold: 0.7,
  matchCount: 10,
});
```

## API Endpoints

### Domains

- `GET /api/brain/domains` - List all domains
- `POST /api/brain/domains` - Create domain
- `PUT /api/brain/domains/:id` - Update domain
- `DELETE /api/brain/domains/:id` - Delete domain

### Knowledge

- `POST /api/brain/knowledge/ingest` - Add knowledge
- `GET /api/brain/knowledge/search?q=query` - Search knowledge
- `GET /api/brain/knowledge/:id` - Get knowledge by ID

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for generating embeddings (uses
  `text-embedding-3-small` model - 1536 dimensions)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for RPC calls)

### Database Migrations

Run migrations in order:

1. `001_enable_pgvector.sql` - Enable pgvector extension
2. `002_brain_tables.sql` - Create brain tables
3. `003_vector_search_function.sql` - Create vector search function

## Features

- **Semantic Search**: Find knowledge using natural language queries
- **Domain Organization**: Organize knowledge into categories
- **Automatic Embeddings**: Embeddings generated automatically on ingestion
- **Vector Similarity**: Uses cosine similarity for relevance scoring
- **User Isolation**: RLS policies ensure users only see their own data

## Future Enhancements

- Core Logic distillation (Phase 3)
- Memory system with decay (Phase 5)
- Multi-domain query routing (Phase 4)
- Master Brain orchestrator (Phase 4)
- Knowledge graph integration

## Development

### Running Locally

1. Ensure Supabase is running and migrations are applied
2. Set environment variables
3. Start the API server: `npm run dev:api`
4. Start the frontend: `npm run dev:frontend`
5. Navigate to `/brain` in the browser

### Testing

- Test database migrations: `supabase db reset`
- Test API endpoints: Use Postman or curl
- Test frontend: Navigate to `/brain` and test all features

## Troubleshooting

### Embeddings not generating

- Check `OPENAI_API_KEY` is set
- Verify API key is valid
- Check API rate limits

### Search returns no results

- Verify knowledge has embeddings (check database)
- Lower the `matchThreshold` (default 0.7)
- Ensure domain filter is correct

### RLS errors

- Verify user is authenticated
- Check RLS policies are enabled
- Ensure `user_id` is set correctly

## License

MIT
