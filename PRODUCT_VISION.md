# Product Vision: Tacit Knowledge Capture

## What is Tacit Knowledge?

Expertise that's hard to articulate—intuitions, judgment calls, and "know-how" that experts have but struggle to document.

```
EXPLICIT KNOWLEDGE          TACIT KNOWLEDGE
(Easy to capture)           (Walks out the door)
─────────────────           ──────────────────
Procedures                  "I just know it'll fail"
Documentation               Reading team dynamics
Facts & data                Debugging intuition
How-to guides               Unwritten workarounds
```

---

## The Three-Phase Pipeline

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   1. INGEST           2. INTERVIEW           3. STRUCTURE         │
│   ─────────           ────────────           ───────────          │
│                                                                    │
│   Analyze docs        Guided deep-dive       Extract insights     │
│   Build context   →   Informed questions  →  Organize & index     │
│   Identify gaps       Probe reasoning        Knowledge graph      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Why this approach works:**

- Avoid wasting interview time on documented things
- Probe gaps and contradictions
- AI asks better questions when it "knows" the domain

---

## Phase 1: Ingest Sources

The more context we gather upfront, the better the interview questions. Sources fall into two categories:

### About the Person

```
┌────────────────────────┬─────────────────────────────────────────┬─────────────────┐
│ Source Type            │ What We Learn                           │ Integration     │
├────────────────────────┼─────────────────────────────────────────┼─────────────────┤
│ LinkedIn               │ Career history, skills, endorsements    │ API or manual   │
│ Resume or CV           │ Background, expertise claims            │ Upload          │
│ HR Systems             │ Role history, tenure, team changes      │ HRIS API        │
│ Performance Reviews    │ Strengths, growth areas, key projects   │ Manual or API   │
│ Manager Input          │ What to prioritize, known expertise     │ Survey or form  │
│ Org Chart              │ Reporting lines, cross-team links       │ HR system       │
│ Calendar               │ Meeting patterns, key collaborators     │ Google, Outlook │
│ Email Signature History│ Title evolution, responsibility growth  │ Manual          │
└────────────────────────┴─────────────────────────────────────────┴─────────────────┘
```

### About the Project or Work

```
┌──────────────────────┬───────────────────────────────────────┬────────────────────┐
│ Source Type          │ What We Learn                         │ Integration        │
├──────────────────────┼───────────────────────────────────────┼────────────────────┤
│ Code Repositories    │ Ownership, commit history, PR reviews │ GitHub, GitLab     │
│ Documentation        │ Existing knowledge, gaps, stale docs  │ Confluence, Notion │
│ Wikis and READMEs    │ System context, setup guides          │ Git, wiki API      │
│ Ticket Systems       │ Issues tackled, decisions made        │ Jira, Linear       │
│ Design Docs          │ Architecture decisions, trade-offs    │ Docs upload        │
│ Runbooks             │ Operational knowledge, procedures     │ Upload or wiki     │
│ Incident Reports     │ Crisis handling, root causes          │ PagerDuty, upload  │
│ Meeting Recordings   │ Discussions, decisions, context       │ Zoom, Teams        │
│ Chat History         │ Informal knowledge, Q&A patterns      │ Slack, Teams       │
│ Email Threads        │ Decisions, stakeholder context        │ Manual or API      │
│ Shared Drives        │ Docs, spreadsheets, presentations     │ GDrive, Dropbox    │
│ CRM Data             │ Client relationships, deal history    │ Salesforce, HubSpot│
│ Analytics Dashboards │ Metrics ownership, KPIs tracked       │ Manual             │
│ Architecture Diagrams│ System understanding, dependencies    │ Upload             │
└──────────────────────┴───────────────────────────────────────┴────────────────────┘
```

### Source Priority Matrix

```
                        HIGH VALUE
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        │  Code repos       │  Meeting          │
        │  Incident reports │  recordings       │
        │  Design docs      │  Chat history     │
        │                   │                   │
  EASY ─┼───────────────────┼───────────────────┼─ HARD
  ACCESS│                   │                   │  ACCESS
        │  Documentation    │  Performance      │
        │  Wikis            │  reviews          │
        │  Org chart        │  Email threads    │
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                        LOW VALUE
```

### What We Extract from Sources

```
Source          Extracted Context
------          -----------------
Code repos      Systems owned, contribution patterns
Tickets         Problems solved, decision rationale
Docs            Existing knowledge (to avoid re-asking)
Chat history    Informal expertise, who asks them questions
Calendar        Key collaborators, meeting ownership
Incidents       Crisis expertise, undocumented fixes
```

---

## Workplace Use Cases

```
┌───────────────────────────┬─────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────┐
│ Use Case                  │ Trigger                         │ Urgency  │ Examples                                                  │
├───────────────────────────┼─────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────┤
│ Role Transition           │ Someone leaving or changing     │ High     │ Employee offboarding, leadership change, contractor      │
│                           │ their role                      │          │ wrap-up, retirement, promotion to new team               │
├───────────────────────────┼─────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────┤
│ Ownership Transfer        │ Responsibility changing hands   │ Med-High │ Project handoff, account transition, system ownership    │
│                           │                                 │          │ change, client relationship transfer                     │
├───────────────────────────┼─────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────┤
│ New Joiner Ramp-up        │ New person needs to get up      │ Medium   │ New hire onboarding, team member rotation, internal      │
│                           │ to speed quickly                │          │ transfer, consultant joining project                     │
├───────────────────────────┼─────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────┤
│ Event-based Learning      │ After significant events        │ High     │ Post-incident review, project retrospective, launch      │
│                           │ (good or bad)                   │          │ debrief, failed initiative analysis, milestone review    │
├───────────────────────────┼─────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────┤
│ Continuous Capture        │ Ongoing rhythm of work          │ Low      │ Daily standups, weekly updates, decision logs,           │
│                           │                                 │          │ meeting notes, work journals                             │
├───────────────────────────┼─────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────┤
│ Proactive Expert Capture  │ Knowledge concentration risk    │ Medium   │ SME documentation, legacy system archaeology,            │
│                           │ identified                      │          │ tribal knowledge extraction, process documentation       │
├───────────────────────────┼─────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────┤
│ Cross-boundary Alignment  │ Multiple groups need shared     │ Medium   │ Cross-team initiatives, M&A integration, department      │
│                           │ understanding                   │          │ merger, vendor collaboration, partnership kickoff        │
└───────────────────────────┴─────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────┘
```

---

## Capture Dimensions

```
By Knowledge Holder       By Cadence           By Knowledge Type
-------------------       ----------           -----------------
Solo expert               One-time deep dive   Decision rationale
Departing employee        Recurring updates    Troubleshooting
Cross-functional team     Milestone-based      Process or workflow
External contractor       On-demand capture    Political context
                                               Historical context
```

---

## Open Design Questions

### 1. Interview Format

**Key question:** How do we actually conduct the knowledge capture conversation?

