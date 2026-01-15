# Campaign Flows

## Two Entry Points, Same Core

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  PROJECT CAMPAIGN                         EXPERT CAMPAIGN                              │
│  "Document Verify Automation"             "Alex leaving in 4 weeks"                    │
│                                                                                        │
│  ┌──────────────────────────────────┐     ┌──────────────────────────────────┐        │
│  │ SCOPE                            │     │ SCOPE                            │        │
│  │ ┌────────────┐ ┌───────────────┐ │     │ ┌────────────┐ ┌───────────────┐ │        │
│  │ │ Managers   │ │ Participants  │ │     │ │ Collabs    │ │ Expert        │ │        │
│  │ │ "Ask Maria │ │ Self-report + │ │     │ │ "Ask about │ │ Self-assess   │ │        │
│  │ │  about X"  │ │ suggest for   │ │     │ │  X, Y, Z"  │ │ "I know X"    │ │        │
│  │ │            │ │ others        │ │     │ │            │ │               │ │        │
│  │ └────────────┘ └───────────────┘ │     │ └────────────┘ └───────────────┘ │        │
│  └──────────────────────────────────┘     └──────────────────────────────────┘        │
│                 │                                        │                             │
│                 │         ┌──────────────────┐           │                             │
│                 └────────▶│   AI SYNTHESIS   │◀──────────┘                             │
│                           │ → Topics/person  │                                         │
│                           │ → Questions      │                                         │
│                           │ → Session plan   │                                         │
│                           └────────┬─────────┘                                         │
│                                    │                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              SHARED CORE                                          │ │
│  │                                                                                   │ │
│  │  CAPTURE              PROCESS              STORE                CONSUME           │ │
│  │  ┌─────────┐         ┌─────────┐         ┌─────────┐          ┌─────────┐        │ │
│  │  │Sessions │────────▶│AI Extract│───────▶│Knowledge│─────────▶│Reports  │        │ │
│  │  │(human/AI)│        │+ Gaps    │        │Base     │          │Concierge│        │ │
│  │  └─────────┘         └─────────┘         └─────────┘          └─────────┘        │ │
│  │                                                                                   │ │
│  │  Project: Sessions with MULTIPLE participants                                     │ │
│  │  Expert:  Sessions with ONE expert (multiple times)                               │ │
│  │                                                                                   │ │
│  └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  CAMPAIGN                                                                              │
│  ├── type: 'project' | 'expert'                                                       │
│  ├── name, description, organizer                                                      │
│  │                                                                                     │
│  ├── PEOPLE                                                                            │
│  │   ┌─────────────────────────────────┬─────────────────────────────────┐            │
│  │   │ Project                         │ Expert                          │            │
│  │   ├─────────────────────────────────┼─────────────────────────────────┤            │
│  │   │ Managers (suggest topics)       │ Expert (interviewed)            │            │
│  │   │ Participants (interviewed)      │ Collaborators (suggest topics)  │            │
│  │   └─────────────────────────────────┴─────────────────────────────────┘            │
│  │                                                                                     │
│  ├── TOPICS (what to capture, with attribution: who suggested)                        │
│  │                                                                                     │
│  └── SESSIONS (linked to person, covers topics, produces knowledge)                   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Input Channels (Human + AI Agents)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │Live Sessions │  │ Async Text   │  │ API Push     │  │ Integrations │               │
│  │ (human)      │  │ (human/AI)   │  │ (AI agents)  │  │ (tools)      │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         └─────────────────┴─────────────────┴─────────────────┘                        │
│                                    │                                                   │
│                                    ▼                                                   │
│                           ┌───────────────┐                                            │
│                           │ Knowledge Base│───────▶ Reports + Concierge                │
│                           └───────────────┘                                            │
│                                                                                        │
│  Human: WHY (reasoning, tacit knowledge)    AI Agent: WHAT (changes, decisions)        │
│                                                                                        │
│  Design: API-first, structured schema, attribution, webhooks, MCP-compatible           │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  1. TWO ENTRY POINTS       Project / Expert (same core, different scoping)             │
│  2. CROWDSOURCED SCOPE     Managers + participants + collaborators provide input       │
│  3. MULTIPLE CHANNELS      Sessions, async, API, integrations (human + AI)             │
│  4. AI-NATIVE              API-first, structured, attributed, MCP-compatible           │
│  5. UNIFIED OUTPUT         Knowledge base → Reports (push) + Concierge (pull)          │
│  6. PERSON × PROJECT       Topics scoped per person per project (multi-project people) │
│  7. FULL EXTRACTION        Goal: get EVERYTHING out, not surface-level                 │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Coverage Model

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  TOPIC COVERAGE DEPTH                                                                  │
│  ───────────────────                                                                   │
│                                                                                        │
│  ░░░░░░░░░░  SURFACE      Basic facts captured, many unknowns remain                  │
│  ▓▓▓▓░░░░░░  PARTIAL      Core knowledge captured, some follow-ups pending            │
│  ██████████  COMPLETE     Deep understanding, all follow-ups resolved                 │
│                                                                                        │
│  AI tracks per topic:                                                                  │
│  • Questions asked vs follow-ups generated                                            │
│  • Confidence score from transcript analysis                                          │
│  • Ambiguities and contradictions detected                                            │
│  • "I don't know" vs "I haven't been asked yet"                                       │
│                                                                                        │
│  MULTI-PROJECT PARTICIPANTS                                                           │
│  ─────────────────────────                                                            │
│  Same person on Projects A, B, C = 3 separate topic sets                              │
│  Smart scheduling: batch interviews efficiently when person spans projects            │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
