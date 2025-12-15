# Phase 1: Foundation — Technical Implementation Plan

> **Goal**: Establish the data layer that all other features will build upon.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Supabase (PostgreSQL) | Managed, real-time subscriptions, built-in auth |
| Authentication | Supabase Auth | Email/password + OAuth, integrates with RLS |
| Tenancy | Multi-tenant | Org-level data isolation via RLS policies |
| User-Org | One org per user | Simpler model, direct FK on users table |
| File Storage | Supabase Storage | Integrated, simple, sufficient for documents |
| Deployment | Vercel | Native Next.js support, edge functions |
| Skills Model | Custom per campaign | Flexible, no upfront taxonomy required |
| Audit Trail | Soft deletes + updated_by | Full history preservation |

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│     users       │ (org_id FK directly on users)
└────────┬────────┘
         │
         │ created_by / updated_by
         ▼
┌─────────────────┐
│    campaigns    │
└────────┬────────┘
         │ 1:N
         ├────────────────┬────────────────┬────────────────┐
         ▼                ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    skills    │  │   sessions   │  │    tasks     │  │  documents   │
└──────────────┘  └──────┬───────┘  └──────────────┘  └──────────────┘
                         │ 1:N
                         ▼
                 ┌──────────────┐
                 │   reports    │
                 └──────────────┘