```
┌─────────────────┬─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│ Dimension       │ Option A                        │ Option B                        │ Option C                        │
├─────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ Timing          │ SYNCHRONOUS                     │ ASYNCHRONOUS                    │ HYBRID                          │
│                 │ Real-time conversation          │ Chat-based, self-paced          │ Mix of both                     │
│                 │ + Rich, natural dialogue        │ + Flexible for busy experts     │ + Best of both worlds           │
│                 │ + Can read body language        │ + Expert can think deeply       │ - More complex to orchestrate   │
│                 │ - Scheduling friction           │ - Loses conversational flow     │                                 │
│                 │ - Time pressure                 │ - May drag on forever           │                                 │
├─────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ Medium          │ VIDEO/AUDIO                     │ TEXT ONLY                       │ SCREEN SHARE + VOICE            │
│                 │ Face-to-face or video call      │ Chat interface                  │ Show while telling              │
│                 │ + Natural communication         │ + Easy to process/search        │ + Captures context visually     │
│                 │ + Captures tone, emphasis       │ + Less intimidating             │ + "Show me how you do X"        │
│                 │ - Harder to transcribe          │ - Loses nuance                  │ - Requires more setup           │
│                 │ - Recording concerns            │ - Typing fatigue                │                                 │
├─────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ Facilitator     │ HUMAN-LED                       │ AI-LED                          │ HYBRID                          │
│                 │ Trained interviewer             │ AI agent asks questions         │ AI assists human interviewer    │
│                 │ + Builds rapport, trust         │ + Scalable, consistent          │ + Human warmth + AI memory      │
│                 │ + Handles sensitive topics      │ + Available anytime             │ + AI suggests follow-ups        │
│                 │ - Expensive, doesn't scale      │ - May feel impersonal           │ - Coordination overhead         │
│                 │ - Interviewer skill varies      │ - Misses social cues            │                                 │
├─────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ Session Length  │ SHORT (15-30 min)               │ MEDIUM (45-60 min)              │ LONG (90+ min)                  │
│                 │ Frequent, focused sessions      │ Standard meeting length         │ Deep dive sessions              │
│                 │ + Easy to schedule              │ + Enough depth                  │ + Comprehensive coverage        │
│                 │ + Less fatigue                  │ + Familiar format               │ - Fatigue, diminishing returns  │
│                 │ - May feel rushed               │ - May need multiple             │ - Hard to schedule              │
├─────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ Frequency       │ SINGLE SESSION                  │ SERIES (3-6 sessions)           │ ONGOING                         │
│                 │ One comprehensive interview     │ Multiple planned sessions       │ Continuous capture over time    │
│                 │ + Simple, contained             │ + Can go deeper each time       │ + Captures evolution            │
│                 │ - Limited depth                 │ + Time to reflect between       │ - No clear end point            │
│                 │ - Pressure to cover everything  │ - Requires commitment           │ - May lose momentum             │
└─────────────────┴─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

**Question types to explore:**

```
Type                    Purpose                              Example
----                    -------                              -------
Situational             Capture context-specific knowledge   "What do you do when X happens?"
Process walkthrough     Document how things actually work    "Walk me through how you handle Y"
Decision rationale      Understand the 'why'                 "Why did you choose this approach?"
Edge cases              Surface undocumented exceptions      "What's the weirdest case you've seen?"
Hypothetical            Test boundaries of knowledge         "What would you do if Z happened?"
Relationship mapping    Understand dependencies              "Who do you go to for help with X?"
Historical context      Capture institutional memory         "Why is the system built this way?"
```

---

### 2. Output Formats

**Key question:** What form should captured knowledge take?

```
┌─────────────────────┬────────────────────────────────┬────────────────────────────────┬─────────────────────────┐
│ Format              │ Best For                       │ Pros                           │ Cons                    │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Searchable Docs     │ Reference material, procedures │ Familiar, easy to create       │ Hard to keep current    │
│                     │                                │ Works with existing tools      │ Can become stale        │
│                     │                                │ Easy to share                  │ Passive consumption     │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Q&A Pairs           │ FAQs, common questions         │ Direct answers to questions    │ Limited to known Qs     │
│                     │                                │ Easy to consume                │ No context/nuance       │
│                     │                                │ Can power chatbots             │ May oversimplify        │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Decision Trees      │ Troubleshooting, triage        │ Clear action paths             │ Rigid, hard to update   │
│                     │                                │ Reduces ambiguity              │ Doesn't capture nuance  │
│                     │                                │ Good for new people            │ Complex to create       │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Knowledge Graphs    │ Relationships, dependencies    │ Shows connections              │ Hard to build/maintain  │
│                     │                                │ Visual understanding           │ Requires tooling        │
│                     │                                │ Enables discovery              │ Learning curve          │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Runbooks/Playbooks  │ Operational procedures         │ Step-by-step actionable        │ Assumes known scenarios │
│                     │                                │ Reduces errors                 │ May not cover edge cases│
│                     │                                │ Good for on-call               │ Needs regular updates   │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Video Snippets      │ Demos, visual processes        │ Shows not just tells           │ Hard to search          │
│                     │                                │ Captures personality           │ Time-consuming to watch │
│                     │                                │ Good for complex UIs           │ Storage intensive       │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Annotated Examples  │ Code, designs, decisions       │ Real context                   │ May become outdated     │
│                     │                                │ Shows actual artifacts         │ Needs curation          │
│                     │                                │ Learn from real cases          │                         │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ AI-Queryable Base   │ On-demand answers              │ Natural language access        │ Black box concerns      │
│                     │                                │ Scales well                    │ May hallucinate         │
│                     │                                │ Always available               │ Trust issues            │
└─────────────────────┴────────────────────────────────┴────────────────────────────────┴─────────────────────────┘
```

**Output could be layered:**

```
Layer 1: Raw          │  Transcripts, recordings, notes
        ↓             │
Layer 2: Structured   │  Extracted insights, tagged topics, Q&A pairs
        ↓             │
Layer 3: Synthesized  │  Knowledge graphs, summaries, runbooks
        ↓             │
