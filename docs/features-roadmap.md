# Features Roadmap

## Product Focus: Organized Knowledge Capture

This product is designed for **campaign-based** knowledge capture where someone organizes the sessions:
- Expert leaving/retiring → HR creates campaign → runs sessions
- Business process documentation → team lead organizes capture

**Key characteristics:**
- Campaigns are triggered and organized by humans (HR, managers, team leads)
- Knowledge layer updates as sessions are completed
- AI assists the interviewer during sessions
- Value: "We captured critical knowledge before it was lost"

---

## Feature Map by Flow Stage

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  CREATE          SCOPE           CAPTURE         PROCESS         CONSUME              │
│  ──────          ─────           ───────         ───────         ───────              │
│                                                                                        │
│  ┌────────┐    ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐            │
│  │Campaign│    │People  │      │Sessions│      │AI      │      │Reports │            │
│  │Form    │    │& Input │      │& Interview│   │Process │      │        │            │
│  └────────┘    └────────┘      └────────┘      └────────┘      └────────┘            │
│                                                                                        │
│  ┌────────┐    ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐            │
│  │Campaign│    │Topics  │      │Calendar│      │Knowledge│     │Concierge│            │
│  │Detail  │    │        │      │Sync    │      │Base     │      │        │            │
│  └────────┘    └────────┘      └────────┘      └────────┘      └────────┘            │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current State Assessment

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  FEATURE                        PROJECT        EXPERT         PRIORITY                 │
│  ───────────────────────────────────────────────────────────────────────              │
│                                                                                        │
│  CREATE                                                                                │
│  ├─ Campaign form               ⚠️ Tweak       ✅ Exists      P1                       │
│  └─ Campaign detail page        ⚠️ Tweak       ✅ Exists      P1                       │
│                                                                                        │
│  SCOPE                                                                                 │
│  ├─ Managers                    ❌ Build       N/A            P2                       │
│  ├─ Participants                ❌ Build       N/A            P1                       │
│  ├─ Participant input form      ❌ Build       N/A            P2                       │
│  ├─ Self-assessment             N/A            ✅ Exists      -                        │
│  ├─ Collaborator feedback       N/A            ✅ Exists      -                        │
│  └─ Topics list                 ⚠️ Repurpose   ⚠️ Repurpose   P1                       │
│                                                                                        │
│  CAPTURE                                                                               │
│  ├─ Session scheduling          ✅ Exists      ✅ Exists      -                        │
│  ├─ Session ↔ Person link       ❌ Build       ❌ Build       P1                       │
│  ├─ Interview room              ✅ Exists      ✅ Exists      -                        │
│  ├─ Transcript                  ✅ Exists      ✅ Exists      -                        │
│  └─ Calendar sync               ✅ Exists      ✅ Exists      -                        │
│                                                                                        │
│  PROCESS                                                                               │
│  ├─ AI extraction               ⚠️ Partial     ⚠️ Partial     P2                       │
│  └─ Basic question suggestions  ⚠️ Partial     ⚠️ Partial     P2                       │
│                                                                                        │
│  CONSUME                                                                               │
│  ├─ Knowledge base              ⚠️ Partial     ⚠️ Partial     P2                       │
│  ├─ Reports                     ❌ Build       ❌ Build       P2                       │
│  └─ Concierge                   ⚠️ Needs ctx   ⚠️ Needs ctx   P3                       │
│                                                                                        │
│  Legend: ✅ Exists  ⚠️ Partial/Tweak  ❌ Build  P1=Now P2=Next P3=Later               │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## P1: Core Flow (MVP for Pilots)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  FEATURE 1: Campaign Form Updates                                          [PARALLEL] │
│  ─────────────────────────────────                                                     │
│  Files: /src/components/prepare/campaign-form.tsx, /src/app/new/page.tsx              │
│  Work:                                                                                 │
│  • Project: Already simplified (name + description)                                    │
│  • Expert: Add departure date field                                                    │
│  • Clean up unused fields                                                              │
│  Est: Small                                                                            │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURE 2: Participants (Project Campaigns)                               [PARALLEL] │
│  ───────────────────────────────────────────                                           │
│  Files: New component, new DB table, campaign detail page                              │
│  Work:                                                                                 │
│  • DB: Create participants table (campaign_id, name, email, role, team, status)       │
│  • UI: Participants tab on campaign detail page                                        │
│  • UI: Add/edit participant modal                                                      │
│  • UI: Status indicators (not interviewed / in progress / complete)                   │
│  Est: Medium                                                                           │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURE 3: Topics Refactor                                                [PARALLEL] │
│  ──────────────────────────                                                            │
│  Files: Rename/repurpose skills → topics                                              │
│  Work:                                                                                 │
│  • DB: Rename skills table → topics (or add topics table)                             │
│  • DB: Add suggested_by field (who suggested this topic)                              │
│  • UI: Update all references from "skills" to "topics"                                │
│  Est: Medium                                                                           │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURE 4: Session ↔ Person Link                                          [AFTER 2] │
│  ────────────────────────────────                                                      │
│  Files: Sessions table, session form, session list                                     │
│  Work:                                                                                 │
│  • DB: Add participant_id to sessions table                                            │
│  • UI: Session form - select participant (for project) or auto-set (for expert)       │
│  • UI: Session list - show who the session is with                                     │
│  Est: Small                                                                            │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURE 5: Campaign Detail Page Tabs                                      [AFTER 2,3]│
│  ────────────────────────────────────                                                  │
│  Files: /src/app/campaigns/[id]/page.tsx                                              │
│  Work:                                                                                 │
│  • Project: Overview, Participants, Topics, Sessions                                   │
│  • Expert: Overview, Preparation (self-assess, collabs), Topics, Sessions             │
│  • Both: Clean up, consistent design                                                   │
│  Est: Medium                                                                           │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## P2: Enhanced Flow (Post-Pilot)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  FEATURE 6: Managers (Project Campaigns)                                   [PARALLEL] │
│  ───────────────────────────────────────                                               │
│  Work:                                                                                 │
│  • DB: Add manager role to participants or separate table                              │
│  • UI: Manager input form (suggest topics for their team)                             │
│  • Logic: Managers can suggest but may not be interviewed                             │
│  Est: Medium                                                                           │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURE 7: Participant Input Form                                         [PARALLEL] │
│  ─────────────────────────────────                                                     │
│  Work:                                                                                 │
│  • Public form (like /assess, /feedback) for participants                             │
│  • Questions: What do you know? What should we ask others?                            │
│  • Store responses, use for session preparation                                        │
│  Est: Medium                                                                           │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURE 8: Knowledge Base Enhancement                                     [PARALLEL] │
│  ─────────────────────────────────────                                                 │
│  Work:                                                                                 │
│  • Structure extracted knowledge properly                                              │
│  • Link to source session/transcript                                                   │
│  • Topic coverage tracking                                                             │
│  Est: Large                                                                            │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURE 9: Reports                                                        [AFTER 8]  │
│  ───────────────────                                                                   │
│  Work:                                                                                 │
│  • Weekly/monthly progress summaries                                                   │
│  • Export for stakeholders                                                             │
│  • Coverage status per campaign                                                        │
│  Est: Medium                                                                           │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## P3: Polish (Later)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  FEATURE 10: Concierge Context                                                         │
│  • Feed campaign knowledge into concierge                                              │
│  • Scope queries to specific project/expert                                            │
│  • Citation to source sessions                                                         │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Execution Plan

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  PHASE 1: MVP for Pilots (End of January)                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                 │  │
│  │  PARALLEL                              SEQUENTIAL                               │  │
│  │  ─────────                             ──────────                               │  │
│  │  ┌─────────────┐ ┌─────────────┐       ┌─────────────┐                         │  │
│  │  │ F1: Form    │ │ F2: Partic- │       │ F4: Session │                         │  │
│  │  │ Updates     │ │ ipants      │──────▶│ ↔ Person    │                         │  │
│  │  └─────────────┘ └─────────────┘       └─────────────┘                         │  │
│  │                                               │                                 │  │
│  │  ┌─────────────┐                              │                                 │  │
│  │  │ F3: Topics  │                              ▼                                 │  │
│  │  │ Refactor    │───────────────────────▶┌─────────────┐                         │  │
│  │  └─────────────┘                        │ F5: Campaign│                         │  │
│  │                                         │ Detail Tabs │                         │  │
│  │                                         └─────────────┘                         │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  PHASE 2: Post-Pilot Enhancements                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                 │  │
│  │  PARALLEL                              SEQUENTIAL                               │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐    ┌───────────┐                    │  │
│  │  │F6:Managers│ │F7:Partici-│ │F8:Know-   │───▶│F9:Reports │                    │  │
│  │  │           │ │pant Input │ │ledge Base │    │           │                    │  │
│  │  └───────────┘ └───────────┘ └───────────┘    └───────────┘                    │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Cases Supported

### Expert Campaign (Primary)
- Person leaving/retiring
- Time-bound knowledge capture
- Collaborator input for context
- Multiple sessions with single expert

### Project Campaign (Secondary)
- Business process documentation
- Multiple participants
- One-time capture for process mapping
- Manager input for scoping

---

## Next Steps

1. **P1 completion** - MVP ready for pilot clients (end of January)
2. **Pilot feedback** - Iterate based on Banorte, CNA, etc.
3. **P2 build** - Post-pilot enhancements based on learnings
