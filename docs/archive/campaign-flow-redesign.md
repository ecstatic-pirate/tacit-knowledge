# Campaign Flow Redesign

## The Three Campaign Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌───────────┐         ┌───────────┐         ┌───────────┐                │
│   │           │         │           │         │           │                │
│   │  EXPERT   │         │  PROJECT  │         │   TEAM    │                │
│   │           │         │           │         │           │                │
│   └───────────┘         └───────────┘         └───────────┘                │
│                                                                             │
│   One expert            One project           Many projects                 │
│   One-time capture      Ongoing capture       Many experts                  │
│   Departure-driven      Project lifecycle     Ongoing capture               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Expert Campaign ✓ (Well-defined)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  TRIGGER         GOAL              TIMELINE       SUBJECT      │
│  ────────        ────              ────────       ───────      │
│  Expert is       Extract tacit     Bounded        One person   │
│  leaving         knowledge         (departure)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

This flow is clear. Expert leaves → capture what's in their head.

---

## 2. Project Campaign

### Capture Mode: Two options

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐       │
│   │      CADENCE-BASED          │    │       EVENT-DRIVEN          │       │
│   │      ─────────────          │    │       ────────────          │       │
│   │                             │    │                             │       │
│   │   Weekly / Bi-weekly /      │    │   Sponsor triggers when:    │       │
│   │   Monthly sessions          │    │   • Milestone reached       │       │
│   │                             │    │   • Decision made           │       │
│   │   Everyone participates     │    │   • Incident resolved       │       │
│   │   at same cadence           │    │   • Problem solved          │       │
│   │                             │    │                             │       │
│   │   More open-ended:          │    │   More focused:             │       │
│   │   "What happened this       │    │   "Let's capture this       │       │
│   │   week/month?"              │    │   specific thing"           │       │
│   │                             │    │                             │       │
│   └─────────────────────────────┘    └─────────────────────────────┘       │
│                                                                             │
│   System auto-schedules              Sponsor manually triggers              │
│   sessions at cadence                sessions as needed                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What knowledge to capture?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   DECISIONS           WHY             CONTEXT          LESSONS              │
│   ─────────           ───             ───────          ───────              │
│   What was            Why this        What were        What worked?         │
│   decided?            approach?       the constraints? What didn't?         │
│                                                                             │
│   "We chose           "Because X      "We had 2 weeks  "If doing again,     │
│   Postgres"           and Y"          and $Z budget"   we'd do..."          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Who participates?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   PROJECT TEAM (defined by sponsor)                                         │
│   ─────────────────────────────────                                         │
│                                                                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│   │ Alice   │  │ Bob     │  │ Carol   │  │ Dave    │                       │
│   │ ─────── │  │ ─────── │  │ ─────── │  │ ─────── │                       │
│   │ Tech    │  │ Backend │  │ PM      │  │ Design  │                       │
│   │ Lead    │  │ Dev     │  │         │  │         │                       │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘                       │
│                                                                             │
│   Each person has a ROLE on the project                                     │
│   (connects to expert knowledge - each person has their own expertise)      │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Cadence-based: Everyone participates at same cadence                │   │
│   │ Event-driven:  Sponsor picks who joins each session based on topic  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key insight: We need BOTH project + expert knowledge

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   PROJECT KNOWLEDGE                  EXPERT KNOWLEDGE                       │
│   (about the project)                (about the people)                     │
│   ─────────────────                  ────────────────                       │
│                                                                             │
│   "Why is the system                 "What does Alice know                  │
│   built this way?"                   about her domain?"                     │
│                                                                             │
│   Decisions, context,                Individual expertise,                  │
│   rationale, history                 skills, know-how                       │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   These connect: A project has people, each person has expertise.           │
│   Starting with Project → eventually captures expert knowledge too.         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interview Formats (applies to all campaign types)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐      │
│   │   LIVE + HUMAN    │  │   LIVE + AI       │  │   ASYNC + AI      │      │
│   │   ────────────    │  │   ─────────       │  │   ──────────      │      │
│   │                   │  │                   │  │                   │      │
│   │   Real human      │  │   AI conducts     │  │   Form-like       │      │
│   │   interviewer     │  │   live interview  │  │   experience      │      │
│   │                   │  │                   │  │                   │      │
│   │   Scheduled       │  │   Scheduled       │  │   Complete at     │      │
│   │   meeting         │  │   meeting         │  │   own pace        │      │
│   │                   │  │                   │  │                   │      │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘      │
│                                                                             │
│   Core USP: Interview-based capture (not just documentation)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cadence-based flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   EACH CADENCE CYCLE (e.g., bi-weekly)                                      │
│   ────────────────────────────────────                                      │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  PHASE 1: Context gathering                                          │  │
│   │  ───────────────────────────                                         │  │
│   │                                                                      │  │
│   │  ┌─────────────────┐      ┌─────────────────┐                        │  │
│   │  │ Quick async form│  +   │ First part of   │                        │  │
│   │  │ before session  │      │ interview is    │                        │  │
│   │  │                 │      │ open-ended      │                        │  │
│   │  │ "What did you   │      │                 │                        │  │
│   │  │ work on?"       │      │ "Tell me about  │                        │  │
│   │  │                 │      │ the last 2 wks" │                        │  │
│   │  └─────────────────┘      └─────────────────┘                        │  │
│   │                                                                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                          │                                                  │
│                          ▼                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  PHASE 2: Deep dive                                                  │  │
│   │  ──────────────────                                                  │  │
│   │                                                                      │  │
│   │  Based on what was shared, go deeper into:                           │  │
│   │  • Decisions made                                                    │  │
│   │  • Problems solved                                                   │  │
│   │  • Context & rationale                                               │  │
│   │                                                                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   FUTURE: Integrate with Slack/tools for automatic context gathering       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Proposed Project Campaign Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   STEP 1: PROJECT                                                           │
│   ───────────────                                                           │
│   • Select or create the project                                            │
│   • Project name, description                                               │
│                                                                             │
│   STEP 2: DOCUMENTS                                                         │
│   ─────────────────                                                         │
│   • Upload existing project artifacts (optional but encouraged)             │
│   • Specs, docs, diagrams, meeting notes, etc.                              │
│   • AI analyzes to understand project context                               │
│                                                                             │
│   STEP 3: TEAM                                                              │
│   ────────────                                                              │
│   • Add team members                                                        │
│   • Define each person's ROLE on this project                               │
│   • (This connects to their expertise)                                      │
│                                                                             │
│   STEP 4: CAPTURE MODE                                                      │
│   ────────────────────                                                      │
│   • Cadence-based OR Event-driven                                           │
│   • If cadence: select frequency (weekly/bi-weekly/monthly)                 │
│   • Interview format: Human-led / AI-live / AI-async                        │
│                                                                             │
│   STEP 5: FOCUS AREAS                                                       │
│   ─────────────────────                                                     │
│   • Event-driven: Specific topic for this capture                           │
│   • Cadence-based: Open-ended (discovered during interviews)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Decisions made

