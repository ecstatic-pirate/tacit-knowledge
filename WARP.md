# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
- Install dependencies with your preferred package manager (examples use npm):
  - `npm install`
- Run the Next.js dev server:
  - `npm run dev`
  - Opens the app at `http://localhost:3000`.

### Build & production
- Type-check + build optimized production bundle:
  - `npm run build`
- Start the built app locally (after `npm run build`):
  - `npm run start`

### Linting
- Lint the entire project using the Next/ESLint config:
  - `npm run lint`
- Lint a specific file or directory (useful when iterating on a feature):
  - `npx eslint src/app/dashboard/page.tsx`
  - `npx eslint src/components/prepare`

### Tests
- There is currently no `test` script defined in `package.json` and no test runner config in this repo. Before relying on automated tests, add a test framework (e.g. Jest/Vitest/Playwright) and corresponding `"test"`/`"test:*"` scripts.

### Environment configuration
This app depends on a Supabase project for auth, data, and storage.

Create a `.env.local` file (not committed to git) with at least:

```env
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Public anon key for client & server
SUPABASE_SERVICE_ROLE_KEY=...       # Service key, used only on the server
```

Without these, any code that calls `createClient` / `createServerClient` in `src/lib/supabase` will throw and most pages will not load.

### Database and seed data
The actual Postgres schema and seed data live in Supabase, not in this repo, but important reference docs are:
- `docs/PHASE_1_IMPLEMENTATION.md` — full schema, RLS policies, and storage buckets.
- `DATABASE_STATUS.md` — current tables, seeded mock campaigns/sessions/skills, and example SQL to reset mock data.

When you need to adjust schema or seed data, follow the patterns in those docs and apply the SQL via the Supabase SQL editor or migrations in your Supabase project.


## High-level architecture

### Product flow
The app implements a linear expert-knowledge capture workflow, as defined in:
- `BUSINESS_LOGIC.md`
- `USER_FLOWS.md`
- `IMPLEMENTATION_PLAN.md`

The core phases are:
1. **Prepare** — create a campaign for a departing expert, upload documents, and let AI propose skills.
2. **Plan (Planner)** — schedule sessions and assign skills to each session.
3. **Capture** — run live interview sessions with recording, transcription, and AI guidance.
4. **Process & Output (Reports)** — turn sessions into transcripts, insights, reports, and a knowledge graph.
5. **Dashboard & Graph** — monitor campaign health, tasks, and explore the knowledge graph.

The UI mirrors this with top-level navigation items: **Campaigns (Dashboard)**, **Sessions (Planner)**, **Knowledge (Graph)**, **Reports**, plus a **Prepare** entry point for creating new campaigns.

### Next.js app structure
This is a Next.js App Router project (see `next.config.ts`, `tsconfig.json`). The main structure under `src/` is:

- `src/app/layout.tsx`
  - Global HTML shell.
  - Wraps the app in `AppProvider` (global Supabase-backed state) and `ToastProvider`.
  - Renders `TopNav` on all non-auth, non-fullscreen capture routes.

- `src/app/page.tsx`
  - Immediately redirects `/` to `/dashboard`.

- Route groups (each is a feature surface, wired into the same data model):
  - `src/app/login/page.tsx`, `src/app/signup/page.tsx`
    - Supabase email/password auth flows.
    - Signup collects `full_name` and `org_name` as user metadata and sends users through `/auth/callback`.
  - `src/app/dashboard/page.tsx`
    - Main "Campaigns" view.
    - Uses `useApp` for campaigns/tasks and `createClient` for additional Supabase queries.
    - Shows AI-style suggestions (locally computed from DB state) and surfaces tasks.
  - `src/app/prepare/page.tsx`
    - Campaign creation entry point.
    - Uses `addCampaign` from `AppProvider` to write to `campaigns` table, then coordinates AI suggestion acceptance and routes users to the planner.
  - `src/app/planner/page.tsx`
    - Session planning surface (drag/drop scheduling UI lives in `src/components/planner`).
  - `src/app/capture/page.tsx`
    - Lists upcoming/active sessions from the `sessions` table and routes to `/capture/[sessionId]` (dynamic session capture route planned in `IMPLEMENTATION_PLAN.md`).
  - `src/app/graph/page.tsx`
    - List-style "Captured Knowledge" view built directly from `graph_nodes`/`graph_edges`, grouped by expert.
  - `src/app/reports/page.tsx`
    - Report gallery and viewer, reading from `reports`, `campaigns`, and `sessions`.