Layer 4: Interactive  │  AI assistant, searchable base, decision support
```

---

### 3. Knowledge Validation

**Key question:** How do we ensure captured knowledge is accurate and complete?

```
┌─────────────────────┬────────────────────────────────────────────────────────────────────────────┐
│ Validation Method   │ Description                                                                │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Expert Review       │ Source expert reviews and approves captured content                        │
│                     │ + They know best what they meant                                           │
│                     │ - Time consuming, experts are busy                                         │
│                     │ - May miss their own blind spots                                           │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Peer Review         │ Colleagues review for accuracy and gaps                                    │
│                     │ + Catches blind spots                                                      │
│                     │ + Multiple perspectives                                                    │
│                     │ - May introduce conflicting views                                          │
│                     │ - Requires coordination                                                    │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Consumer Testing    │ People who need the knowledge try to use it                                │
│                     │ + Tests real-world usefulness                                              │
│                     │ + Reveals gaps in explanation                                              │
│                     │ - Happens after the fact                                                   │
│                     │ - May be too late if expert left                                           │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Cross-Reference     │ Compare against existing docs, code, systems                               │
│                     │ + Automated consistency checks                                             │
│                     │ + Finds contradictions                                                     │
│                     │ - Existing docs may also be wrong                                          │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Scenario Testing    │ Walk through specific scenarios with captured knowledge                    │
│                     │ + Practical validation                                                     │
│                     │ + Reveals missing steps                                                    │
│                     │ - Limited to tested scenarios                                              │
└─────────────────────┴────────────────────────────────────────────────────────────────────────────┘
```

**Completeness signals:**

```
Signal                          Indicates
------                          ---------
Coverage percentage             How much of identified topics are documented
Confidence scores               AI certainty in extracted knowledge
Gap analysis                    Topics mentioned but not explained
Follow-up question count        Decreasing = converging on completeness
Consumer feedback               Questions that can't be answered = gaps
Time since last update          Staleness risk
```

---

### 4. Conflict Resolution

**Key question:** What happens when experts disagree or knowledge contradicts?

```
┌─────────────────────┬────────────────────────────────────────────────────────────────────────────┐
│ Approach            │ Description                                                                │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Flag & Surface      │ Mark contradictions explicitly, don't resolve                              │
│                     │ "Expert A says X, Expert B says Y"                                         │
│                     │ + Preserves all perspectives                                               │
│                     │ + Honest about uncertainty                                                 │
│                     │ - Consumer must decide                                                     │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Context-Based       │ Both are right in different contexts                                       │
│                     │ "In situation A, do X. In situation B, do Y"                               │
│                     │ + Often the actual truth                                                   │
│                     │ + Captures nuance                                                          │
│                     │ - Requires understanding context                                           │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Recency Wins        │ Most recent information takes precedence                                   │
│                     │ + Simple rule                                                              │
│                     │ + Often reflects current state                                             │
│                     │ - Newer isn't always better                                                │
│                     │ - Loses historical context                                                 │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Authority Ranking   │ Some experts' views weighted higher                                        │
│                     │ + Clear hierarchy                                                          │
│                     │ - Political, may alienate                                                  │
│                     │ - Authority ≠ correctness                                                  │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Consensus Building  │ Bring experts together to resolve                                          │
│                     │ + Proper resolution                                                        │
│                     │ + Builds shared understanding                                              │
│                     │ - Time consuming                                                           │
│                     │ - May not always be possible                                               │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ Version Control     │ Track changes over time like code                                          │
│                     │ + Full history preserved                                                   │
│                     │ + Can see evolution                                                        │
│                     │ - Complexity for consumers                                                 │
└─────────────────────┴────────────────────────────────────────────────────────────────────────────┘
```

**Types of conflicts:**

```
Conflict Type         Example                                   Likely Resolution
-------------         -------                                   -----------------
Factual               "The timeout is 30s" vs "60s"             Verify in code/config
Procedural            Different steps for same process          Context-based or recency
Opinion/Preference    "I prefer X approach"                     Flag both, let consumer choose
Outdated vs Current   Old way vs new way                        Recency + flag historical
Incomplete            One expert knows part A, other part B     Merge into complete picture
```

---

### 5. Integration & Retrieval

**Key question:** Where does knowledge live and how do people find it?

```
┌─────────────────────┬────────────────────────────────┬────────────────────────────────┬─────────────────────────┐
│ Storage Option      │ Description                    │ Pros                           │ Cons                    │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Standalone System   │ Dedicated knowledge platform   │ Purpose-built features         │ Another tool to check   │
│                     │                                │ Optimized for this use case    │ Adoption friction       │
│                     │                                │ Full control                   │ Maintenance burden      │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Existing Wiki       │ Confluence, Notion, etc.       │ Already adopted                │ May get buried          │
│                     │                                │ Familiar interface             │ Limited structure       │
│                     │                                │ No new tool                    │ Search quality varies   │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Code Repository     │ Markdown in repo               │ Close to code                  │ Not for non-devs        │
│                     │                                │ Version controlled             │ Limited discoverability │
│                     │                                │ Review process built-in        │                         │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Chat Integration    │ Slack/Teams bot                │ Where people already are       │ Ephemeral context       │
│                     │                                │ Low friction to query          │ Not great for browsing  │
│                     │                                │ Natural interaction            │ May miss structure      │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ Multiple + Sync     │ Push to multiple destinations  │ Meet people where they are     │ Sync complexity         │
│                     │                                │ Redundancy                     │ Consistency challenges  │
└─────────────────────┴────────────────────────────────┴────────────────────────────────┴─────────────────────────┘
```

**Retrieval methods:**

```
Method              How It Works                              Best For
------              ------------                              --------
Search              Keyword/semantic search                   Known questions
Browse              Navigate taxonomy/categories              Exploration, learning
AI Chat             Ask questions in natural language         On-demand answers
Push/Notify         Proactive alerts when relevant            Time-sensitive knowledge
Embedded            Surfaces in context (IDE, ticket, etc.)   In-workflow access
Subscription        Follow topics/experts for updates         Staying current
```

**Integration touchpoints:**

```
Where People Work          Integration Opportunity
-----------------          -----------------------
IDE                        Surface relevant knowledge while coding
Ticket System              Show related knowledge on issues
Slack/Teams                Bot that answers questions
Onboarding                 Curated knowledge paths for new joiners
Meetings                   Pre-populate context for handoffs
Incident Response          Surface runbooks automatically
```

---

### 6. User Personas

**Key question:** Who are the key players and what do they need?

```
┌─────────────────────┬────────────────────────────────┬────────────────────────────────┬─────────────────────────┐
│ Persona             │ Role in System                 │ Needs                          │ Concerns                │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ KNOWLEDGE HOLDER    │ The expert being interviewed   │ Easy, low-friction process     │ Time commitment         │
│ (Source)            │                                │ Feel valued, not extracted     │ Will I look dumb?       │
│                     │                                │ See impact of contribution     │ Is this actually useful?│
│                     │                                │ Control over what's shared     │ Privacy of opinions     │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ INTERVIEWER         │ Conducts the capture session   │ Good questions to ask          │ Am I asking right Qs?   │
│ (Facilitator)       │                                │ Context about the expert       │ How deep to go?         │
│                     │                                │ Tools to capture insights      │ Managing time           │
│                     │                                │ Training on technique          │ Building rapport        │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ KNOWLEDGE CONSUMER  │ Uses the captured knowledge    │ Find answers quickly           │ Is this still accurate? │
│ (User)              │                                │ Trust the information          │ Who do I ask if stuck?  │
│                     │                                │ Context for decisions          │ Information overload    │
│                     │                                │ Know what they don't know      │ Knowing what exists     │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ CAPTURE INITIATOR   │ Triggers the capture process   │ Know when capture is needed    │ Getting buy-in          │
│ (Sponsor)           │                                │ Track progress and coverage    │ Prioritizing what/who   │
│                     │                                │ Measure value/ROI              │ Resource allocation     │
│                     │                                │ Ensure completion              │ Expert availability     │
├─────────────────────┼────────────────────────────────┼────────────────────────────────┼─────────────────────────┤
│ KNOWLEDGE CURATOR   │ Maintains and organizes        │ Tools to structure content     │ Keeping things current  │
│ (Maintainer)        │                                │ Identify gaps and overlaps     │ Quality control         │
│                     │                                │ Retire outdated content        │ Scale of maintenance    │
│                     │                                │ Connect related knowledge      │                         │
└─────────────────────┴────────────────────────────────┴────────────────────────────────┴─────────────────────────┘
```

**Persona journeys:**

```
KNOWLEDGE HOLDER JOURNEY
------------------------
Invited to participate → Understand why/value → Prepare (optional) →
Interview session(s) → Review captured content → Approve/refine →
See knowledge being used → Feel valued

KNOWLEDGE CONSUMER JOURNEY
--------------------------
Have a question/problem → Search or ask → Find relevant knowledge →
Understand context → Apply to situation → Give feedback if gaps →
Contribute own learnings
```

**Who initiates capture (by use case):**

```
Use Case                    Likely Initiator
--------                    ----------------
Role Transition             Manager, HR, or departing person
Ownership Transfer          Current owner or receiving party
New Joiner Ramp-up          Manager or onboarding buddy
Event-based Learning        Team lead or incident commander
Continuous Capture          Self-initiated or team ritual
Proactive Expert Capture    Manager, knowledge lead, or risk flag
Cross-boundary Alignment    Project lead or exec sponsor
```

---

## Structural Decision: Person vs Project vs Both

**Key question:** What is the primary organizing unit for knowledge capture?

### The Options

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   PERSON-CENTRIC              PROJECT-CENTRIC             HYBRID                        │
│   ──────────────              ───────────────             ──────                        │
│                                                                                         │
│   Knowledge belongs           Knowledge belongs           Knowledge linked              │
│   to a person                 to a project/domain         to both                       │
│                                                                                         │
│   "Sarah's expertise"         "Deployment system docs"    "Sarah's knowledge about      │
│                                                            the deployment system"       │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Comparison

```
┌─────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│ Dimension       │ PERSON-CENTRIC                  │ PROJECT-CENTRIC                 │
├─────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ Primary unit    │ Person/Expert                   │ Project/System/Domain           │
│                 │                                 │                                 │
│ Documents       │ Tagged to person who knows it   │ Tagged to project it's about    │
│ tagged by       │ "Sarah's docs"                  │ "Deployment docs"               │
│                 │                                 │                                 │
│ Knowledge       │ "What does Sarah know?"         │ "What do we know about X?"      │
│ question        │                                 │                                 │
│                 │                                 │                                 │
│ Best for        │ Offboarding, role transitions   │ Project handoffs, onboarding    │
│ use cases       │ Expert capture                  │ System documentation            │
│                 │                                 │                                 │
│ Gap analysis    │ "What hasn't Sarah shared yet?" │ "What's undocumented about X?"  │
│                 │                                 │                                 │
│ Interview       │ "Tell me everything you know"   │ "Tell me about this system"     │
│ focus           │                                 │                                 │
│                 │                                 │                                 │
│ Knowledge       │ Travels with the person         │ Stays with the project          │
│ lifespan        │ (their expertise portfolio)     │ (institutional memory)          │
│                 │                                 │                                 │
│ Risk addressed  │ "Sarah is leaving, capture      │ "No one knows how this works,   │
│                 │  what she knows"                │  let's document it"             │
│                 │                                 │                                 │
│ Downside        │ Same knowledge captured         │ Loses the "who knows this"      │
│                 │ multiple times per project      │ context and relationships       │
└─────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

### The Reality: Knowledge Has Multiple Dimensions

```
                                 ┌─────────────────────┐
                                 │     KNOWLEDGE       │
                                 │                     │
                                 │  "How to handle     │
                                 │   deployment        │
                                 │   rollbacks"        │
                                 │                     │
                                 └──────────┬──────────┘
                                            │
        ┌───────────────┬───────────────────┼───────────────────┬───────────────┐
        │               │                   │                   │               │
        ▼               ▼                   ▼                   ▼               ▼
   ┌─────────┐    ┌──────────┐       ┌──────────┐       ┌──────────┐    ┌──────────┐
   │ WHO     │    │ WHAT     │       │ WHICH    │       │ WHEN     │    │ WHY      │
   │         │    │ PROJECT  │       │ TEAM     │       │          │    │          │
   │ Sarah   │    │          │       │          │       │ Prod env │    │ Use case │
   │ Mike    │    │ Payments │       │ Eng team │       │ After v2 │    │ Offboard │
   └─────────┘    └──────────┘       └──────────┘       └──────────┘    └──────────┘
```