┌─────────────────────────────────────┐
│         KNOWLEDGE GRAPH             │
├──────────────┬──────────────────────┤
│ graph_nodes  │◄────► graph_edges    │
└──────────────┴──────────────────────┘
```

---

### Table Definitions

#### 1. organizations
The tenant boundary. All data is scoped to an org.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| name | text | NOT NULL | Company/team name |
| slug | text | UNIQUE, NOT NULL | URL-friendly identifier |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

---

#### 2. users
Extends Supabase auth.users with app-specific fields. One org per user.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, references auth.users(id) | Matches Supabase auth |
| org_id | uuid | FK → organizations(id), NOT NULL | User's organization |
| email | text | NOT NULL | Denormalized from auth |
| full_name | text | | Display name |
| avatar_url | text | | Profile image |
| role | text | NOT NULL, default 'member' | 'owner', 'admin', 'member', 'viewer' |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Index**: org_id

---

#### 3. campaigns
Central entity — one per expert being interviewed.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations(id), NOT NULL | Tenant scope |
| created_by | uuid | FK → users(id) | Who created it |
| updated_by | uuid | FK → users(id) | Last modifier |
| expert_name | text | NOT NULL | Person being interviewed |
| expert_role | text | NOT NULL | Job title |
| department | text | | Org unit |
| years_experience | integer | | Tenure indicator |
| goal | text | | What we want to capture |
| capture_mode | text | default 'hybrid' | 'human_led', 'ai_guided', 'hybrid' |
| status | text | default 'on_track' | 'on_track', 'keep_track', 'danger' |
| progress | integer | default 0 | 0-100 percentage |
| total_sessions | integer | default 14 | Planned session count |
| completed_sessions | integer | default 0 | |
| started_at | timestamptz | | When first session began |
| completed_at | timestamptz | | When marked complete |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Index**: org_id, deleted_at

---

#### 4. skills
Knowledge areas to capture. Custom per campaign.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| campaign_id | uuid | FK → campaigns(id), NOT NULL | |
| name | text | NOT NULL | e.g., "Billing reconciliation" |
| category | text | | Grouping label |
| source | text | default 'manual' | 'manual', 'ai_detected' |
| confidence | decimal(3,2) | | AI confidence score (0.00-1.00) |
| captured | boolean | default false | Has this been documented? |
| captured_at | timestamptz | | When marked captured |
| session_id | uuid | FK → sessions(id) | Which session captured it |
| created_by | uuid | FK → users(id) | |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Index**: campaign_id, deleted_at

---

#### 5. sessions
Individual interview events.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| campaign_id | uuid | FK → campaigns(id), NOT NULL | |
| session_number | integer | NOT NULL | 1, 2, 3... |
| scheduled_at | timestamptz | | Planned time |
| started_at | timestamptz | | Actual start |
| ended_at | timestamptz | | Actual end |
| duration_minutes | integer | | Calculated or recorded |
| status | text | default 'scheduled' | 'scheduled', 'in_progress', 'completed', 'cancelled' |
| topics | text[] | | Array of topic strings |
| notes | text | | Interviewer notes |
| recording_url | text | | Storage path |
| transcript_url | text | | Processed transcript path |
| created_by | uuid | FK → users(id) | |
| updated_by | uuid | FK → users(id) | |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Unique constraint**: (campaign_id, session_number) WHERE deleted_at IS NULL
**Index**: campaign_id, status, deleted_at

---

#### 6. tasks
System-generated action items surfaced to users.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| org_id | uuid | FK → organizations(id), NOT NULL | Tenant scope |
| campaign_id | uuid | FK → campaigns(id) | Related campaign (nullable) |
| assigned_to | uuid | FK → users(id) | Who should act |
| title | text | NOT NULL | Action description |
| priority | text | default 'on_track' | 'urgent', 'this_week', 'on_track' |
| completed | boolean | default false | |
| completed_at | timestamptz | | |
| due_at | timestamptz | | Optional deadline |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Index**: org_id, completed, priority, deleted_at

---

#### 7. reports
Generated artifacts from sessions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| campaign_id | uuid | FK → campaigns(id) | |
| session_id | uuid | FK → sessions(id) | Source session (if applicable) |
| title | text | NOT NULL | Report name |
| type | text | NOT NULL | 'summary', 'skills', 'transcript', 'graph', 'export' |
| status | text | default 'processing' | 'processing', 'ready', 'failed' |
| file_url | text | | Storage path |
| preview | text | | Short text preview |
| metadata | jsonb | default '{}' | Flexible additional data |
| created_by | uuid | FK → users(id) | |
| created_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Index**: campaign_id, type, deleted_at

---

#### 8. documents
Uploaded files for AI analysis.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| campaign_id | uuid | FK → campaigns(id) | |
| uploaded_by | uuid | FK → users(id) | |
| filename | text | NOT NULL | Original filename |
| file_type | text | | 'pdf', 'docx', 'pptx', etc. |
| file_size | integer | | Bytes |
| storage_path | text | NOT NULL | Storage path |
| ai_processed | boolean | default false | Has AI analyzed it? |
| ai_processed_at | timestamptz | | |
| extracted_skills | jsonb | default '[]' | AI-detected skills before confirmation |
| created_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Index**: campaign_id, deleted_at

---

#### 9. graph_nodes
Knowledge graph vertices — skills, concepts, systems.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| campaign_id | uuid | FK → campaigns(id), NOT NULL | |
| label | text | NOT NULL | Display name |
| type | text | NOT NULL | 'core', 'skill', 'concept', 'system', 'process' |
| description | text | | Longer explanation |
| metadata | jsonb | default '{}' | Flexible attributes |
| position_x | float | | Visual X coordinate |
| position_y | float | | Visual Y coordinate |
| skill_id | uuid | FK → skills(id) | Link to skill if type='skill' |
| session_id | uuid | FK → sessions(id) | Session that created this node |
| created_by | uuid | FK → users(id) | |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Index**: campaign_id, type, deleted_at

---

#### 10. graph_edges
Knowledge graph relationships between nodes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| campaign_id | uuid | FK → campaigns(id), NOT NULL | Denormalized for query perf |
| source_node_id | uuid | FK → graph_nodes(id), NOT NULL | From node |
| target_node_id | uuid | FK → graph_nodes(id), NOT NULL | To node |
| relationship | text | NOT NULL | 'requires', 'enables', 'related_to', 'part_of' |
| weight | float | default 1.0 | Strength of relationship |
| metadata | jsonb | default '{}' | Flexible attributes |
| session_id | uuid | FK → sessions(id) | Session that created this edge |
| created_by | uuid | FK → users(id) | |
| created_at | timestamptz | default now() | |
| deleted_at | timestamptz | | Soft delete |

**Unique constraint**: (source_node_id, target_node_id, relationship) WHERE deleted_at IS NULL
**Index**: campaign_id, source_node_id, target_node_id, deleted_at

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Users only see data for their org.

### Pattern for org-scoped tables (simplified with direct org_id on users):

```sql
-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their org's campaigns (excluding soft-deleted)
CREATE POLICY "Users can view own org campaigns"
ON campaigns FOR SELECT
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND deleted_at IS NULL
);