- `src/middleware.ts` + `src/lib/supabase/middleware.ts`
  - Global middleware that:
    - Refreshes Supabase auth tokens on every request via `updateSession`.
    - Enforces auth on all non-static routes.
    - Redirects unauthenticated users to `/login?redirectTo=...`.
    - Redirects authenticated users away from `/login` and `/signup` back to `/dashboard`.

### State management & data access

- `src/context/app-context.tsx` (AppProvider)
  - The primary client-side state container for:
    - `user` (Supabase auth user),
    - `appUser` (row from `users` table),
    - `organization` (from `organizations`),
    - `campaigns` and `tasks` (from `campaigns`/`tasks`).
  - Responsible for:
    - Translating database rows into UI-friendly shapes (e.g. converting status enums from snake_case to kebab-case).
    - Keeping campaigns up to date (including derived `skillsCaptured` counts from `skills`).
    - Managing optimistic UI updates for tasks and campaign edits.
    - Providing CRUD methods (`addCampaign`, `updateCampaign`, `deleteCampaign`, `toggleTask`, `refreshData`).
  - All pages that need global domain data should prefer `useApp()` instead of rolling their own Supabase queries, unless they are fetching specialized data not exposed here.

- `src/lib/supabase/*`
  - `database.types.ts`
    - Generated Supabase types for all tables, functions, and convenience aliases like `Campaign`, `Session`, `Skill`, `GraphNode`, etc.
    - Use these types when adding queries to keep DB access safe and consistent.
  - `client.ts` / `server.ts` / `index.ts`
    - Single, centralized Supabase client factories for browser and server-side usage.
    - All Supabase interactions in this repo should go through these helpers to ensure auth cookies/env vars are handled correctly.
  - `middleware.ts`
    - Low-level function used by `src/middleware.ts` to keep sessions in sync and gate routes by auth status.

- `src/lib/hooks/*`
  - Encapsulate all non-trivial, feature-specific data access and logic:
    - `use-session.ts`
      - Drives a single capture session lifecycle using the `sessions` table and related `skills` and `campaigns` data.
      - Exposes methods like `startSession`, `pauseSession`, `resumeSession`, `endSession`, `updateNotes`, `addTopic`, and `markSkillCaptured`.
      - On session completion, triggers the `process-session` Supabase Edge Function via `supabase.functions.invoke`.
    - `use-dashboard-metrics.ts`
      - Aggregates cross-campaign counts for the dashboard (active campaigns, captured skills, upcoming sessions, graph node count).
    - `use-knowledge-graph.ts`
      - Provides a graph representation (`nodes`, `edges`) of `graph_nodes` and `graph_edges` for visualization.
      - Handles generating default positions for nodes and persisting drag/drop updates back to Supabase.
    - `use-documents.ts`
      - Manages document upload to Supabase Storage and metadata in the `documents` table.
      - Calls the `analyze-document` Edge Function to extract skills and writes back `extracted_skills`.
    - `use-media-capture.ts`
      - Manages browser media (camera + microphone) and browser-native speech recognition for live transcription.
      - Emits `TranscriptLine` objects that can be persisted later via Supabase.
    - `use-calendar.ts`
      - Integrates with the `calendar_connections` table and the `calendar-sync` Edge Function for Microsoft calendar OAuth and event creation/deletion.

  When adding new features, prefer extending these hooks or creating new hooks under `src/lib/hooks` instead of coupling components directly to Supabase.

### Components and feature modules

Components are organized by feature rather than by generic type:

- `src/components/layout/*`
  - `top-nav.tsx`: sticky navigation bar that reflects the high-level flow (Campaigns/Sessions/Knowledge/Reports) and exposes a "New Campaign" CTA.