### The Team Dimension

Same project, different team perspectives:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   PROJECT: "Mobile App Redesign"                                                        │
│                                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│   │ ENGINEERING     │  │ DESIGN          │  │ PRODUCT         │  │ MARKETING       │   │
│   │                 │  │                 │  │                 │  │                 │   │
│   │ • Architecture  │  │ • Design system │  │ • Requirements  │  │ • Launch plan   │   │
│   │ • Tech debt     │  │ • User research │  │ • Prioritization│  │ • Messaging     │   │
│   │ • Performance   │  │ • Prototypes    │  │ • Stakeholders  │  │ • Positioning   │   │
│   │ • Integrations  │  │ • Accessibility │  │ • Roadmap       │  │ • Competitors   │   │
│   │                 │  │                 │  │                 │  │                 │   │
│   │ Sarah, Mike     │  │ Alex, Jordan    │  │ Pat, Chris      │  │ Sam, Taylor     │   │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                                         │
│   Same project, completely different knowledge domains                                  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Why teams matter:**

```
Scenario                              Without Team Context           With Team Context
--------                              --------------------           -----------------
"Capture knowledge about              One giant interview            Separate sessions per
the Mobile App project"               covering everything            team's perspective

"What do we know about                Mixed bag of info              Filtered by team:
the Mobile App?"                      from all angles                "Show me Eng knowledge"

"Sarah is leaving"                    Capture everything             Focus on her team's
                                      she knows                      domain (Engineering)

Gap analysis                          "Project has gaps"             "Eng covered, Design
                                                                     has gaps, Marketing
                                                                     not captured yet"
```

### Recommended: Hybrid with Capture Sessions as Core Unit

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   CAPTURE SESSION (Core Unit)                                                           │
│   ────────────────────────────                                                          │
│                                                                                         │
│   A capture session links:                                                              │
│   • WHO: The person being interviewed                                                   │
│   • WHAT: The project/system/domain being discussed                                     │
│   • WHY: The use case (offboarding, handoff, etc.)                                      │
│   • WHEN: Timestamp, context                                                            │
│                                                                                         │
│   Example:                                                                              │
│   "Session with Sarah about the Deployment System for her offboarding"                  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Proposed Data Model

```
ENTITIES
--------

Organization
    └── has many Teams
    └── has many Projects
    └── has many People

Team
    └── belongs to Organization
    └── has many People (members)
    └── has many Projects (works on)
    └── has many Documents (team-specific)
    └── has Knowledge Domain (what this team knows about)

    Examples: Engineering, Design, Product, Marketing, Sales, Support

Person
    └── belongs to Team(s) - can be on multiple teams
    └── has many Documents (their personal docs, notes)
    └── has many Capture Sessions (as knowledge holder)
    └── has many Expertise Tags
    └── has Role (within team)

Project/Domain
    └── has many Teams (working on it)
    └── has many Documents (project docs, code, etc.)
    └── has many Capture Sessions (about this project)
    └── has many People (who know about it)

Capture Session
    └── belongs to Person (who's being interviewed)
    └── belongs to Project (what it's about) [optional]
    └── belongs to Team (which perspective) [optional]
    └── has Use Case type (offboarding, handoff, etc.)
    └── has many Source Documents (ingested for context)
    └── has many Insights (extracted knowledge)
    └── has Transcript
    └── has Knowledge Graph (generated)

Document
    └── can be tagged to Person (who wrote/owns it)
    └── can be tagged to Project (what it's about)
    └── can be tagged to Team (which team's perspective)
    └── has content, embeddings, metadata

Insight/Knowledge
    └── extracted from Capture Session
    └── linked to Person (who shared it)
    └── linked to Project (what it's about)
    └── linked to Team (which perspective)
    └── can be queried by any dimension
```

**Entity Relationships Visual:**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                              ORGANIZATION                                               │
│                                    │                                                    │
│                 ┌──────────────────┼──────────────────┐                                │
│                 │                  │                  │                                │
│                 ▼                  ▼                  ▼                                │
│            ┌─────────┐       ┌──────────┐       ┌──────────┐                          │
│            │  TEAMS  │       │  PEOPLE  │       │ PROJECTS │                          │
│            └────┬────┘       └────┬─────┘       └────┬─────┘                          │
│                 │                 │                  │                                 │
│                 │    ┌────────────┴────────────┐     │                                │
│                 │    │                         │     │                                 │
│                 └────┼─────────────────────────┼─────┘                                │
│                      │                         │                                       │
│                      ▼                         ▼                                       │
│               ┌─────────────┐          ┌─────────────┐                                │
│               │  CAPTURE    │          │  DOCUMENTS  │                                │
│               │  SESSIONS   │          │             │                                │
│               └──────┬──────┘          └─────────────┘                                │
│                      │                                                                 │
│                      ▼                                                                 │
│               ┌─────────────┐                                                         │
│               │  INSIGHTS   │                                                         │
│               │  KNOWLEDGE  │                                                         │
│               └─────────────┘                                                         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Query examples with team dimension:**

```
Query                                          Returns
-----                                          -------
"What does Engineering know about              Insights from Eng team members
the Mobile App?"                               about Mobile App project

"What does Sarah know?"                        All of Sarah's insights
                                               (across all teams/projects)

"What's the Design team's view on              Design-tagged insights for
the Mobile App?"                               Mobile App project

"What are the gaps in Marketing's              Topics mentioned but not
knowledge about Mobile App?"                   captured from Marketing team

"Who on the Product team knows                 People with insights tagged
about pricing decisions?"                      to Product + pricing topic
```

### How It Works in Practice

**Scenario 1: Sarah is leaving (Person-centric trigger)**
```
1. Create capture campaign for Sarah (person)
2. System finds all projects Sarah is linked to
3. Ingest docs tagged to Sarah + docs from her projects
4. Generate gaps: "What does Sarah know that's not documented?"
5. Interview sessions organized by project/topic
6. Knowledge stored linked to both Sarah AND each project
7. After Sarah leaves: knowledge persists on projects
```

**Scenario 2: Documenting the Payment System (Project-centric trigger)**
```
1. Create capture campaign for Payment System (project)
2. System finds all people linked to Payment System
3. Ingest docs tagged to Payment System
4. Generate gaps: "What's undocumented about Payment System?"
5. Interview multiple people who know parts of it
6. Knowledge stored linked to Payment System AND each person
7. Later: Can see "Mike contributed this insight"
```

**Scenario 3: New designer joining Mobile App project (Team-centric trigger)**
```
1. New designer Alex joins, needs to ramp up on Mobile App
2. System shows: "Mobile App has knowledge from Eng, Product, but not Design"
3. Identify: Jordan (Design team) worked on Mobile App but wasn't captured
4. Create capture session: Jordan (person) + Mobile App (project) + Design (team)
5. Interview focuses on design-specific knowledge:
   - Design system decisions
   - User research findings
   - Prototype iterations
   - Accessibility considerations
6. Knowledge stored with all three tags
7. Alex (new joiner) can now query: "Design knowledge about Mobile App"
```

**Scenario 4: Cross-team alignment (Team-centric trigger)**
```
1. Engineering and Product teams have different understanding of Mobile App scope
2. Create capture sessions for both teams about same project
3. System surfaces: "Eng says X, Product says Y" (contradiction)
4. Knowledge map shows gaps in shared understanding
5. Triggers alignment conversation or additional capture
```

### Document Tagging Strategy

```
When uploading documents, tag with:

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   REQUIRED                          OPTIONAL                                │
│   ────────                          ────────                                │
│                                                                             │
│   • Document type                   • Person (author/owner)                 │
│     (runbook, design doc, etc.)     • Project (what it's about)            │
│                                     • Team (which perspective)              │
│   • Source                          • Date/version                          │
│     (confluence, github, upload)    • Confidence (official vs draft)       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Examples:

Document                          Tags
--------                          ----
deployment-runbook.md             type: runbook
                                  project: deployment-system
                                  team: engineering
                                  person: sarah (author)

sarahs-notes.txt                  type: notes
                                  person: sarah
                                  team: engineering
                                  project: [multiple or none]

payment-api-design.pdf            type: design-doc
                                  project: payment-system
                                  team: engineering
                                  person: mike, sarah (contributors)

mobile-app-research.pdf           type: research
                                  project: mobile-app
                                  team: design
                                  person: jordan

mobile-app-prd.pdf                type: prd
                                  project: mobile-app
                                  team: product
                                  person: pat

launch-plan.docx                  type: plan
                                  project: mobile-app
                                  team: marketing
                                  person: sam
```

