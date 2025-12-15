# Tacit Knowledge Platform — Implementation Plan

> **Created**: December 15, 2025
> **Status**: Phase 1 ✅ | Phase 2 ✅ | Phase 3-5 🔄 In Progress
> **Principle**: NO MOCKS — Everything must be fully functional with real data and real AI.

---

## Completed Work

### ✅ Phase 1: Foundation (Data Layer)
- Database schema (10 tables with RLS policies)
- Supabase Auth integration
- Storage buckets (documents, recordings, reports)
- TypeScript types generation
- Next.js middleware for protected routes

### ✅ Phase 2: Core Workflow (Prepare → Plan)
- Campaign creation form with capture mode selector
- Document upload with Supabase Storage
- AI document analysis (GPT-5-mini via Responses API)
- AI suggestions engine
- Session scheduler component
- Calendar integration UI (pending Microsoft credentials)

---

## Remaining Implementation

### 🔵 Phase 3: Live Capture Engine

**Goal**: Enable real-time interview sessions with AI assistance.
**Principle**: All AI features use real GPT-5-mini calls. All data persists to Supabase.

#### 3.1 Session State Management
- [ ] Create session status flow: `scheduled` → `in_progress` → `completed`
- [ ] Session timer and duration tracking (real timestamps in DB)
- [ ] Auto-save session notes to Supabase (debounced)
- [ ] Real-time session data sync

