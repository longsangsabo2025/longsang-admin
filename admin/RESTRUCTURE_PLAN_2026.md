# 🏗️ ADMIN CODEBASE RESTRUCTURE PLAN 2026

> **Tài liệu tham chiếu** cho tất cả agent. Cập nhật tiến độ trực tiếp vào file này.
> 
> **Ngày tạo**: 2026-03-15  
> **Workspace**: `apps/admin/src`  
> **Tech Stack**: React 18 + TypeScript + Vite + shadcn/ui + Supabase + TanStack Query

---

## 📊 Tổng Quan

| Metric | Trước | Mục tiêu | Hiện tại |
|--------|-------|----------|----------|
| App.tsx | 432 dòng | ~80 dòng | ✅ 92 |
| AdminLayout.tsx | 690 dòng | ~120 dòng | ✅ 74 |
| MissionControl.tsx | 1062 dòng | ~150 dòng | ✅ 92 |
| Flat files trong pages/ | 100+ | ~10 | ✅ 0 |
| Route files | 1 | 7 | ✅ 7 (6 .tsx + index.ts) |
| Dead page files | 3 | 0 | ✅ 0 |
| Supabase import paths | 2 | 1 | ✅ 1 (@/integrations/supabase/client) |
| Max file complexity | 1062 dòng | ~250 dòng | ✅ ~92 |

---

## 🔄 Thứ Tự Thực Hiện

```
Phase 1 (Dead Code)     ──→ Phase 2 (Routes) ──→ Phase 5 (Pages Reorg)
                          ↗                        ↗
Phase 3 (AdminLayout)  ──┘  (parallel)            │
Phase 4 (MissionControl) ──── (parallel) ─────────┘
Phase 6 (Supabase)      ──── (parallel with Phase 5)
```

---

## Phase 1: Dead Code Cleanup ✅
**Effort**: 5 phút | **Dependencies**: Không | **Risk**: Thấp

### Việc cần làm
- [x] Xóa `src/pages/AgentDashboard.tsx` (thay bằng AgentCenter)
- [x] Xóa `src/pages/AICostManagement.tsx` (thay bằng AICostDashboardPage)
- [x] Xóa `src/pages/SentryDashboard.tsx` (thay bằng BugSystemDashboard)
- [x] Xóa `src/pages/analytics/` (thư mục rỗng)
- [x] Xóa `src/pages/demo/` (thư mục rỗng)
- [x] ✅ Verify: `npx tsc --noEmit` → 0 errors

### Ghi chú
- `AdminProjects.tsx` — **KHÔNG XÓA** — đang dùng làm tab trong UnifiedAnalyticsDashboard
- 14 file absorbed khác (VisualWorkspace, FacebookMarketing...) — giữ vì đang dùng làm tab components

---

## Phase 2: Route Modularization ✅
**Effort**: 30 phút | **Dependencies**: Phase 1 | **Risk**: Trung bình

### Kiến trúc mới
```
src/routes/
├── index.ts              — barrel re-export
├── publicRoutes.tsx      — /portfolio, /pricing, /cv, /academy/*, /marketplace/*
├── adminRoutes.tsx       — /admin/* (60+ routes, lazy imports)
├── managerRoutes.tsx     — /manager/* (6 routes)
├── mobileRoutes.tsx      — /mobile/* (5 routes)
├── investmentRoutes.tsx  — /project-showcase/:slug/investment/* (nested)
└── legacyRedirects.tsx   — 35 <Navigate> redirect routes
```

### Việc cần làm
- [x] Tạo `src/routes/` directory
- [x] Tạo `publicRoutes.tsx` — 19 public routes + lazy imports
- [x] Tạo `adminRoutes.tsx` — 47 admin routes + lazy imports
- [x] Tạo `managerRoutes.tsx` — 7 manager routes
- [x] Tạo `mobileRoutes.tsx` — 5 mobile routes
- [x] Tạo `investmentRoutes.tsx` — nested investment layout routes
- [x] Tạo `legacyRedirects.tsx` — 13 Navigate redirects
- [x] Tạo `index.ts` barrel export
- [x] Refactor `App.tsx` → 104 dòng (providers + route composition)
- [x] ✅ Verify: `npx tsc --noEmit` → 0 errors