### Query Flexibility

With hybrid model, can answer all types of questions:

```
Person-centric                Project-centric               Team-centric
──────────────                ───────────────               ────────────
"What does Sarah know?"       "What do we know about        "What does Engineering
                              the Mobile App?"              know about Mobile App?"

"What are Sarah's gaps?"      "What's undocumented          "What gaps does Design
                              about Mobile App?"            have on Mobile App?"

"Who else knows what          "Who knows about              "Who on Product team
Sarah knows?"                 Mobile App?"                  knows about pricing?"

"What did Sarah               "What insights exist          "What has Marketing
contribute?"                  for Mobile App?"              captured about launch?"

Combined queries
────────────────
"What does Sarah (person) know about Mobile App (project) from Engineering (team) perspective?"
"Which teams have captured knowledge about Payments? Which haven't?"
"Show me contradictions between Engineering and Product on Mobile App"
```

### Recommendation for Test Process

For initial testing, start simple and add dimensions progressively:

```
Phase 1 (Test)      PERSON only
                    ───────────
                    - Simpler to build
                    - Matches offboarding use case
                    - One person, their docs, one interview
                    - Validates core AI loop works

Phase 2 (Add)       PERSON + PROJECT
                    ─────────────────
                    - Tag docs to projects
                    - Link sessions to projects
                    - Enable project-centric queries
                    - "What does Sarah know about Payments?"

Phase 3 (Add)       PERSON + PROJECT + TEAM
                    ────────────────────────
                    - Add team as a dimension
                    - Tag docs and sessions to teams
                    - Enable team-centric queries
                    - "What does Engineering know about Payments?"

Phase 4 (Full)      Full hybrid + Cross-references
                    ────────────────────────────────
                    - Cross-reference all dimensions
                    - Multi-person capture for same project
                    - Multi-team views of same project
                    - Contradiction detection across teams
                    - Organization-wide knowledge graph
```

**Complexity vs Value trade-off:**

```
                            VALUE
                              │
                    Phase 4   │         ★ Full hybrid
                              │        /
                    Phase 3   │      ★ + Teams
                              │     /
                    Phase 2   │   ★ + Projects
                              │  /
                    Phase 1   │★ Person only
                              │
                              └──────────────────────── COMPLEXITY
```

---

## Test Process: Building the Core AI Loop

A step-by-step process to build and validate the core AI interaction before full product development.

### Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│  SETUP & QUESTIONNAIRES                                                                 │
│  ──────────────────────                                                                 │
│                                                                                         │
│  STEP 1              STEP 2 (Async, Parallel)                                          │
│  ──────              ────────────────────────                                          │
│                                                                                         │
│  Campaign        →   Expert Questionnaire    ───┐                                      │
│  Setup               + Link Docs                 │                                      │
│  (Sponsor)                                       ├──→  STEP 3                           │
│                      Collaborator            ───┘     ──────                           │
│                      Questionnaires                                                     │
│                      (Teammates)                      AI Creates Initial               │
│                                                       Knowledge Graph +                 │
│                                                       Session Plan                      │
│                                                                                         │
│  ITERATIVE CAPTURE                                                                      │
│  ─────────────────                                                                      │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                              │      │
│  │   SESSION 1  ──→  AI Updates  ──→  SESSION 2  ──→  AI Updates  ──→  ...     │      │
│  │   (Interview)     Graph + Plan     (Interview)     Graph + Plan             │      │
│  │                                                                              │      │
│  └──────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                         │
│  After each session: Extract insights → Update knowledge graph → Re-prioritize →       │
│                      Adjust plan → Decide if more sessions needed                      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Step 1: Campaign Setup (Sponsor)

**Purpose:** Sponsor creates the knowledge capture campaign and triggers questionnaire invites

```
Input                       Process                          Output
-----                       -------                          ------
- Expert info (name, role)  - Sponsor fills campaign form    - Campaign created
- Project/domain to focus   - Nominates collaborators        - Expert receives questionnaire
- Timeline/urgency          - System sends invites           - Collaborators receive questionnaire
- Collaborator list         - Tracks completion status       - Campaign dashboard
```

**To build:**
- [ ] Campaign creation form
    - Expert info (name, role, team, last day if departing)
    - Project/domain to capture
    - Timeline and urgency
- [ ] Collaborator nomination interface
- [ ] Automated questionnaire invites (expert + collaborators)
- [ ] Campaign status dashboard (who's completed, who hasn't)
- [ ] Database to store campaigns

**Validation:**
- Sponsor can create campaign in < 5 min
- Expert and collaborators receive questionnaire invites immediately
- Sponsor can see completion status

---

### Step 2: Pre-Interview Questionnaires (Async, Parallel)

**Purpose:** Gather context from both the expert and collaborators before AI creates the plan

Both questionnaires are sent simultaneously and completed asynchronously.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   EXPERT QUESTIONNAIRE (15-25 min)          COLLABORATOR QUESTIONNAIRE (5-10 min each) │
│   ────────────────────────────────          ───────────────────────────────────────────│
│                                                                                         │
│   • What do you know that others don't?     • What do you regularly ask [Expert] about?│
│   • What questions do people ask you?       • What will be hardest after they leave?   │
│   • What will be harder after you leave?    • What do you wish was documented?         │
│   • What's undocumented but critical?       • Decisions you don't understand?          │
│   • Link/upload relevant documents          • Specific topics to cover?                │
│   • Tag docs by type                                                                    │
│                                                                                         │
│   Output: Self-assessment + Linked docs     Output: Gap perspectives + Priority topics │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Collaborator types (priority order):**
1. Successor (highest priority - taking over responsibilities)
2. Teammates (day-to-day operational knowledge)
3. Cross-team partners (integration/dependency knowledge)
4. Manager (strategic context, if not the sponsor)
5. Direct reports (how things actually work)

**To build:**
- [ ] Expert questionnaire form
    - Self-assessment questions
    - Document upload/linking interface
    - Doc type tagging (runbook, design doc, notes, etc.)
- [ ] Collaborator questionnaire form (shorter, 5-10 min)
- [ ] Completion tracking (waiting for responses)
- [ ] Aggregate collaborator responses by theme
- [ ] Trigger Step 3 when questionnaires complete (or timeout)

**Validation:**
- Expert can complete questionnaire in 15-25 min
- Collaborator can complete in 5-10 min
- System tracks who's completed, sends reminders
- All responses stored and ready for AI analysis

---

### Step 3: AI Creates Initial Knowledge Graph + Session Plan

**Purpose:** Once questionnaires are complete, AI ingests everything and creates the initial knowledge graph and session plan

This step happens automatically when questionnaires are submitted.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   INPUTS                           AI PROCESSING                    OUTPUTS            │
│   ──────                           ─────────────                    ───────            │
│                                                                                         │
│   • Linked documents           →   • Parse & chunk docs         →   KNOWLEDGE GRAPH    │
│   • Expert questionnaire           • Generate embeddings            • What we know     │
│   • Collaborator responses         • Extract topics/entities        • What's missing   │
│                                    • Identify gaps                  • Contradictions   │
│                                    • Cross-reference all inputs     • Confidence scores│
│                                    • Prioritize by demand                              │
│                                                                                         │
│                                                                  →   SESSION PLAN      │
│                                                                      • # of sessions   │
│                                                                      • Topics per session│
│                                                                      • Questions ready │
│                                                                      • Time estimates  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Knowledge Graph contains:**
```
Node Type           Examples                              Source
---------           --------                              ------
Topics              "Deployment", "Auth system"           Docs + questionnaires
Entities            People, systems, processes            Extracted from docs
Known facts         Documented information                Parsed from docs
Gaps                Mentioned but not explained           Cross-reference analysis
Contradictions      Conflicting info                      Doc comparison
Priorities          What collaborators need most          Collaborator responses
```

**Gap prioritization formula:**
```
Priority = (Collaborator demand × 2) + (Doc gap score) + (Expert self-assessment)

High priority: Multiple collaborators asking + not in docs + expert flagged
Med priority:  One collaborator + some doc coverage + expert mentioned
Low priority:  No collaborator interest + partial docs + not mentioned
```

