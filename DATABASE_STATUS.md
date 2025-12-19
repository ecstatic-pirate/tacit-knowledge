# Database Status & Mock Data

## Current Schema

| Table | Purpose | Status |
|-------|---------|--------|
| `organizations` | Multi-tenant org container | ✅ Ready |
| `users` | User accounts linked to auth | ✅ Ready |
| `campaigns` | Knowledge capture initiatives | ✅ Ready |
| `sessions` | Interview/capture events | ✅ Ready |
| `skills` | Knowledge areas to capture | ✅ Ready |
| `reports` | Generated output artifacts | ✅ Ready |
| `tasks` | Action items for users | ✅ Ready |
| `graph_nodes` | Knowledge graph vertices | ✅ Ready |
| `graph_edges` | Knowledge graph connections | ✅ Ready |
| `documents` | Uploaded files for analysis | ✅ Ready |
| `calendar_connections` | OAuth tokens for calendar sync | ✅ Ready |

---

## Mock Data Seeded

### Campaigns (2)

| Expert | Role | Department | Progress | Status |
|--------|------|------------|----------|--------|
| Sarah Chen | Sr. Infrastructure Engineer | Platform Engineering | 33% (2/6 sessions) | On Track |
| Marcus Johnson | Head of Sales Operations | Sales | 15% (1/8 sessions) | Keep Track |

### Skills (10)

**Sarah Chen's Campaign:**
| Skill | Category | Captured | Confidence |
|-------|----------|----------|------------|
| Kubernetes cluster management | Infrastructure | ✅ Yes | 92% |
| Legacy database migrations | Database | ✅ Yes | 88% |
| Incident response protocols | Operations | ❌ No | 85% |
| CI/CD pipeline architecture | DevOps | ❌ No | 90% |
| Cost optimization strategies | Infrastructure | ❌ No | 78% |
| Vendor relationship management | Operations | ❌ No | 65% |

**Marcus Johnson's Campaign:**
| Skill | Category | Captured | Confidence |
|-------|----------|----------|------------|
| Enterprise deal negotiation | Sales | ✅ Yes | 91% |
| Key account management | Sales | ❌ No | 87% |
| Sales forecasting models | Analytics | ❌ No | 82% |
| CRM customization | Tools | ❌ No | 75% |

### Sessions (6)

**Sarah Chen:**
| # | Status | Date | Duration | Topics |
|---|--------|------|----------|--------|
| 1 | ✅ Completed | Dec 6 | 47 min | Kubernetes architecture, Cluster setup, Node management |
| 2 | ✅ Completed | Dec 13 | 52 min | Database migrations, Legacy systems, Data integrity |
| 3 | 📅 Scheduled | Dec 20 | - | Incident response, On-call procedures |
| 4 | 📅 Scheduled | Dec 27 | - | CI/CD pipelines, Deployment strategies |

**Marcus Johnson:**
| # | Status | Date | Duration | Topics |
|---|--------|------|----------|--------|
| 1 | ✅ Completed | Dec 14 | 38 min | Enterprise sales, Deal negotiation, Pricing strategies |
| 2 | 📅 Scheduled | Dec 21 | - | Key accounts, Relationship management |

### Session Notes (Sample)

**Session 1 - Sarah Chen:**
> Session focused on Kubernetes infrastructure. Sarah explained the original cluster setup from 2019 and the reasoning behind the multi-region architecture. Key insight: The decision to use spot instances for non-critical workloads saves approximately $50k/month. She also covered the custom autoscaler configuration that handles traffic spikes during product launches.

**Session 2 - Sarah Chen:**
> Deep dive into the legacy Oracle to PostgreSQL migration project. Sarah walked through the phased approach they used in 2021. Critical learning: Never migrate during Q4 due to traffic patterns. She shared the rollback procedures and the custom validation scripts she wrote. Also discussed the "shadow database" pattern they invented for zero-downtime migrations.