- **Documents early**: Moved to Step 2 so AI can analyze and inform later steps
- **Topics/Focus**: Different approach based on capture mode:
  - Event-driven → specific topic (natural: "capture this decision")
  - Cadence-based → open-ended, discovered during interviews
- **Cadence-based context**: Quick async form + open-ended interview start
  - Future: Slack/tool integrations

---

## 3. Team Campaign

### Key insight: Hierarchical model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           ┌─────────────┐                                   │
│                           │    TEAM     │                                   │
│                           └─────────────┘                                   │
│                                  │                                          │
│                    ┌─────────────┴─────────────┐                            │
│                    │                           │                            │
│                    ▼                           ▼                            │
│           ┌─────────────┐             ┌─────────────┐                       │
│           │  PROJECTS   │             │   EXPERTS   │                       │
│           └─────────────┘             └─────────────┘                       │
│                  │                           │                              │
│                  ▼                           │                              │
│           ┌─────────────┐                    │                              │
│           │   EXPERTS   │ ◄──────────────────┘                              │
│           └─────────────┘                                                   │
│                                                                             │
│   HIERARCHY:                                                                │
│   ──────────                                                                │
│   • Experts are the BASE (individual knowledge)                             │
│   • Projects = collection of experts working on something                   │
│   • Teams = collection of projects + experts                                │
│                                                                             │
│   Knowledge flows UP:                                                       │
│   Expert knowledge → feeds into → Project knowledge → feeds into → Team     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Team = Container that holds everything

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   TEAM CAMPAIGN CONTAINS:                                                   │
│   ───────────────────────                                                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  1. TEAM-LEVEL PROCESSES                                            │   │
│   │     (can be thought of as a "team-level project")                   │   │
│   │     • How we deploy                                                 │   │
│   │     • How we do code review                                         │   │
│   │     • Our on-call process                                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  2. PROJECTS                                                        │   │
│   │     Multiple projects the team works on                             │   │
│   │     Each with their own capture cadence                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  3. EXPERTS                                                         │   │
│   │     Team members with individual expertise                          │   │
│   │     Captured consistently over time                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Example: Backend Team

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        BACKEND TEAM                                  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│        │                                                                    │
│        ├──────────────────────────────────────────────────────────┐         │
│        │                                                          │         │
│        ▼                                                          ▼         │
│   ┌──────────────────────────────────┐    ┌─────────────────────────────┐   │
│   │  PROJECTS                        │    │  EXPERTS                    │   │
│   │  ────────                        │    │  ───────                    │   │
│   │  • Payment System                │    │  • Alice (DB expert)        │   │
│   │  • API Gateway                   │    │  • Bob (Security expert)    │   │
│   │  • Team Processes ← special      │    │  • Carol (Infra expert)     │   │
│   └──────────────────────────────────┘    └─────────────────────────────┘   │
│                                                                             │
│   All knowledge is LINKED and INTERCONNECTED                                │
│   • Alice's DB expertise feeds into Payment System project                  │
│   • Team Processes is a special "project" for team-wide knowledge           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Open questions for Team Campaign