**Session plan includes:**
```
Session Plan Element    Description
--------------------    -----------
Number of sessions      AI recommends 1-3+ based on scope of gaps
Topics per session      Grouped by theme, prioritized by demand
Questions               Generated from gaps, includes collaborator questions
Time estimates          Per topic and per session
Sequencing              Warm-up → core → deep dive flow
```

**To build:**
- [ ] Document ingestion pipeline
    - Parser (PDF, DOCX, MD, TXT)
    - Text chunking
    - Embedding generation
    - Vector storage
- [ ] Knowledge graph generator (LLM agent)
    - Topic/entity extraction
    - Gap detection
    - Contradiction flagging
    - Priority scoring
- [ ] Session planner (LLM agent)
    - Decide number of sessions
    - Group topics into sessions
    - Generate questions per topic
    - Include collaborator questions verbatim where relevant
    - Estimate time per topic
- [ ] Knowledge graph visualization (optional for MVP)

**Question generation examples:**
```
Gap/Topic                   Generated Questions
---------                   -------------------
"Legacy migration"          - "Can you walk me through the legacy migration process?"
(from expert assessment)    - "What were the biggest challenges?"
                            - "What would you do differently?"

"Deployment process"        - "What's the typical deployment flow?"
(gap in docs +              - "What are the common failure points?"
3 collaborators asked)      - "What do you check before deploying?"
                            - "Alex specifically asked: how do you handle rollbacks?"

"Timeout values"            - "I see different timeout values in the docs - can you
(contradiction)               clarify when each applies?"
```

**Validation:**
- Knowledge graph accurately reflects doc contents
- Gaps match what expert said was undocumented
- Collaborator-requested topics are high priority
- Session plan has reasonable scope (30-60 min per session)
- Questions are specific, not generic

---

### Step 4: Iterative Interview Sessions

**Purpose:** Conduct interview sessions with automatic plan updates after each session

The key insight: this is a **loop**, not a linear process. After each session, the AI updates the knowledge graph and decides if more sessions are needed.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   THE INTERVIEW LOOP                                                                    │
│   ──────────────────                                                                    │
│                                                                                         │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│   │             │      │             │      │             │      │             │      │
│   │  CONDUCT    │─────▶│  EXTRACT    │─────▶│  UPDATE     │─────▶│  DECIDE     │      │
│   │  SESSION    │      │  INSIGHTS   │      │  GRAPH +    │      │  NEXT STEP  │      │
│   │             │      │             │      │  PLAN       │      │             │      │
│   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘      │
│         ▲                                                               │              │
│         │                                                               │              │
│         │         ┌─────────────────────────────────────────────────────┘              │
│         │         │                                                                    │
│         │         ▼                                                                    │
│         │   ┌───────────────┐         ┌───────────────┐                               │
│         │   │ More gaps to  │───YES──▶│ Schedule next │────────────────┐              │
│         │   │ cover?        │         │ session       │                │              │
│         │   └───────────────┘         └───────────────┘                │              │
│         │         │                                                    │              │
│         │        NO                                                    │              │
│         │         │                                                    │              │
│         │         ▼                                                    │              │
│         │   ┌───────────────┐                                          │              │
│         │   │ CAMPAIGN      │                                          │              │
│         │   │ COMPLETE      │                                          │              │
│         │   └───────────────┘                                          │              │
│         │                                                              │              │
│         └──────────────────────────────────────────────────────────────┘              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Within each session:**
```
Input                       Process                          Output
-----                       -------                          ------
- Session plan              - AI presents questions          - Raw transcript
- Knowledge graph           - Expert responds                - Topics covered
- Prepared questions        - AI asks follow-ups             - New topics discovered
                            - Track coverage                 - Flagged key insights
                            - Adapt in real-time
```

**After each session (automatic):**
```
Input                       Process                          Output
-----                       -------                          ------
- Session transcript        - Extract key insights           - Updated knowledge graph
- Current knowledge graph   - Generate Q&A pairs             - Insights added to graph
- Remaining gaps            - Map insights to gaps           - Gaps marked as covered
                            - Update knowledge graph         - Updated session plan
                            - Re-prioritize remaining gaps   - Decision: more sessions?
                            - Adjust next session plan
```

**Interview modes:**
```
Mode                Description                          For MVP
----                -----------                          ───────
AI-only chat        Expert talks to AI directly          ✓ Primary
AI-assisted human   Human interviews, AI suggests        Phase 2
Async Q&A           Expert answers at own pace           Phase 2
```

**Decision logic for "more sessions needed?":**
```
Scenario                                          Decision
--------                                          --------
All high-priority gaps covered                    Campaign complete
High-priority gaps remain, expert available       Schedule another session
Expert out of time, some gaps remain              Mark campaign as partial, note gaps
New important topics discovered                   Add to plan, continue
Diminishing returns (same answers)                Campaign complete
```

**Output formats (cumulative across sessions):**
```
Format              Content                              Use
------              -------                              ---
Knowledge graph     All captured knowledge, structured   Central artifact
Insight cards       Single key learnings                 Quick reference
Q&A pairs           Question + answer extracted          FAQ, searchable
Session summaries   Overview per session                 Progress tracking
Gap closure report  What's covered, what remains         Campaign status
```

**To build:**
- [ ] Interview chat interface
    - Pre-load context and questions
    - Real-time follow-up suggestions
    - Coverage tracker
    - Save transcript
- [ ] Post-session extraction agent (LLM)
    - Extract insights from transcript
    - Generate Q&A pairs
    - Create session summary
- [ ] Knowledge graph updater
    - Add new insights to graph
    - Mark gaps as covered
    - Identify new gaps/topics
- [ ] Session planner updater
    - Re-prioritize remaining gaps
    - Decide if more sessions needed
    - Generate next session plan (if needed)
- [ ] Campaign completion logic
    - Determine when "done enough"
    - Generate final campaign summary

**Validation:**
- Can conduct 30-60 min session
- AI asks relevant follow-ups
- Insights extracted after each session
- Knowledge graph updated with new info
- Plan adjusts based on what was covered
- System correctly decides when more sessions needed

---

### Test Run Checklist

**Prerequisites:**
- [ ] Test sponsor (someone to initiate)
- [ ] Test expert (willing to be interviewed)
- [ ] 2-4 test collaborators (teammates, successor, etc.)
- [ ] Sample docs (5-10 docs the expert can link)
- [ ] LLM API access (Claude or GPT-4)
- [ ] Basic storage (database)

**Step-by-step test:**

```
Step              Who             Action                              Success Criteria
────              ───             ──────                              ────────────────
1. Campaign       Sponsor         Create campaign, nominate collabs   Campaign created, invites sent
   Setup

2. Questionnaires Expert +        Fill questionnaires (parallel)      All responses collected
                  Collaborators   Expert: 15-25 min + link docs       Docs uploaded
                                  Collabs: 5-10 min each

3. AI Creates     System          Ingest docs, create knowledge       Knowledge graph generated
   Plan                           graph, generate session plan        Session plan with questions

4. Session 1      Expert + AI     Conduct 30-60 min session           Transcript saved
                                  AI interviews, expert responds      Insights extracted

   [After session: AI extracts insights, updates graph, re-plans]

4b. Session 2+    Expert + AI     If gaps remain, continue            More insights captured
    (if needed)                   with updated plan                   Graph updated

5. Campaign       System          Generate final outputs              Knowledge graph complete
   Complete                       Summarize what was captured         Q&A pairs, summaries ready

6. Validate       Expert +        Review captured knowledge           "Yes, this captures it"
                  Sponsor         Verify accuracy and completeness
```

---

### Technical Architecture (Minimal)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   STORAGE                    AGENTS                      INTERFACE          │
│   ───────                    ──────                      ─────────          │
│                                                                             │
│   ┌─────────────┐           ┌─────────────┐            ┌─────────────┐     │
│   │ Document    │           │ Ingestion   │            │ Upload UI   │     │
│   │ Store       │◄──────────│ Agent       │◄───────────│             │     │
│   │ (files)     │           └─────────────┘            └─────────────┘     │
│   └─────────────┘                                                           │
│                              ┌─────────────┐                                │
│   ┌─────────────┐           │ Analysis    │                                │
│   │ Vector DB   │◄──────────│ Agent       │                                │
│   │ (embeddings)│           └─────────────┘                                │
│   └─────────────┘                                                           │
│                              ┌─────────────┐            ┌─────────────┐     │
│   ┌─────────────┐           │ Planning    │            │ Interview   │     │
│   │ Knowledge   │◄──────────│ Agent       │───────────►│ Interface   │     │
│   │ Graph       │           └─────────────┘            └─────────────┘     │
│   └─────────────┘                                                           │
│                              ┌─────────────┐            ┌─────────────┐     │
│   ┌─────────────┐           │ Extraction  │            │ Output      │     │
│   │ Insights    │◄──────────│ Agent       │───────────►│ Viewer      │     │
│   │ Store       │           └─────────────┘            └─────────────┘     │
│   └─────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Risk & Learning Goals

