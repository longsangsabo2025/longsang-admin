# AI Second Brain - Phase 4: Multi-Domain Orchestration & Master Brain

## Mục tiêu
Implement Multi-Domain Query Routing và Master Brain Orchestrator để:
- Query across multiple domains simultaneously
- Intelligent domain selection và routing
- Master Brain orchestrator cho complex queries
- Advanced RAG với multi-domain context
- Knowledge graph integration

## Database Enhancements

### 1. Cross-Domain Knowledge Graph
**File:** `supabase/migrations/brain/008_knowledge_graph.sql`
- `brain_knowledge_graph` table để track relationships
- Node và edge tables
- Graph traversal functions
- Similarity scoring across domains

### 2. Query Routing Metadata
**File:** `supabase/migrations/brain/009_query_routing.sql`
- `brain_query_routing` table để track routing decisions
- Domain relevance scoring
- Routing history và learning
- Performance metrics

### 3. Master Brain State
**File:** `supabase/migrations/brain/010_master_brain_state.sql`
- `brain_master_state` table để track orchestrator state
- Conversation context
- Multi-domain session management
- Context persistence

## Backend Services

### 4. Multi-Domain Query Router
**File:** `api/brain/services/multi-domain-router.js`
- `routeQuery(query, userId)` - Route query to relevant domains
- `selectDomains(query, userId)` - Select best domains for query
- `scoreDomainRelevance(query, domainId)` - Score domain relevance
- `combineResults(results)` - Combine results from multiple domains

### 5. Master Brain Orchestrator
**File:** `api/brain/services/master-brain-orchestrator.js`
- `orchestrateQuery(query, options)` - Main orchestration function
- `gatherContext(domains)` - Gather context from multiple domains
- `synthesizeResponse(context, query)` - Synthesize final response
- `manageSession(sessionId)` - Manage multi-domain sessions

### 6. Knowledge Graph Service
**File:** `api/brain/services/knowledge-graph-service.js`
- `buildGraph(domainIds)` - Build knowledge graph
- `findPaths(node1, node2)` - Find paths between nodes
- `getRelatedConcepts(concept)` - Get related concepts
- `traverseGraph(startNode, depth)` - Traverse graph

### 7. Advanced RAG Service
**File:** `api/brain/services/advanced-rag-service.js`
- `hybridSearch(query, domains)` - Hybrid search across domains
- `rerankResults(results)` - Rerank results with LLM
- `extractContext(results)` - Extract relevant context
- `generateResponse(context, query)` - Generate final response

## Backend Routes

### 8. Multi-Domain Routes
**File:** `api/brain/routes/multi-domain.js`
- `POST /api/brain/query` - Query across multiple domains
- `POST /api/brain/route` - Route query to domains
- `GET /api/brain/domains/relevant` - Get relevant domains for query
- `POST /api/brain/synthesize` - Synthesize multi-domain response

### 9. Master Brain Routes
**File:** `api/brain/routes/master-brain.js`
- `POST /api/brain/master/query` - Master brain query
- `POST /api/brain/master/session` - Create/update session
- `GET /api/brain/master/session/:id` - Get session state
- `POST /api/brain/master/context` - Update context

### 10. Knowledge Graph Routes
**File:** `api/brain/routes/knowledge-graph.js`
- `POST /api/brain/graph/build` - Build knowledge graph
- `GET /api/brain/graph/paths` - Find paths between concepts
- `GET /api/brain/graph/related` - Get related concepts
- `POST /api/brain/graph/traverse` - Traverse graph

## Frontend Types

### 11. Multi-Domain Types
**File:** `src/brain/types/multi-domain.types.ts`
- `MultiDomainQuery` - Query across domains
- `DomainRelevance` - Domain relevance scoring
- `RoutingDecision` - Routing decision data
- `SynthesizedResponse` - Multi-domain response

### 12. Master Brain Types
**File:** `src/brain/types/master-brain.types.ts`
- `MasterBrainSession` - Session state
- `OrchestrationContext` - Orchestration context
- `MultiDomainContext` - Multi-domain context
- `SynthesisResult` - Synthesis result

### 13. Knowledge Graph Types
**File:** `src/brain/types/knowledge-graph.types.ts`
- `KnowledgeNode` - Graph node
- `KnowledgeEdge` - Graph edge
- `GraphPath` - Path between nodes
- `GraphTraversal` - Traversal result

## Frontend Hooks

### 14. Multi-Domain Hooks
**File:** `src/brain/hooks/useMultiDomain.ts`
- `useMultiDomainQuery()` - Query across domains
- `useRouteQuery()` - Route query
- `useRelevantDomains()` - Get relevant domains
- `useSynthesizeResponse()` - Synthesize response

### 15. Master Brain Hooks
**File:** `src/brain/hooks/useMasterBrain.ts`
- `useMasterBrainQuery()` - Master brain query
- `useMasterBrainSession()` - Manage session
- `useOrchestrationContext()` - Get context
- `useUpdateContext()` - Update context

