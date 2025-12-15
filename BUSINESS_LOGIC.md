# Tacit Knowledge Platform — Business Logic

> **Purpose**: Capture and preserve institutional knowledge from departing experts before it's lost forever.

---

## The Problem

When experienced employees leave, decades of undocumented expertise — workarounds, context, tribal knowledge — walks out the door. This platform systematically extracts that knowledge through structured interviews and converts it into searchable, transferable assets.

---

## Core Business Entities

| Entity | Purpose |
|--------|---------|
| **Campaign** | A knowledge capture initiative for one expert (tracks progress, sessions, skills) |
| **Session** | A single interview event (scheduled, in-progress, or completed) |
| **Skill** | A discrete capability or knowledge area to capture |
| **Knowledge Graph** | Visual map of interconnected concepts, skills, and systems |
| **Report** | Output artifact (transcript, summary, export, analytics) |
| **Task** | Action item surfaced to users (urgent, this-week, on-track) |

---

## System Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   PREPARE          PLAN           CAPTURE          PROCESS      OUTPUT  │
│   ────────         ────           ───────          ───────      ──────  │
│                                                                         │
│   Define expert    Schedule       Conduct live     AI extracts  Reports │
│   Upload docs  →   sessions   →   interviews   →   insights  →  Graphs  │
│   AI suggests      Set cadence    Real-time        Identify     Exports │
│   skills                          guidance         patterns             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Build Order (Systems Thinking)

If building from scratch, create in this sequence — each layer depends on the previous:

### Phase 1: Foundation (Data Layer)

**Why first**: Everything else reads/writes these entities.

1. **Campaign entity** — the central organizing object
2. **Skill entity** — atomic unit of knowledge being captured
3. **Session entity** — links campaigns to actual capture events
4. **Task entity** — enables workflow management
5. **Report entity** — output structure for all artifacts

### Phase 2: Core Workflow (Prepare → Plan)

**Why second**: Users must be able to create and plan before capturing.

1. **Campaign creation form** — collect expert info, goals, target skills
2. **Document upload & AI analysis** — detect skills from existing materials
3. **AI suggestions engine** — recommend skills, timelines, cadence
4. **Session scheduler** — plan the interview timeline (weekly over N weeks)
5. **Capture mode selector** — Human-led / AI-guided / Hybrid

### Phase 3: Live Capture Engine

**Why third**: This is where value is created — actual knowledge extraction.

1. **Recording infrastructure** — audio/video capture
2. **Real-time transcription** — convert speech to text live
3. **AI Coach panel** — provide context, active topic, guidance to interviewer
4. **Human Guidance panel** — suggest questions, show skill coverage
5. **Key insight detection** — automatically flag important moments
6. **Session state management** — start, pause, resume, end

### Phase 4: Processing & Output

**Why fourth**: Raw captures must become usable artifacts.

1. **Transcript extraction** — clean, formatted text from session
2. **Skill identification** — map captured content to skills
3. **Insight extraction** — pull out key nuggets
4. **Knowledge graph generation** — build relationship map
5. **Report generation** — create summaries, analytics, exports

### Phase 5: Command Center (Dashboard)

**Why last**: Monitoring layer that surfaces insights from all other layers.

1. **Campaign overview cards** — status, progress, health indicators
2. **Metrics aggregation** — skills captured, sessions completed, pending items
3. **Task list** — priority-sorted action items
4. **Knowledge graph visualization** — interactive exploration
5. **Activity feed** — recent events across all campaigns
6. **AI suggestions banner** — proactive recommendations

---

## Capture Modes Explained

| Mode | Who Leads | AI Role | Best For |
|------|-----------|---------|----------|
| **Human-Led** | Expert interviewer | Passive support | Complex, sensitive topics |
| **AI-Guided** | Team lead | Active guidance & questions | Standard knowledge capture |
| **Hybrid** | Varies by session | Adaptive support | Flexible, mixed complexity |

---

## Campaign Health States

| Status | Meaning | Trigger |
|--------|---------|---------|
| **On-track** | Progressing normally | Sessions on schedule, skills being captured |
| **Keep-track** | Needs attention | Falling behind schedule |
| **Danger** | At risk | No sessions conducted, stalled |

---

## Key Business Rules

1. **One campaign per expert** — each retiring/departing person gets dedicated focus
2. **Skills have confidence scores** — AI-detected skills show certainty (85-95%)
3. **Sessions are sequential** — later sessions build on earlier ones (AI provides recap)
4. **Knowledge graphs are cumulative** — each session adds nodes and connections
5. **Reports are auto-generated** — session completion triggers processing
6. **Tasks are system-surfaced** — not manually created; derived from campaign state

---

## AI Touchpoints

| Where | What AI Does |
|-------|--------------|
| Document upload | Analyzes files, extracts likely skills |
| Campaign setup | Suggests timeline, cadence, focus areas |
| Live session | Provides interviewer guidance, tracks topics |
| Post-session | Extracts insights, identifies skills, builds graph |
| Dashboard | Surfaces recommendations, detects at-risk campaigns |

---

## Output Artifacts

| Artifact | Description |
|----------|-------------|
| **Session Summary** | Key points from one interview |
| **Skills Progress Report** | Analytics on what's been captured vs. gaps |
| **Knowledge Graph Export** | JSON or visual map of captured knowledge |
| **Full Transcript** | Complete text record of session |
| **AI Integration Package** | Exportable format for downstream systems |

---

## Success Metrics

- **Coverage**: % of target skills captured
- **Campaign velocity**: Sessions completed per week
- **Graph density**: Connections between knowledge nodes
- **Time to capture**: Days from campaign start to completion
- **Knowledge transfer**: Downstream usage of captured assets

---

## Summary

The platform follows a linear workflow: **Prepare → Plan → Capture → Process → Output**, with the Dashboard serving as a monitoring overlay. Each phase builds on the previous. The core innovation is AI-assisted live guidance during interviews plus automated post-processing to convert raw conversations into structured, searchable knowledge.

Build the data layer first, then the creation/planning workflow, then the live capture engine, then processing, and finally the monitoring dashboard.