1. **Is Team a "campaign" or a "container"?**
   - Campaign = has its own capture sessions
   - Container = just organizes projects + experts under it

2. **Creation flow**: When creating a Team:
   - Define team → add projects + experts over time?
   - Or define everything upfront?

3. **Team-level processes**: Treat as a special "project" within the team?

---

### My recommendation: Team = Container + Auto-created "Team Processes" project

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   RECOMMENDATION                                                            │
│   ──────────────                                                            │
│                                                                             │
│   Team is a CONTAINER (not a campaign itself)                               │
│                                                                             │
│   Why?                                                                      │
│   • Keeps model simple: actual capture only happens at Project/Expert level │
│   • Avoids confusion about what a "team session" would be                   │
│   • Teams evolve - container is flexible                                    │
│                                                                             │
│   BUT: When you create a Team, auto-create a "Team Processes" project       │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  CREATE TEAM "Backend Team"                                         │   │
│   │         │                                                           │   │
│   │         ▼                                                           │   │
│   │  Auto-creates:                                                      │   │
│   │  ┌─────────────────────────────────────┐                            │   │
│   │  │ "Backend Team Processes" (project)  │                            │   │
│   │  │ • How we deploy                     │                            │   │
│   │  │ • Code review standards             │                            │   │
│   │  │ • On-call rotation                  │                            │   │
│   │  │ • Team rituals                      │                            │   │
│   │  └─────────────────────────────────────┘                            │   │
│   │                                                                     │   │
│   │  Then user can add:                                                 │   │
│   │  • More projects (Payment System, API Gateway, etc.)                │   │
│   │  • Experts (Alice, Bob, Carol)                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why this approach?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   1. SIMPLICITY                                                             │
│      • Only two types of capture: Project and Expert                        │
│      • Team is just organizational grouping                                 │
│      • No confusion about "what is a team session?"                         │
│                                                                             │
│   2. FLEXIBILITY                                                            │
│      • Add projects/experts over time as team evolves                       │
│      • No upfront definition required                                       │
│      • Projects can move between teams if needed                            │
│                                                                             │
│   3. TEAM PROCESSES CAPTURED                                                │
│      • Auto-created "Team Processes" project handles team-level knowledge   │
│      • Uses same flow as any other project                                  │
│      • Consistent experience                                                │
│                                                                             │
│   4. KNOWLEDGE LINKING                                                      │
│      • Expert knowledge links to Projects they work on                      │
│      • Projects belong to Team                                              │
│      • Everything connected in the knowledge graph                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Decision: Remove Team from campaign creation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   SIMPLIFIED CAMPAIGN CREATION                                              │
│   ────────────────────────────                                              │
│                                                                             │
│   Only two campaign types:                                                  │
│                                                                             │
│   ┌─────────────────┐                                                       │
│   │ What are you    │                                                       │
│   │ documenting?    │                                                       │
│   │                 │                                                       │
│   │ ○ Expert        │  ← Person leaving, capture their knowledge            │
│   │ ○ Project       │  ← Ongoing project/process knowledge                  │
│   │                 │                                                       │
│   └─────────────────┘                                                       │
│                                                                             │
│   Teams managed separately in "Knowledge Hub"                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### But how do we capture Team Processes?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ANSWER: Team processes = A Project campaign                               │
│   ──────────────────────────────────────────────                            │
│                                                                             │
│   "Project" doesn't have to be a product/feature.                           │
│   It can be about HOW THE TEAM WORKS.                                       │
│                                                                             │
│   Examples:                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  "Payment System"        ← Product project                          │   │
│   │  "API Gateway"           ← Product project                          │   │
│   │  "Backend Team Ops"      ← Team processes (also a project!)         │   │
│   │  "Deployment Process"    ← Team processes (also a project!)         │   │
│   │  "On-call Runbook"       ← Team processes (also a project!)         │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Same flow, same interview structure, just different subject matter.       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### How it works in practice

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   USER WANTS TO CAPTURE: "How our team does deployments"                    │
│   ─────────────────────────────────────────────────────                     │
│                                                                             │
│   STEP 1: Create Project campaign                                           │
│   │                                                                         │
│   │  Project name: "Deployment Process"                                     │
│   │  Description: "How the backend team deploys to production"              │
│   │                                                                         │
│   STEP 2: Upload documents                                                  │
│   │                                                                         │
│   │  • Existing runbooks                                                    │
│   │  • CI/CD config files                                                   │
│   │  • Incident post-mortems                                                │
│   │                                                                         │
│   STEP 3: Add team members                                                  │
│   │                                                                         │
│   │  • Alice (Infra lead) ← knows the most                                  │
│   │  • Bob (Senior dev) ← does deployments often                            │
│   │  • Carol (New hire) ← can surface what's unclear                        │
│   │                                                                         │
│   STEP 4: Capture mode                                                      │
│   │                                                                         │
│   │  • Cadence: Monthly (processes evolve)                                  │
│   │  • Or Event-driven (after incidents, process changes)                   │
│   │                                                                         │
│   STEP 5: Interviews happen                                                 │
│   │                                                                         │
│   │  • "Walk me through a deployment"                                       │
│   │  • "What can go wrong?"                                                 │
│   │  • "Why do we do X before Y?"                                           │
│   │                                                                         │
│   ▼                                                                         │
│   RESULT: Team deployment knowledge captured                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What changes in the UI/flow?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   MAYBE: Add a hint/category when creating a Project                        │
│   ─────────────────────────────────────────────────────                     │
│                                                                             │
│   "What kind of project?"                                                   │
│                                                                             │
│   ○ Product/Feature     (Payment System, API Gateway)                       │
│   ○ Team Process        (Deployment, Code Review, On-call)                  │
│   ○ Other                                                                   │
│                                                                             │
│   This could:                                                               │
│   • Suggest relevant interview questions                                    │
│   • Suggest relevant document types to upload                               │
│   • Help organize in Knowledge Hub later                                    │
│                                                                             │
│   OR: Keep it simple, don't ask. A project is a project.                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Open Items + Recommendations