What we're trying to learn with this test:

```
Question                                          How We'll Know
--------                                          -------------
Can AI extract useful context from docs?          Quality of analysis output
Can AI identify meaningful gaps?                  Gaps match human assessment
Can AI generate good interview questions?         Questions feel relevant/specific
Can AI assist in real-time during interview?      Follow-ups are helpful
Can AI extract structured knowledge after?        Outputs are usable/accurate
Does the loop actually capture tacit knowledge?   Test subject validates
```

---

## MVP Strategy

### Scope: Simplest Possible Test

**Use Case: Departing Employee Knowledge Capture**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   SCENARIO                                                                              │
│   ────────                                                                              │
│   • One person is leaving the organization                                              │
│   • They've been working on a specific project                                          │
│   • They have knowledge that isn't fully documented                                     │
│   • We have limited time to capture before they leave                                   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**The MVP Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   SETUP & QUESTIONNAIRES                                                                │
│                                                                                         │
│   ┌──────────────┐      ┌──────────────┐                                               │
│   │ 1. CAMPAIGN  │      │ 2. QUESTIONNAIRES (Parallel, Async)                          │
│   │    SETUP     │      │                                                              │
│   │   (Sponsor)  │      │  ┌─────────────────┐  ┌─────────────────┐                    │
│   │              │      │  │ Expert          │  │ Collaborators   │                    │
│   │ Create       │─────▶│  │ • Self-assess   │  │ • What they need│                    │
│   │ campaign,    │      │  │ • Link docs     │  │ • Questions     │                    │
│   │ nominate     │      │  │ • 15-25 min     │  │ • 5-10 min each │                    │
│   │ collaborators│      │  └────────┬────────┘  └────────┬────────┘                    │
│   └──────────────┘      │           └──────────┬─────────┘                             │
│                         └──────────────────────┼───────────────────────────────────────│
│                                                │                                        │
│   AI PLANNING                                  ▼                                        │
│                                     ┌──────────────────┐                               │
│                                     │ 3. AI CREATES    │                               │
│                                     │    KNOWLEDGE     │                               │
│                                     │    GRAPH +       │                               │
│                                     │    SESSION PLAN  │                               │
│                                     └────────┬─────────┘                               │
│                                              │                                          │
│   ITERATIVE CAPTURE                          ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │  │
│   │  │  SESSION 1   │───▶│  EXTRACT +   │───▶│  UPDATE      │───▶│  MORE GAPS?  │  │  │
│   │  │  (Interview) │    │  INSIGHTS    │    │  GRAPH +     │    │              │  │  │
│   │  └──────────────┘    └──────────────┘    │  PLAN        │    │  YES → Loop  │  │  │
│   │        ▲                                 └──────────────┘    │  NO → Done   │  │  │
│   │        │                                                     └───────┬──────┘  │  │
│   │        └─────────────────────────────────────────────────────────────┘         │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   CAMPAIGN COMPLETE                                                                     │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   │  Knowledge graph + Q&A pairs + Session summaries → Team can search and use       │ │
│   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**What we're capturing:**

```
Knowledge Type              Example                                Priority
--------------              -------                                --------
Undocumented processes      "How I actually deploy this"           High
Decision rationale          "Why we built it this way"             High
Gotchas and edge cases      "Watch out for X when Y happens"       High
Relationships/contacts      "Talk to Sarah for Z issues"           Medium
Historical context          "We tried A before, it failed because" Medium
Future recommendations      "If I were staying, I'd fix X"         Medium
```

### What's IN Scope

```
Dimension           MVP Choice                  Rationale
---------           ----------                  ---------
Structure           Person-only (Phase 1)       Simplest, validate core loop
Use case            Role Transition             High urgency, clear value
Interview format    AI-led chat                 Fastest to build
Session count       1-3 sessions (iterative)    AI decides based on coverage
Central artifact    Knowledge graph             Tracks what we know/don't know
Output format       Graph + Q&A + Summaries     Most useful, queryable
Validation          Expert reviews output       Direct feedback loop
```

### What's OUT of Scope (for now)

```
- Project/Team dimensions (Phase 2+)
- Real-time transcription
- Knowledge graph visualization (text-based for MVP)
- Integration with external tools
- Multi-person capture
- Contradiction detection
```

---

### Internal Test: Departing Employee Profile