### Lưu ý quan trọng
- AdminRoute wrapper + AdminLayout phải ở App.tsx (parent route cho admin/*)
- ManagerRoute wrapper + ManagerLayout cũng vậy
- Mỗi route file export 1 component trả về `<><Route>...</Route></>` fragment
- Lazy imports nằm trong route file tương ứng, KHÔNG phải App.tsx

---

## Phase 3: AdminLayout Decomposition ✅
**Effort**: 30 phút | **Dependencies**: Phase 1 | **Risk**: Trung bình

### Kiến trúc mới
```
src/components/admin/
├── AdminLayout.tsx           — orchestrator (~120 dòng)
├── AdminHeader.tsx           — top bar: logo, project nav, actions (~80 dòng)
├── AdminSidebar.tsx          — nav groups, favorites, collapse (~250 dòng)
├── ProjectQuickNav.tsx       — project dropdown menu (~180 dòng)
└── admin-nav.config.ts       — navGroups + NAV_EMOJI data (~80 dòng)
```

### Việc cần làm
- [x] Tạo `admin-nav.config.ts` — 128 dòng: NAV_EMOJI, adminNavGroups, NavItem, NavGroup
- [x] Tạo `ProjectQuickNav.tsx` — 238 dòng: project DropdownMenu
- [x] Tạo `AdminHeader.tsx` — 103 dòng: top bar
- [x] Tạo `AdminSidebar.tsx` — 225 dòng: sidebar + nav rendering
- [x] Refactor `AdminLayout.tsx` → 84 dòng (88% reduction)
- [x] ✅ Verify: `npx tsc --noEmit` → 0 errors

### Lưu ý quan trọng
- AdminSidebar cần nhận props: `open`, `collapsed`, `onToggleCollapse`, `onClose`, `expandedGroups`, `setExpandedGroups`
- AdminHeader cần nhận: `sidebarOpen`, `onToggleSidebar`
- Quick Stats section hiện hardcoded (15, 4, 127) — giữ nguyên, optimize sau

---

## Phase 4: MissionControl Widget Extraction ✅
**Effort**: 45 phút | **Dependencies**: Phase 1 | **Risk**: Trung bình

### Kiến trúc mới
```
src/components/mission-control/
├── index.ts
├── mission-control.types.ts   — Product, AITool, N8nWorkflow types + constants
├── EcosystemHealth.tsx        — 6 product health cards
├── QuickActions.tsx           — YouTube/Shorts/Seed/Deploy triggers
├── AIToolsStack.tsx           — AI services + Agent Registry + Pipelines
├── AutomationRevenue.tsx      — Workflow cards + Revenue/Cost metrics
├── CalendarQueue.tsx          — Content calendar + Pipeline queue tables
└── RecentActivity.tsx         — Recent pipeline runs table
```

### Việc cần làm
- [x] Tạo `mission-control.types.ts` — types + PRODUCTS, AI_TOOLS, N8N_WORKFLOWS constants
- [x] Tạo `EcosystemHealth.tsx` — 6 product health cards
- [x] Tạo `QuickActions.tsx` — YouTube/Shorts/Seed/Deploy triggers
- [x] Tạo `AIToolsStack.tsx` — AI services + Agent Registry + Pipelines
- [x] Tạo `AutomationRevenue.tsx` — Workflow cards + Revenue/Cost metrics
- [x] Tạo `CalendarQueue.tsx` — Content calendar + Pipeline queue tables
- [x] Tạo `RecentActivity.tsx` — Recent pipeline runs table
- [x] Tạo `index.ts` barrel export
- [x] Refactor `MissionControl.tsx` → 106 dòng (90% reduction)
- [x] ✅ Verify: `npx tsc --noEmit` → 0 errors

### Data sources cần ghi nhớ
- Supabase tables: `pipeline_runs`, `ecosystem_health_logs`, `v_latest_health`, `v_content_calendar_upcoming`, `pipeline_queue`, `agent_registry`
- Realtime subscriptions: `pipeline_runs`, `ecosystem_health_logs`
- Polling intervals: 30s (pipelines, costs, queue), 60s (health, agents), 5min (calendar)

---

## Phase 5: Pages Domain Reorganization ✅
**Effort**: 1-2 giờ | **Dependencies**: Phase 2 | **Risk**: Cao (nhiều import path changes)

### Cấu trúc mới
```
src/pages/
├── academy/         — 9 files (Academy, Category, Certificates, Leaderboard, MyLearning, Stats, CourseBuilder, CourseDetail, LearningPath)
├── admin-core/      — 10 files (Dashboard, Settings, Users, Backup, Login, SettingsPage, DevSetup, SupabaseTest, DatabaseSchema, FeatureAudit)
├── ai/              — 9 files (AIWorkspace, UnifiedAICommandCenter, AISettings, AICostDashboardPage, GeminiChatPage, BrainDashboard, DomainView, KnowledgeBaseEditor, WorkspaceChatPage)
├── content/         — 7+ files (ContentQueue, DocumentEditor, Ideas, Courses, ContentRepurpose, DocsManager, DocsViewer, FileManagerReal, UnifiedLibrary)
│   └── unified-library/  — (existing, moved from pages/)
├── investment/      — 5 files (Layout, Overview, Roadmap, Financials, Apply)
├── marketing/       — 14 files (SocialMedia*, Marketing*, Brand*, Analytics, Google*, Facebook*, Zalo*)
│   └── social-connections/  — (existing, moved from pages/)
├── mobile/          — (giữ nguyên) 5 files
├── projects/        — 10 files (UnifiedProjectCenter, ProjectCommandCenter, ProjectDetail, Interest, Showcase*, AdminProjects)
├── public/          — 7 files (Index, Pricing, CVPage, UserDashboard, ConsultationBooking, PaymentSuccess, NotFound)
│   └── cv/          — (existing, moved from pages/)
├── system/          — 10 files (MissionControl, SystemMap, ServicesHealth, Heartbeat, Travis, BugSystem, Revenue, Survival, PlatformIntegrations, CredentialManager)
│   └── survival-dashboard/  — (existing)
│   └── system-map/          — (existing)
├── video/           — 12 files (VideoFactory, PipelineBuilder, YouTubeChannels, YouTubeChannelWorkspace, VideoGenerator, ImageGenerator, Sora*, Bulk*, AvatarStudio, VideoComposer, Pipeline*, Studio)
│   └── video-factory/  — (existing)
│   └── studio/         — (existing)
├── workflow/        — 10 files (AdminWorkflows, N8n, WorkflowManager, WorkflowImport, WorkflowTest, AutomationDashboard, AgentCenter, AgentDetail*, AgentRegistry, AgentTest)
└── manager/         — 4 files (Dashboard, Projects, Library, Login)
```

### Việc cần làm
- [x] Tạo 12 subdirectories
- [x] Di chuyển 119 files vào domain subfolders
- [x] Di chuyển 7 existing subdirs vào domain cha (social-connections → marketing/, cv → public/, etc.)
- [x] Cập nhật 79 lazy import paths trong route files
- [x] Cập nhật cross-page imports (ManagerLibrary → UnifiedLibrary)
- [x] ✅ Verify: `npx tsc --noEmit` → 0 errors, `npx vite build` → OK

### Quy tắc di chuyển
1. Move file → update barrel index.ts → update route import → tsc check
2. Nếu file được import bởi component khác (không chỉ route), phải update ref đó trước
3. Existing subdirectories (social-connections/, survival-dashboard/, etc.) move nguyên thư mục

---

## Phase 6: Supabase Import Standardization ✅
**Effort**: 30 phút | **Dependencies**: Không | **Risk**: Thấp

### Standard path: `@/integrations/supabase/client`

### Việc cần làm
- [x] Tìm và migrate 45 files (2 core + 43 consumers)
- [x] Replace tất cả → `from '@/integrations/supabase/client'`
- [x] Cập nhật `@/lib/supabase.ts` → re-export shim (backwards compatibility)
- [x] ✅ Verify: `npx tsc --noEmit` → 0 errors

---

## 📝 Log Tiến Độ

| Ngày | Phase | Hành động | Kết quả | Agent |
|------|-------|-----------|---------|-------|
| 2026-03-15 | - | Tạo plan & reference doc | ✅ | Copilot Plan |
| 2026-03-15 | 1 | Xóa 3 dead pages + 2 empty dirs | ✅ 0 tsc errors | Copilot Main |
| 2026-03-15 | 2 | Tạo 7 route files, App.tsx 462→104 dòng | ✅ 0 tsc errors | Sub-agent |
| 2026-03-15 | 3 | Tạo 4 components, AdminLayout 717→84 dòng | ✅ 0 tsc errors | Sub-agent |
| 2026-03-15 | 4 | Tạo 8 widgets, MissionControl 1062→106 dòng | ✅ 0 tsc errors | Sub-agent |
| 2026-03-15 | 6 | Migrate 45 files supabase imports | ✅ 0 tsc errors | Sub-agent |
| 2026-03-15 | - | Combined tsc check (Phases 1-4,6) | ✅ 0 errors | Copilot Main |
| 2026-03-15 | 5 | Di chuyển 119 files + 7 subdirs, update 79 imports | ✅ 0 tsc errors | Sub-agent |
| 2026-03-15 | - | Final vite build verification | ✅ built in 11s | Copilot Main |
| 2026-03-15 | 5,6 | Final cleanup: moved 2 last flat files, fixed 4 broken imports, renamed .ts→.tsx, updated 5 supabase imports | ✅ tsc 0 + vite OK | Copilot Main |

---

## ⚠️ Quy Tắc Cho Agent Thực Thi

1. **LUÔN chạy `npx tsc --noEmit` sau mỗi phase** — không merge nếu có lỗi
2. **LUÔN chạy `npx vite build --mode development` sau mỗi phase** — đảm bảo bundle OK
3. **Cập nhật tiến độ vào bảng Log** sau khi hoàn thành mỗi task
4. **Cập nhật cột "Hiện tại" trong bảng Tổng Quan** khi metric thay đổi
5. **Tick checkbox** `[x]` khi hoàn thành từng việc
6. **Nếu gặp lỗi** — ghi vào Log, KHÔNG skip, phải fix trước khi tiếp tục
7. **Phase 5 là rủi ro cao nhất** — làm từng batch, verify thường xuyên
8. **KHÔNG refactor code logic** — chỉ di chuyển/tách file, giữ nguyên behavior

---

## 🔗 Files Tham Chiếu Chính

| File | Vai trò | Phase |
|------|---------|-------|
| `src/App.tsx` | Route orchestrator — tách thành ~80 dòng | Phase 2 |
| `src/components/admin/AdminLayout.tsx` | Layout chính — tách 5 file | Phase 3 |
| `src/pages/MissionControl.tsx` | Dashboard chính — extract 6 widgets | Phase 4 |
| `src/hooks/index.ts` | Barrel export pattern mẫu | Reference |
| `src/stores/index.ts` | Barrel export pattern mẫu | Reference |
| `src/pages/mobile/index.ts` | Pages barrel export pattern mẫu | Reference |