### 1. Expert campaign flow - Does it need changes?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   RECOMMENDATION: Align Expert flow with Project flow                       │
│   ───────────────────────────────────────────────────                       │
│                                                                             │
│   CURRENT EXPERT FLOW:                                                      │
│   Subject → Expert → Objective → Collaborators → Approach → Documents       │
│                                                                             │
│   PROPOSED EXPERT FLOW:                                                     │
│   Expert → Documents → Domains/Skills → Collaborators → Capture Mode        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  STEP 1: EXPERT                                                     │   │
│   │  Who is leaving? Name, role, department, tenure                     │   │
│   │                                                                     │   │
│   │  STEP 2: DOCUMENTS                                                  │   │
│   │  What have they written/created? Upload artifacts.                  │   │
│   │  AI analyzes to understand their domains.                           │   │
│   │                                                                     │   │
│   │  STEP 3: DOMAINS/SKILLS                                             │   │
│   │  What areas do they own? (AI suggests from docs, user confirms)     │   │
│   │                                                                     │   │
│   │  STEP 4: COLLABORATORS                                              │   │
│   │  Who else knows about this expert? (for 360° view)                  │   │
│   │                                                                     │   │
│   │  STEP 5: CAPTURE MODE                                               │   │
│   │  Interview format: Human-led / AI-live / AI-async                   │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   KEY CHANGE: Documents moved earlier so AI can suggest domains/skills      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Documents step - What happens there?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   RECOMMENDATION: Upload + AI Analysis                                      │
│   ────────────────────────────────────                                      │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   USER UPLOADS                        AI ANALYZES & SUGGESTS        │   │
│   │   ────────────                        ──────────────────────        │   │
│   │                                                                     │   │
│   │   • Specs, docs                       • Key topics/domains          │   │
│   │   • Meeting notes                     • Knowledge gaps              │   │
│   │   • Runbooks                          • Suggested interview Qs      │   │
│   │   • Code/configs                      • Focus areas                 │   │
│   │   • Diagrams                                                        │   │
│   │                                                                     │   │
│   │                         ┌─────────┐                                 │   │
│   │   Upload ─────────────▶ │   AI    │ ─────────────▶ Suggestions      │   │
│   │                         └─────────┘                                 │   │
│   │                                                                     │   │
│   │   User can ACCEPT / MODIFY / SKIP suggestions                       │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   This makes documents ACTIVE INPUT, not just storage.                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Scheduling for cadence-based - Auto or manual?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   RECOMMENDATION: System reminds, sponsor confirms                          │
│   ──────────────────────────────────────────────────                        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   CADENCE: Bi-weekly                                                │   │
│   │                                                                     │   │
│   │   Week 2: System sends reminder                                     │   │
│   │           "Time for your bi-weekly capture session"                 │   │
│   │                    │                                                │   │
│   │                    ▼                                                │   │
│   │           Sponsor clicks to schedule                                │   │
│   │                    │                                                │   │
│   │                    ▼                                                │   │
│   │           Sponsor confirms participants                             │   │
│   │           (default: everyone, can adjust)                           │   │
│   │                    │                                                │   │
│   │                    ▼                                                │   │
│   │           Sessions scheduled / invites sent                         │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   WHY NOT FULL AUTO?                                                        │
│   • Requires calendar integrations (complex)                                │
│   • Sponsor might want to skip a cycle (vacation, crunch time)              │
│   • Keeps humans in the loop                                                │
│                                                                             │
│   FUTURE: Can add auto-scheduling when calendar integrations exist          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Teams in Knowledge Hub - How to manage?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   RECOMMENDATION: Design later, keep it simple for now                      │
│   ────────────────────────────────────────────────────                      │
│                                                                             │
│   FOR NOW:                                                                  │
│   • Projects can optionally be tagged with a team                           │
│   • Experts can optionally be tagged with a team                            │
│   • Knowledge Hub can filter by team                                        │
│   • Team creation/management in Settings (simple CRUD)                      │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   KNOWLEDGE HUB                                                     │   │
│   │   ─────────────                                                     │   │
│   │                                                                     │   │
│   │   Filter: [All Teams ▼]  [Backend Team]  [Frontend Team]            │   │
│   │                                                                     │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│   │   │ Payment     │  │ Deployment  │  │ Alice       │                 │   │
│   │   │ System      │  │ Process     │  │ (Expert)    │                 │   │
│   │   │ [Project]   │  │ [Project]   │  │             │                 │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   PRIORITY: Get campaign creation right first. Teams are organizational.    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. Collaborators vs Team - What's the difference?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   RECOMMENDATION: Different concepts for different campaign types           │
│   ─────────────────────────────────────────────────────────────             │
│                                                                             │
│   ┌───────────────────────────────┐  ┌───────────────────────────────┐     │
│   │  EXPERT CAMPAIGN              │  │  PROJECT CAMPAIGN             │     │
│   │  ────────────────             │  │  ────────────────             │     │
│   │                               │  │                               │     │
│   │  EXPERT = The person leaving  │  │  TEAM = People with knowledge │     │
│   │  (primary interviewee)        │  │  (all are interviewees)       │     │
│   │                               │  │                               │     │
│   │  COLLABORATORS = People who   │  │  No single "expert" -         │     │
│   │  know about the expert        │  │  knowledge is distributed     │     │
│   │  (provide 360° perspective)   │  │                               │     │
│   │                               │  │                               │     │
│   │  ┌───────┐                    │  │  ┌───┐ ┌───┐ ┌───┐            │     │
│   │  │EXPERT │ ← main interview   │  │  │ A │ │ B │ │ C │ ← all      │     │
│   │  └───────┘                    │  │  └───┘ └───┘ └───┘   interviewed│    │
│   │      │                        │  │                               │     │
│   │  ┌───┴───┐                    │  │                               │     │
│   │  ▼       ▼                    │  │                               │     │
│   │ ┌───┐ ┌───┐ ← collaborators   │  │                               │     │
│   │ │ X │ │ Y │   surveyed for    │  │                               │     │
│   │ └───┘ └───┘   additional      │  │                               │     │
│   │               perspective     │  │                               │     │
│   │                               │  │                               │     │
│   └───────────────────────────────┘  └───────────────────────────────┘     │
│                                                                             │
│   NAMING:                                                                   │
│   • Expert campaign: Keep "Collaborators"                                   │
│   • Project campaign: Call it "Team" or "Contributors"                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary: The Two Flows (Updated)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   EXPERT CAMPAIGN                                                           │
│   ───────────────                                                           │
│                                                                             │
│   ┌────────┐   ┌──────┐   ┌─────────┐   ┌─────────┐   ┌───────────┐   ┌────────┐
│   │ Expert │ → │ Team │ → │Documents│ → │ Domains │ → │Collaborat.│ → │Capture │
│   │        │   │(org) │   │         │   │ /Skills │   │  (peers)  │   │ Mode   │
│   └────────┘   └──────┘   └─────────┘   └─────────┘   └───────────┘   └────────┘
│                                │              ▲                              │
│                                └──── AI ──────┘                              │
│                                    suggests                                  │
│                                                                             │
│   TEAM = Organizational unit the expert belongs to                          │
│   COLLABORATORS = Peers they work with (can be cross-team)                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PROJECT CAMPAIGN                                                          │
│   ────────────────                                                          │
│                                                                             │
│   ┌─────────┐   ┌──────┐   ┌─────────┐   ┌───────────┐   ┌────────┐   ┌───────┐
│   │ Project │ → │ Team │ → │Documents│ → │Contributors│ → │Capture │ → │Focus  │
│   │  +type  │   │(org) │   │         │   │(interview.)│   │ Mode   │   │Areas  │
│   └─────────┘   └──────┘   └─────────┘   └───────────┘   └────────┘   └───────┘
│                                │                                ▲            │
│                                └──────────── AI ────────────────┘            │
│                                            suggests                          │
│                                                                             │
│   TEAM = Organizational unit the project belongs to                         │
│   CONTRIBUTORS = People who will be interviewed about the project           │
│   TYPE = Product/Feature or Team Process (optional)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Clarification: Team vs Collaborators vs Contributors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   TEAM (both flows)                                                         │
│   ─────────────────                                                         │
│   • Organizational unit (Backend Team, Frontend Team, etc.)                 │
│   • Selected during campaign creation                                       │
│   • Used for organization and filtering in Knowledge Hub                    │
│                                                                             │
│   COLLABORATORS (Expert flow only)                                          │
│   ────────────────────────────────                                          │
│   • Peers the expert works with                                             │
│   • NOT necessarily from the same team - can be cross-team                  │
│   • Provide 360° perspective about the expert                               │
│   • Surveyed for additional input                                           │
│                                                                             │
│   CONTRIBUTORS (Project flow only)                                          │
│   ───────────────────────────────                                           │
│   • People who will be interviewed about the project                        │
│   • Have knowledge about the project                                        │
│   • All are interviewees (no single "expert")                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cadence scheduling - User choice in flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   CAPTURE MODE step now includes scheduling option:                         │
│   ─────────────────────────────────────────────────                         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  How do you want to capture?                                        │   │
│   │                                                                     │   │
│   │  ○ Cadence-based                                                    │   │
│   │    └─ Frequency: [Weekly ▼] [Bi-weekly] [Monthly]                   │   │
│   │    └─ Scheduling: [Auto-remind ▼] [Auto-schedule]                   │   │
│   │                                                                     │   │
│   │  ○ Event-driven                                                     │   │
│   │    └─ You trigger sessions manually when needed                     │   │
│   │                                                                     │   │
│   │  Interview format:                                                  │   │
│   │  ○ Human-led   ○ AI-live   ○ AI-async                               │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Auto-remind: System reminds sponsor, they confirm                         │
│   Auto-schedule: System schedules automatically (future, needs calendar)    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Flow (for reference)

```
┌───────┐   ┌────────┐   ┌───────────┐   ┌─────────────┐   ┌──────────┐   ┌───────────┐
│Subject│ → │ Expert │ → │ Objective │ → │Collaborators│ → │ Approach │ → │ Documents │
│  (0)  │   │  (1)   │   │    (2)    │   │     (3)     │   │   (4)    │   │    (5)    │
└───────┘   └────────┘   └───────────┘   └─────────────┘   └──────────┘   └───────────┘
```

---

## Discussion Notes

(We'll capture our thinking here as we talk)