#### 3.2 Capture Interface
- [ ] Full-screen capture mode layout
- [ ] Session info header (real data: expert name, session #, topic from DB)
- [ ] Notes/transcript panel (persisted to `sessions.notes`)
- [ ] AI guidance panel (real GPT-5-mini calls)

#### 3.3 AI Coach Panel (Real AI)
- [ ] Edge Function: `session-guidance` — generates real-time suggestions
- [ ] Display context from campaign goal + skills
- [ ] Generate suggested questions via GPT-5-mini
- [ ] Track skill coverage (update `skills.captured` in real-time)
- [ ] Detect when skills are mentioned in notes

#### 3.4 Session Controls
- [ ] Start → updates `sessions.started_at`, status to `in_progress`
- [ ] Pause/Resume → track in session metadata
- [ ] End → updates `sessions.ended_at`, status to `completed`, triggers processing
- [ ] Manual skill tagging → creates/updates `skills` records
- [ ] Key moment flagging → stored in session metadata JSON

#### 3.5 Audio Recording (Real Implementation)
- [ ] Browser MediaRecorder API for audio capture
- [ ] Upload chunks to Supabase Storage (`recordings` bucket)
- [ ] Store recording URL in `sessions.recording_url`
- [ ] Whisper API transcription Edge Function (real transcription)

**Dependencies**: Phase 2 (sessions must exist)
**Edge Functions**: `session-guidance`, `transcribe-audio`

---

### 🟢 Phase 4: Processing & Output

**Goal**: Convert raw session data into usable knowledge artifacts.
**Principle**: All processing via real GPT-5-mini. All outputs stored in Supabase.

#### 4.1 Post-Session Processing (Real AI)
- [ ] Edge Function: `process-session` — triggered on session completion
- [ ] GPT-5-mini extracts key insights from notes
- [ ] AI maps content to skills (updates `skills` table)
- [ ] Calculate and update skill confidence scores
- [ ] Store processing results in `sessions` metadata

#### 4.2 Report Generation (Real Documents)
- [ ] Edge Function: `generate-report` — creates actual reports
- [ ] Session summary → stored in `reports` table with `type: 'summary'`
- [ ] Skills progress report → real analytics from DB queries
- [ ] Campaign completion report → aggregated data
- [ ] PDF generation via Edge Function (html-to-pdf or similar)
- [ ] Store files in `reports` storage bucket

#### 4.3 Knowledge Graph (Real Data)
- [ ] Edge Function: `build-graph` — auto-generates graph from session
- [ ] Create `graph_nodes` for each skill/concept mentioned
- [ ] Create `graph_edges` for relationships detected by AI
- [ ] Store node positions in DB for persistence
- [ ] Update graph incrementally after each session

#### 4.4 Knowledge Graph Visualization (Interactive)
- [ ] React Flow component with real data from `graph_nodes`/`graph_edges`
- [ ] Node types with distinct styles: core, skill, concept, system, process
- [ ] Edge types with labels: requires, enables, related_to, part_of
- [ ] Click node → shows details panel with source session
- [ ] Drag nodes → saves positions to DB
- [ ] Zoom/pan controls

**Dependencies**: Phase 3 (needs session data to process)
**Edge Functions**: `process-session`, `generate-report`, `build-graph`

---

### 🟡 Phase 5: Command Center (Dashboard)

**Goal**: Unified view of all campaigns, metrics, and insights.

#### 5.1 Campaign Cards (Enhanced)
- [ ] Real data from Supabase
- [ ] Progress bars with actual completion %
- [ ] Health status indicators (on-track/keep-track/danger)
- [ ] Quick actions (view, schedule, capture)

#### 5.2 Metrics Panel
- [ ] Total skills captured (across all campaigns)
- [ ] Sessions completed this week
- [ ] Active campaigns count
- [ ] Knowledge graph node count

#### 5.3 Task Management
- [ ] Auto-generated tasks from campaign state
- [ ] Priority sorting (urgent, this-week, on-track)
- [ ] Mark complete functionality
- [ ] Link to relevant campaign/session

#### 5.4 Activity Feed
- [ ] Recent events across all campaigns
- [ ] Session completions
- [ ] New skills detected
- [ ] Report generations

#### 5.5 AI Insights Banner
- [ ] Proactive recommendations
- [ ] At-risk campaign detection
- [ ] Suggested next actions

**Dependencies**: Phases 3 & 4 (needs data to display)
**Edge Functions Needed**: `dashboard-insights`

---

### 🔴 Phase 6: Calendar Integration (Tomorrow)

**Goal**: Full Microsoft Outlook integration for session scheduling.

#### 6.1 Microsoft OAuth Setup
- [ ] Register Azure AD application
- [ ] Configure redirect URIs
- [ ] Set API permissions (Calendars.ReadWrite, OnlineMeetings.ReadWrite)
- [ ] Add credentials to Supabase secrets

#### 6.2 Calendar Sync
- [ ] Create calendar events for sessions
- [ ] Generate Teams meeting links
- [ ] Send invites to expert email
- [ ] Sync status updates

#### 6.3 Calendar UI Enhancements
- [ ] Show connected calendar status
- [ ] Display meeting links in session list
- [ ] Edit/reschedule from app

**Dependencies**: Microsoft Azure account with admin access
**Edge Functions**: `calendar-sync` (already deployed, needs credentials)

---

## Execution Order (Today)

Execute in this exact order to avoid breaking dependencies:

```
Step 1: Dashboard Enhancements (Phase 5.1-5.2)
   └── Connect existing components to real Supabase data
   └── No new dependencies, immediate visual improvement

Step 2: Knowledge Graph Foundation (Phase 4.3-4.4)
   └── Create visualization component
   └── Use existing graph_nodes/graph_edges tables

Step 3: Live Capture UI (Phase 3.2-3.4)
   └── Build capture interface
   └── Session state management
   └── AI guidance panel (real GPT-5-mini calls)

Step 4: Processing Engine (Phase 4.1-4.2)
   └── Post-session processing Edge Function
   └── Report generation
   └── Wire up to capture completion

Step 5: Activity Feed & Tasks (Phase 5.3-5.5)
   └── Real-time activity tracking
   └── Auto-generated tasks
   └── AI insights

Step 6: Calendar Integration (Tomorrow)
   └── Add Microsoft credentials
   └── Test end-to-end flow
```

---

## Safety Checklist

Before each step:
- [ ] Run `npm run build` to verify no TypeScript errors
- [ ] Test existing functionality still works
- [ ] Check Supabase logs for any RLS issues

After each step:
- [ ] Commit changes with descriptive message
- [ ] Verify new feature works with real data
- [ ] Check for console errors

---

## File Structure (New Files)

```
src/
├── app/
│   └── capture/
│       └── [sessionId]/
│           └── page.tsx          # Live capture interface
├── components/
│   ├── capture/
│   │   ├── index.ts
│   │   ├── capture-interface.tsx  # Main capture layout
│   │   ├── ai-coach-panel.tsx     # AI guidance sidebar
│   │   ├── session-controls.tsx   # Start/pause/end
│   │   └── notes-panel.tsx        # Notes/transcript input
│   ├── dashboard/
│   │   ├── activity-feed.tsx      # Recent events
│   │   ├── metrics-panel.tsx      # Aggregated stats
│   │   └── ai-insights.tsx        # Recommendations
│   └── visualizations/
│       └── knowledge-graph.tsx    # Interactive graph (exists, enhance)
├── lib/
│   └── hooks/
│       ├── use-session.ts         # Session state management
│       └── use-knowledge-graph.ts # Graph data fetching
```

---

## Edge Functions (New)

| Function | Purpose | Priority |
|----------|---------|----------|
| `session-guidance` | Real-time AI suggestions during capture | High |
| `process-session` | Post-session insight extraction | High |
| `generate-report` | Create PDF/JSON reports | Medium |
| `build-graph` | Auto-generate knowledge graph | Medium |
| `dashboard-insights` | AI recommendations for dashboard | Low |

---

## Ready to Execute

Start with **Step 1: Dashboard Enhancements** — this gives immediate value and validates our data layer is working correctly.

Shall we begin?