-- Policy: Users can insert into their org
CREATE POLICY "Users can create campaigns in own org"
ON campaigns FOR INSERT
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- Policy: Users can update own org campaigns
CREATE POLICY "Users can update own org campaigns"
ON campaigns FOR UPDATE
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND deleted_at IS NULL
);

-- Policy: Users can soft-delete (update deleted_at)
CREATE POLICY "Users can soft delete own org campaigns"
ON campaigns FOR UPDATE
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);
```

### For campaign-scoped tables (skills, sessions, reports, documents, graph_nodes, graph_edges):

```sql
-- Policy: Access through campaign's org
CREATE POLICY "Access skills via campaign org"
ON skills FOR ALL
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c
    WHERE c.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND c.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);
```

---

## Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `documents` | Uploaded files for AI analysis | Authenticated, scoped by org |
| `recordings` | Session audio/video files | Authenticated, scoped by org |
| `reports` | Generated report files | Authenticated, scoped by org |

### Storage Path Structure

```
documents/{org_id}/{campaign_id}/{filename}
recordings/{org_id}/{campaign_id}/{session_id}/{filename}
reports/{org_id}/{campaign_id}/{report_id}/{filename}
```

---

## Implementation Steps

### Step 1: Supabase Project Setup
1. Create Supabase project
2. Note project URL and anon/service keys
3. Enable auth providers (email, Google)

### Step 2: Database Migration
1. Create SQL migration file with all 10 tables
2. Apply via Supabase CLI (`supabase db push`)
3. Verify tables and constraints

### Step 3: RLS Policies
1. Enable RLS on all tables
2. Create policies (respecting soft deletes)
3. Test isolation between orgs

### Step 4: Storage Buckets
1. Create three buckets
2. Configure storage policies
3. Set file size limits

### Step 5: TypeScript Types
1. Run `supabase gen types typescript`
2. Export types for Next.js

### Step 6: Next.js Integration
1. Install `@supabase/supabase-js` and `@supabase/ssr`
2. Create client utilities (browser + server)
3. Set up auth middleware
4. Configure Vercel env vars

### Step 7: Replace Mock Data
1. Update AppContext to query Supabase
2. Implement CRUD with soft delete support
3. Add loading/error states

### Step 8: Seed Data
1. Create test org + users
2. Add sample campaigns
3. Populate some graph nodes/edges

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only
```

---

## File Structure

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── types/
│   └── database.ts
├── context/
│   └── app-context.tsx
└── middleware.ts

supabase/
├── migrations/
│   └── 001_initial_schema.sql
├── seed.sql
└── config.toml
```

---

## Verification Checklist

- [ ] All 10 tables created with constraints
- [ ] Foreign keys and cascade behavior working
- [ ] Soft delete (deleted_at) on all relevant tables
- [ ] Audit fields (created_by, updated_by) populated
- [ ] RLS enabled and tested
- [ ] Storage buckets with policies
- [ ] TypeScript types generated
- [ ] Auth flow working
- [ ] UI renders with real data
- [ ] Vercel deployment configured

---

## Summary of Changes from Initial Plan

| Change | Before | After |
|--------|--------|-------|
| User-Org | Junction table (user_orgs) | Direct FK on users |
| Audit | None | deleted_at + updated_by on all tables |
| Knowledge Graph | Deferred | Added graph_nodes + graph_edges tables |
| Total Tables | 9 | 10 |