**Fill in details about the person leaving:**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   THE PERSON                                                                            │
│   ──────────                                                                            │
│   Name:           _______________________________________________                       │
│   Role:           _______________________________________________                       │
│   Team:           _______________________________________________                       │
│   Tenure:         ___ years/months                                                      │
│   Last day:       _______________________________________________                       │
│   Time available: ___ hours for knowledge capture                                       │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   THE PROJECT                                                                           │
│   ───────────                                                                           │
│   Project name:   _______________________________________________                       │
│   Description:    _______________________________________________                       │
│                   _______________________________________________                       │
│   Their role:     [ ] Owner  [ ] Lead  [ ] Key contributor  [ ] Only person who knows  │
│   Project status: [ ] Active  [ ] Maintenance  [ ] Winding down                         │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   THE KNOWLEDGE GAP                                                                     │
│   ─────────────────                                                                     │
│   What do they know that others don't?                                                  │
│   •  _______________________________________________                                    │
│   •  _______________________________________________                                    │
│   •  _______________________________________________                                    │
│                                                                                         │
│   What questions do people already ask them?                                            │
│   •  _______________________________________________                                    │
│   •  _______________________________________________                                    │
│   •  _______________________________________________                                    │
│                                                                                         │
│   What will break or be harder after they leave?                                        │
│   •  _______________________________________________                                    │
│   •  _______________________________________________                                    │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   EXISTING DOCUMENTATION                                                                │
│   ──────────────────────                                                                │
│   What docs exist about this project? (we'll ingest these)                              │
│                                                                                         │
│   [ ] README / setup guides                                                             │
│   [ ] Design docs / architecture                                                        │
│   [ ] Runbooks / how-tos                                                                │
│   [ ] Code comments / inline docs                                                       │
│   [ ] Slack threads / discussions                                                       │
│   [ ] Meeting notes                                                                     │
│   [ ] Their personal notes                                                              │
│   [ ] Wiki pages                                                                        │
│   [ ] Other: _______________________________________________                            │
│                                                                                         │
│   Where are these docs located?                                                         │
│   _______________________________________________                                       │
│   _______________________________________________                                       │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   WHO NEEDS THIS KNOWLEDGE                                                              │
│   ────────────────────────                                                              │
│   Who will take over their responsibilities?                                            │
│   _______________________________________________                                       │
│                                                                                         │
│   Who else on the team needs this knowledge?                                            │
│   _______________________________________________                                       │
│                                                                                         │
│   Any new hires who will need to ramp up?                                               │
│   _______________________________________________                                       │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Good test candidate checklist:**

```
[ ] Person is willing to participate (bought in)
[ ] Has undocumented knowledge (something to capture)
[ ] Has some existing docs (tests ingestion flow)
[ ] Available for 1-hour session (can complete full loop)
[ ] Can validate output afterward (feedback on accuracy)
[ ] Low-stakes if test fails (safe to experiment)
[ ] Leaving date gives enough time to test (not tomorrow)
```

---

### Campaign Roles: Who Does What

**Roles involved:**

```
SPONSOR (Manager/HR)        Creates campaign, nominates collaborators
EXPERT (Knowledge holder)   Fills questionnaire, links docs, gets interviewed
COLLABORATORS               Fill questionnaires about what they need captured
SYSTEM (Platform)           Creates knowledge graph, plans sessions, conducts AI interviews
```

**Activity breakdown:**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   STEP 1: CAMPAIGN SETUP (Sponsor)                                                      │
│   ────────────────────────────────                                                      │
│                                                                                         │
│   Sponsor fills:                                                                        │
│   • Expert info (name, role, team, last day if departing)                              │
│   • Project/domain to focus on                                                         │
│   • Why this matters / urgency                                                         │
│   • Timeline for capture                                                               │
│   • Nominate collaborators (who else should provide input)                             │
│                                                                                         │
│   Output: Campaign created, Expert + Collaborators receive questionnaire invites        │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   STEP 2: QUESTIONNAIRES (Parallel, Async)                                              │
│   ────────────────────────────────────────                                              │
│                                                                                         │
│   Expert fills (15-25 min):                 Collaborators fill (5-10 min each):         │
│   • What do I know that others don't?       • What do you ask [Expert] about?           │
│   • What questions do people ask me?        • What will be hardest after they leave?    │
│   • What's undocumented but critical?       • What do you wish was documented?          │
│   • Link/upload relevant documents          • Specific topics to cover?                 │
│                                                                                         │
│   Collaborator types:                                                                   │
│   • Successor (highest priority)                                                        │
│   • Teammates (day-to-day knowledge)                                                    │
│   • Cross-team partners (integration knowledge)                                         │
│   • Manager (strategic context)                                                         │
│                                                                                         │
│   Output: All questionnaires submitted, docs linked                                     │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   STEP 3: AI CREATES KNOWLEDGE GRAPH + SESSION PLAN (System)                            │
│   ───────────────────────────────────────────────────────────                           │
│                                                                                         │
│   System does:                                                                          │
│   • Ingest and parse linked documents                                                  │
│   • Analyze questionnaire responses                                                    │
│   • Build initial KNOWLEDGE GRAPH:                                                     │
│     - What we know (from docs)                                                         │
│     - What's missing (gaps)                                                            │
│     - What collaborators need (priorities)                                             │
│   • Generate SESSION PLAN:                                                             │
│     - How many sessions needed                                                         │
│     - Topics per session                                                               │
│     - Questions to ask                                                                 │
│                                                                                         │
│   Output: Knowledge graph initialized, Session plan ready                               │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   STEP 4: ITERATIVE INTERVIEW SESSIONS (Expert + System)                                │
│   ──────────────────────────────────────────────────────                                │
│                                                                                         │
│   For each session:                                                                     │
│   • AI conducts interview based on current plan                                        │
│   • Expert responds, AI asks follow-ups                                                │
│   • After session: AI extracts insights                                                │
│   • AI updates knowledge graph                                                         │
│   • AI decides: more sessions needed?                                                  │
│     - YES: Update plan, schedule next session                                          │
│     - NO: Campaign complete                                                            │
│                                                                                         │
│   Output: Knowledge graph grows after each session                                      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Visual flow:**

```
    SPONSOR         EXPERT          COLLABORATORS       SYSTEM
       │               │                  │                │
       │  1. Create    │                  │                │
       │  campaign     │                  │                │
       │───────────────┼──────────────────┼───────────────▶│
       │               │                  │                │
       │               │  2. Fill         │  2. Fill       │
       │               │  questionnaire   │  questionnaires│
       │               │  + link docs     │  (parallel)    │
       │               │──────────────────┼───────────────▶│
       │               │                  │───────────────▶│
       │               │                  │                │
       │               │                  │                │  3. Create
       │               │                  │                │  knowledge graph
       │               │                  │                │  + session plan
       │               │                  │                │──────┐
       │               │                  │                │◀─────┘
       │               │                  │                │
       │               │◀─────────────────────────────────▶│  4. Interview
       │               │    Session 1: Interview           │  loop
       │               │◀─────────────────────────────────▶│  (1-3 sessions)
       │               │    Session 2: If needed           │
       │               │                  │                │
       │               │                  │                │  5. Campaign
       │               │                  │                │  complete!
       ▼               ▼                  ▼                ▼
```

**Time estimates:**

```
Activity                              Who             Time        Automated?
────────                              ───             ────        ──────────
Create campaign                       Sponsor         5-10 min    Partial (form)
Expert questionnaire + docs           Expert          15-25 min   No
Collaborator questionnaires           Collaborators   5-10 min    No (each, parallel)
Create knowledge graph + plan         System          5-10 min    Yes
Interview session                     Expert + AI     30-60 min   Partial (AI leads)
Post-session processing               System          5-10 min    Yes
```

**Note:** Questionnaires (Step 2) happen in parallel, so total pre-interview time is ~30-45 min elapsed. System processing (Step 3) happens automatically once responses are in.

**What the platform saves:**

```
Without Platform                      With Platform
────────────────                      ─────────────
Sponsor manually briefs interviewer   System creates knowledge graph automatically
Interviewer reads all docs            System identifies what's known vs unknown
Interviewer creates questions         System generates targeted questions from gaps
Interviewer guesses what's missing    System prioritizes by collaborator demand
Multiple meetings to prepare          Questionnaires → AI planning → ready to interview
Single interview, hope you covered it AI decides if more sessions needed
```

---

### MVP Build Checklist

```
STEP 1: Campaign Setup (Sponsor Flow)                    Est: 1-2 days
─────────────────────────────────────
[ ] Campaign creation form
    - Expert info (name, role, team, last day if departing)
    - Project/domain to focus on
    - Timeline and urgency
[ ] Collaborator nomination interface
[ ] Automated questionnaire invites (expert + collaborators)
[ ] Campaign status dashboard (track who's completed)
[ ] Database to store campaigns

STEP 2: Pre-Interview Questionnaires                     Est: 1-2 days
────────────────────────────────────
[ ] Expert questionnaire form
    - Self-assessment questions
    - Document upload/linking interface
    - Doc type tagging
[ ] Collaborator questionnaire form (shorter)
    - What do you ask them about?
    - What will be hardest after they leave?
    - Specific topics to cover?
[ ] Completion tracking and reminders
[ ] Aggregate collaborator responses by theme

STEP 3: AI Creates Knowledge Graph + Session Plan        Est: 2-3 days
─────────────────────────────────────────────────
[ ] Document ingestion pipeline
    - Parser (PDF, DOCX, MD, TXT)
    - Text chunking
    - Embedding generation
    - Vector storage
[ ] Knowledge graph generator (LLM agent)
    - Extract topics and entities
    - Identify gaps (mentioned but not explained)
    - Cross-reference questionnaire responses
    - Prioritize by collaborator demand
[ ] Session planner (LLM agent)
    - Decide number of sessions needed
    - Group topics into sessions
    - Generate questions per topic
    - Estimate time per session

STEP 4: Iterative Interview Sessions                     Est: 3-4 days
────────────────────────────────────
[ ] Interview chat interface
    - Pre-load knowledge graph and questions
    - AI conducts interview
    - Real-time follow-up suggestions
    - Coverage tracker
    - Save transcript
[ ] Post-session extraction agent (LLM)
    - Extract insights from transcript
    - Generate Q&A pairs
    - Create session summary
[ ] Knowledge graph updater
    - Add new insights to graph
    - Mark gaps as covered
    - Identify new gaps/topics
[ ] Session planner updater
    - Re-prioritize remaining gaps
    - Decide if more sessions needed
    - Generate next session plan (if needed)
[ ] Campaign completion logic
    - Determine when "done enough"
    - Generate final campaign summary

TOTAL ESTIMATED: ~2-3 weeks for basic working prototype
```

---

### Success Criteria

**For MVP to be considered successful:**

```
Criteria                                          Target
--------                                          ------
Documents ingested                                5-10 docs processed
Gaps identified                                   AI finds 3+ meaningful gaps
Questions generated                               10+ relevant questions
Interview completed                               30-60 min session
Insights extracted                                5+ distinct insights
Expert validation                                 "Yes, this captures what I said"
New knowledge captured                            At least 1 thing not in original docs
```

**Questions to answer after MVP test:**

```
Question                                          How to Measure
--------                                          --------------
Did AI understand the documents?                  Quality of analysis output
Were the gaps meaningful?                         Expert confirms "yes, that's unclear"
Were questions specific enough?                   Not generic "tell me about X"
Did interview feel useful?                        Expert feedback
Is captured knowledge usable?                     Could someone else use this?
What's missing?                                   What would make this better?
```

---

### After MVP: Next Steps

```
If MVP works                          If MVP fails
────────────────                      ────────────────
Add more test candidates              Identify what broke
Add Project dimension (Phase 2)       Fix core issues
Improve question generation           Simplify further
Add better output formats             Try different approach
Consider external pilot               Re-evaluate assumptions
```