- `src/components/tabs/*`
  - High-level tab components (`DashboardTab`, `PrepareTab`, `PlannerTab`, `CaptureTab`, `ReportsTab`) that act as feature shells for each main route, wiring together UI primitives and hooks.

- Domain-specific component bundles:
  - `src/components/prepare/*` — campaign creation form, AI suggestions UX, file upload integration.
  - `src/components/planner/*` — session scheduler, timeline, and planner sidebar.
  - `src/components/capture/*` — capture UI building blocks (AI coach panel, human guidance, session timer, etc.).
  - `src/components/dashboard/*` — campaign cards, task list, dashboard metrics, and AI suggestions banner.
  - `src/components/reports/*` — report cards, automated reports list, sharing configuration, skills map.
  - `src/components/visualizations/knowledge-graph-view.tsx` — interactive SVG-based knowledge graph visualization that consumes `useKnowledgeGraph`.
  - `src/components/ui/*` — shared UI primitives (buttons, cards, inputs, table, badge, etc.) built on Tailwind + Radix.

This structure is intentionally domain-oriented: when extending a feature, look first in its corresponding folder under `src/components` and its associated hook under `src/lib/hooks`.


## Supabase schema and domain model (overview)

For full details, see `docs/PHASE_1_IMPLEMENTATION.md` and `src/lib/supabase/database.types.ts`. The key domain areas are:

- **Workspace / tenancy**
  - `organizations` — tenant boundary; all other entities are scoped to an org.
  - `users` — app users, each belonging to a single org.

- **Core capture domain**
  - `campaigns` — one per expert; tracks high-level status, progress, and capture settings.
  - `sessions` — individual interview/capture events linked to a campaign; drive the live capture UI and processing pipeline.
  - `skills` — discrete knowledge areas; can be AI-detected or manually created, with `captured` flags and confidence scores.
  - `tasks` — system-generated action items derived from campaign/session state.
  - `reports` — generated artifacts (session summaries, skills progress, graph exports, etc.).
  - `documents` — uploaded source material for AI analysis.
  - `transcript_lines` and `captured_insights` — fine-grained transcripts and derived, durable insights.

- **Knowledge graph**
  - `graph_nodes` — nodes for skills, concepts, systems, processes, and core entities.
  - `graph_edges` — relationships between nodes (`requires`, `enables`, `related_to`, `part_of`).

- **Calendar integration**
  - `calendar_connections` — OAuth tokens and metadata for Microsoft (and eventually Google) calendars, used to create and manage events for sessions.

Row-Level Security (RLS) is enforced across these tables so that users only see data for their org; the concrete policies and patterns are documented in `docs/PHASE_1_IMPLEMENTATION.md`.


## Edge Functions and async processing

Several Supabase Edge Functions are expected by the frontend code and documented in `IMPLEMENTATION_PLAN.md`:

- `analyze-document` — processes uploaded documents and extracts skills.
- `calendar-sync` — handles Microsoft calendar OAuth and event CRUD.
- `process-session` — post-session processing: extract insights, map to skills, update confidence, and create reports/graph entries.
- Planned/extended functions (referred to in docs and hooks):
  - `session-guidance` — real-time AI coach for capture sessions.
  - `generate-report` — builds summary and analytics reports.
  - `build-graph` — auto-generates and updates the knowledge graph.
  - `dashboard-insights` — higher-level AI recommendations for the dashboard.

These functions run in your Supabase project (not in this repo). When changing their payloads or names, update both the Edge Function implementation and any call sites in `src/lib/hooks`.


## How to approach changes

- For **UI/UX changes within an existing phase** (e.g. tweaking the dashboard or capture UI), start from the corresponding `src/app/*/page.tsx` file, then follow imports into `src/components/*` and `src/lib/hooks/*`.
- For **new data fields or entities**, first update the Supabase schema (see `docs/PHASE_1_IMPLEMENTATION.md`), regenerate `database.types.ts`, and then thread the new fields through hooks and context rather than querying them ad hoc in components.
- For **new background processing** (reports, graph building, AI workflows), design the Edge Function contract first, then invoke it from hooks using `supabase.functions.invoke` in a similar fashion to `use-session` and `use-documents`.