### 16. Knowledge Graph Hooks
**File:** `src/brain/hooks/useKnowledgeGraph.ts`
- `useBuildGraph()` - Build graph
- `useFindPaths()` - Find paths
- `useRelatedConcepts()` - Get related concepts
- `useTraverseGraph()` - Traverse graph

## Frontend Components

### 17. Multi-Domain Query Component
**File:** `src/brain/components/MultiDomainQuery.tsx`
- Query interface cho multi-domain
- Domain selection UI
- Results display với domain tags
- Synthesis view

### 18. Master Brain Interface
**File:** `src/brain/components/MasterBrainInterface.tsx`
- Main interface cho Master Brain
- Session management
- Context display
- Conversation history

### 19. Knowledge Graph Visualizer
**File:** `src/brain/components/KnowledgeGraphVisualizer.tsx`
- Graph visualization (D3.js hoặc vis.js)
- Interactive node/edge exploration
- Path highlighting
- Concept relationships

### 20. Domain Router Component
**File:** `src/brain/components/DomainRouter.tsx`
- Visual routing display
- Domain relevance scores
- Routing history
- Performance metrics

### 21. Advanced RAG Results
**File:** `src/brain/components/AdvancedRAGResults.tsx`
- Display hybrid search results
- Reranking indicators
- Context extraction view
- Source attribution

### 22. Enhanced Brain Dashboard
**File:** `src/pages/BrainDashboard.tsx` (Update)
- Add Master Brain tab
- Multi-domain query interface
- Knowledge graph access
- Cross-domain insights

## Integration

### 23. Update API Client
**File:** `src/brain/lib/services/brain-api.ts` (Update)
- Add multi-domain methods
- Add master brain methods
- Add knowledge graph methods
- Add advanced RAG methods

### 24. Update Server Routes
**File:** `api/server.js` (Update)
- Register multi-domain routes
- Register master brain routes
- Register knowledge graph routes

## Background Processing

### 25. Graph Builder Worker
**File:** `api/brain/workers/graph-builder-worker.js`
- Background graph building
- Incremental updates
- Relationship discovery
- Graph optimization

### 26. Routing Learner
**File:** `api/brain/jobs/routing-learner.js`
- Learn from routing decisions
- Improve domain selection
- Update relevance scores
- Performance optimization

## Testing

### 27. Test Multi-Domain Query
- Test query routing
- Test domain selection
- Test result combination
- Test synthesis

### 28. Test Master Brain
- Test orchestration
- Test session management
- Test context gathering
- Test response synthesis

### 29. Test Knowledge Graph
- Test graph building
- Test path finding
- Test traversal
- Test relationship discovery

## Documentation

### 30. Update README
**File:** `src/brain/README.md` (Update)
- Add Phase 4 features
- Add multi-domain usage
- Add master brain guide
- Add knowledge graph docs

## Implementation Order

1. **Database** (Steps 1-3)
   - Knowledge graph tables
   - Query routing tables
   - Master brain state

2. **Backend Services** (Steps 4-7)
   - Multi-domain router
   - Master brain orchestrator
   - Knowledge graph service
   - Advanced RAG service

3. **Backend Routes** (Steps 8-10)
   - Multi-domain routes
   - Master brain routes
   - Knowledge graph routes

4. **Frontend Types & Hooks** (Steps 11-16)
   - Types
   - Hooks

5. **Frontend Components** (Steps 17-22)
   - Multi-domain UI
   - Master brain interface
   - Graph visualizer
   - Enhanced dashboard

6. **Integration** (Steps 23-24)
   - Update API client
   - Update server routes

7. **Background Processing** (Steps 25-26)
   - Graph builder
   - Routing learner

8. **Testing** (Steps 27-29)
   - Test all features

9. **Documentation** (Step 30)
   - Update docs

## Success Criteria

- [ ] Queries can route across multiple domains
- [ ] Master Brain orchestrates complex queries
- [ ] Knowledge graph shows relationships
- [ ] Advanced RAG provides better results
- [ ] Multi-domain synthesis works
- [ ] Session management functional
- [ ] Graph visualization interactive
- [ ] Routing improves over time

## Estimated Time

- Database setup: 4-5 hours
- Backend services: 12-15 hours
- Backend routes: 5-6 hours
- Frontend types & hooks: 4-5 hours
- Frontend components: 15-20 hours
- Integration: 3-4 hours
- Background processing: 5-6 hours
- Testing: 6-8 hours
- Documentation: 2-3 hours
- **Total: 56-72 hours** (7-9 days)

## Key Features

1. **Multi-Domain Query** - Query across all domains simultaneously
2. **Intelligent Routing** - AI-powered domain selection
3. **Master Brain** - Central orchestrator for complex queries
4. **Knowledge Graph** - Visual representation of relationships
5. **Advanced RAG** - Hybrid search với LLM reranking
6. **Session Management** - Persistent context across queries
7. **Graph Visualization** - Interactive knowledge graph
8. **Learning System** - Routing improves over time