**Session 1 - Marcus Johnson:**
> Marcus shared his framework for enterprise deal negotiation. Key principles: Always understand the buyer's internal politics, find the economic buyer vs technical buyer early. He explained the "3x value" pricing rule and walked through how he closed the Acme Corp deal ($2.3M ARR).

### Tasks (4)

| Task | Campaign | Priority | Due |
|------|----------|----------|-----|
| Schedule Session 3 with Sarah Chen | Sarah Chen | This Week | +2 days |
| Review Session 2 insights and update knowledge graph | Sarah Chen | On Track | +5 days |
| Prepare questions for Marcus - Key Accounts session | Marcus Johnson | Urgent | Tomorrow |
| Review AI-suggested skills for both campaigns | General | On Track | +7 days |

### Reports (4)

| Report | Campaign | Type | Status |
|--------|----------|------|--------|
| Session 1 Summary - Kubernetes Infrastructure | Sarah Chen | Summary | ✅ Ready |
| Session 2 Summary - Database Migrations | Sarah Chen | Summary | ✅ Ready |
| Skills Progress Report | Sarah Chen | Skills | ✅ Ready |
| Session 1 Summary - Enterprise Sales | Marcus Johnson | Summary | ✅ Ready |

### Knowledge Graph (7 nodes, 5 edges)

**Nodes:**
| Label | Type | Description |
|-------|------|-------------|
| Kubernetes Cluster | System | Multi-region K8s infrastructure |
| Spot Instance Strategy | Process | Cost optimization, saves ~$50k/month |
| Custom Autoscaler | System | Handles traffic spikes |
| PostgreSQL | System | Primary production database |
| Shadow Database Pattern | Process | Zero-downtime migration technique |
| Migration Validation Scripts | Skill | Data integrity verification |
| Incident Response | Core | Central hub for incident handling |

**Edges:**
| Source | Target | Relationship |
|--------|--------|--------------|
| Kubernetes Cluster | Spot Instance Strategy | enables |
| Kubernetes Cluster | Custom Autoscaler | part_of |
| PostgreSQL | Shadow Database Pattern | requires |
| Shadow Database Pattern | Migration Validation Scripts | requires |
| Kubernetes Cluster | Incident Response | related_to |

---

## What's Working End-to-End

```
✅ Create campaign with expert info
✅ Upload documents → AI analyzes → suggests skills
✅ Schedule sessions with dates and topics
✅ Start capture session → timer runs → take notes
✅ AI coach provides real-time suggestions (Edge Function)
✅ End session → triggers post-processing (Edge Function)
✅ Auto-generates session report
✅ Updates knowledge graph with new nodes/edges
✅ Dashboard shows metrics, campaigns, tasks
```

---

## Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Audio/video recording | Low | Browser MediaRecorder → Supabase Storage |
| Whisper transcription | Low | Edge Function to transcribe recordings |
| Calendar sync (Microsoft/Google) | Medium | OAuth flow exists, needs credentials |
| PDF export for reports | Low | Edge Function with html-to-pdf |
| Search across all knowledge | Medium | Semantic search over captured content |
| Handoff document generator | Low | Compile all captures into one doc |

---

## How to Reset Mock Data

If you need to clear and re-seed:

```sql
-- Clear all mock data (keeps schema)
DELETE FROM graph_edges WHERE campaign_id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
DELETE FROM graph_nodes WHERE campaign_id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
DELETE FROM reports WHERE campaign_id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
DELETE FROM tasks WHERE campaign_id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
DELETE FROM sessions WHERE campaign_id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
DELETE FROM skills WHERE campaign_id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
DELETE FROM campaigns WHERE id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
DELETE FROM tasks WHERE org_id = '37dd435e-b2be-461c-845f-7b3b9902e8f4' AND campaign_id IS NULL;
```

Then re-run the seed queries from the conversation above.
