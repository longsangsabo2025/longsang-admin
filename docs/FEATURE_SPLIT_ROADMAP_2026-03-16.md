# Feature Split Roadmap (2026-03-16)

## Goal
Split major domains from the current monorepo into independent vertical repositories/services, while keeping a small platform core for shared concerns.

## Current Architecture Signals
- Frontend routes are already grouped by domain in route modules:
  - `adminRoutes`, `publicRoutes`, `managerRoutes`, `mobileRoutes`, `investmentRoutes`.
- Multiple backend services already exist under `services/` with separate `package.json`.
- Several services expose their own health and domain APIs, which is a strong split signal.

## Strong Candidates (by split readiness)

### Wave 1 (Low risk, high readiness)
1. `gemini-image` service
- Why now: clear standalone API (`/api/gemini/image*`), own package, own Dockerfile, own health endpoint.
- Main work: extract CI/CD + env docs + API contract.

2. `veo-video` service
- Why now: clear standalone API (`/api/veo/*`), own package, low coupling to monorepo internals.
- Main work: extract CI/CD + model key management + rate limits.

### Wave 2 (Medium risk)
3. `ai-assistant` service
- Why next: standalone service shape is good, but likely consumed by multiple pages/features and needs stronger auth/tenant boundary.
- Main work: standard auth middleware, request metering, model policy config.

4. `workflow/n8n` domain (admin workflow pages + n8n integration)
- Why next: domain is explicit in UI and API calls, but currently mixed with system/admin tooling.
- Main work: define dedicated API surface and move orchestration logic out of admin shell.

### Wave 3 (Higher coupling)
5. `brain-rag` service
- Why later: currently has fallback dependency on `../../api/services/brainRAG`, so not fully isolated yet.
- Main work: remove internal require to monorepo API module, keep only external adapter interface.

6. Marketing/Social domain (`facebook`, `instagram`, `threads`, `zalo-*`, auto publish)
- Why later: many integrations and credential lifecycles; requires unified secret and webhook strategy first.
- Main work: connector abstraction + per-platform retry/idempotency + token rotation jobs.

## Suggested Target Repos
1. `longsang-image-studio` (gemini-image)
2. `longsang-video-gen` (veo-video)
3. `longsang-ai-assistant` (ai-assistant)
4. `longsang-workflow-hub` (n8n/workflow)
5. `longsang-brain-rag` (brain-rag, after decoupling)
6. `longsang-social-hub` (social connectors)

## Platform Core to Keep Shared
Keep these capabilities in a platform-core layer that all vertical repos consume via HTTP contracts:
- AuthN/AuthZ (API key/JWT + tenant context)
- Secret/config policy
- Telemetry (logs, traces, metrics)
- Audit events
- Shared identity/profile primitives

## Contract-First Rules For Every Extraction
1. Publish `service-manifest.json` with identity, endpoints, dependencies, and ownership.
2. Add `docs/SERVICE_CONTEXT.md` and `docs/PLATFORM_INTEGRATION.md`.
3. Add `GET /health` and one lightweight readiness endpoint.
4. Lock one public API prefix per service (no mixed domain paths).
5. Add a migration compatibility window (temporary proxy in old admin).

## 14-Day Execution Plan
Day 1-2:
- Extract `gemini-image` to new repo and deploy.
- Keep old monorepo route as proxy to new service URL.

Day 3-4:
- Extract `veo-video` and deploy.
- Add unified media API gateway mapping in admin config.

Day 5-7:
- Extract `ai-assistant` with auth + quota middleware.
- Add environment profiles: local/staging/prod.

Day 8-10:
- Split workflow/n8n domain.
- Isolate workflow execution APIs from admin page logic.

Day 11-14:
- Decouple `brain-rag` internal import and then extract.
- Harden contracts and remove temporary proxies.

## Risk Register
- Coupling risk: hidden imports to monorepo modules (already observed in `brain-rag`).
- Secret sprawl: hardcoded localhost and direct third-party calls in frontend/service code.
- Contract drift: no strict versioning between admin and extracted services.

## Immediate Next Implementation Step
Start Wave 1 with `gemini-image` extraction first, because it has:
- clear API boundary,
- own Dockerfile,
- own env example,
- low dependency on admin internals.
