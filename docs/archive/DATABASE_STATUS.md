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

### Campaigns (1)

| Expert | Role | Department | Progress | Status |
|--------|------|------------|----------|--------|
| Emma Rodriguez | General Manager | Operations | 33% (2/6 sessions) | On Track |

### Skills (6)

**Emma Rodriguez's Campaign (Coffee Shop Operations):**
| Skill | Category | Captured | Confidence |
|-------|----------|----------|------------|
| Espresso machine maintenance | Equipment | ✅ Yes | 95% |
| Seasonal menu planning | Operations | ✅ Yes | 88% |
| Staff training & scheduling | People Management | ❌ No | 92% |
| Customer relationship management | Customer Service | ❌ No | 85% |
| Inventory management | Operations | ❌ No | 90% |
| Health & safety compliance | Compliance | ❌ No | 87% |

### Sessions (4)

**Emma Rodriguez:**
| # | Status | Date | Duration | Topics |
|---|--------|------|----------|--------|
| 1 | ✅ Completed | Dec 6 | 45 min | Espresso machine maintenance, Equipment care, Troubleshooting |
| 2 | ✅ Completed | Dec 13 | 50 min | Seasonal menu planning, Supplier relationships, Cost control |
| 3 | 📅 Scheduled | Dec 20 | - | Staff training, Scheduling, Performance management |
| 4 | 📅 Scheduled | Dec 27 | - | Customer loyalty programs, Community engagement |

### Session Notes (Sample)

**Session 1 - Emma Rodriguez:**
> Emma shared her 8-year expertise in espresso machine maintenance. The key insight: preventive maintenance (daily cleaning, weekly backflushing, monthly deep cleaning) prevents 90% of costly repairs. She explained her unique approach of training each barista to do basic maintenance, which saves approximately $3,000/month in service calls. She also covered the warning signs that indicate when parts need replacement before they break.

**Session 2 - Emma Rodriguez:**
> Deep dive into seasonal menu planning for a specialty coffee shop. Emma described how she sources different single-origin beans throughout the year, creating limited-time offerings that drive customer excitement. Critical learning: plan menus 6 weeks in advance to work with suppliers. She shared her spreadsheet system for tracking ingredient costs, waste reduction strategies, and how seasonal items increase average transaction value by 15%.

### Tasks (4)

| Task | Campaign | Priority | Due |
|------|----------|----------|-----|
| Schedule Session 3 with Emma Rodriguez | Emma Rodriguez | This Week | +2 days |
| Document barista training procedures from Session 1 | Emma Rodriguez | On Track | +5 days |
| Review seasonal menu recommendations | Emma Rodriguez | Urgent | Tomorrow |
| Compile knowledge about customer retention strategies | General | On Track | +7 days |

### Reports (3)

| Report | Campaign | Type | Status |
|--------|----------|------|--------|
| Session 1 Summary - Espresso Equipment Mastery | Emma Rodriguez | Summary | ✅ Ready |
| Session 2 Summary - Seasonal Menu Strategy | Emma Rodriguez | Summary | ✅ Ready |
| Skills Progress Report - Coffee Shop Operations | Emma Rodriguez | Skills | ✅ Ready |

### Knowledge Graph (7 nodes, 5 edges)

**Nodes:**
| Label | Type | Description |
|-------|------|-------------|
| Espresso Machine | System | Core equipment, requires consistent maintenance |
| Preventive Maintenance | Process | Daily, weekly, monthly maintenance schedule |
| Barista Training Program | Skill | Train staff to handle basic equipment care |
| Seasonal Menu Planning | Process | 6-week advance planning with suppliers |
| Single-Origin Sourcing | Skill | Building relationships with specialty coffee importers |
| Customer Loyalty Program | Core | Central hub for customer retention strategies |
| Staff Scheduling & Management | Skill | Optimized scheduling with trained backup staff |

**Edges:**
| Source | Target | Relationship |
|--------|--------|--------------|
| Espresso Machine | Preventive Maintenance | requires |
| Preventive Maintenance | Barista Training Program | enables |
| Seasonal Menu Planning | Single-Origin Sourcing | part_of |
| Single-Origin Sourcing | Customer Loyalty Program | enables |
| Barista Training Program | Customer Loyalty Program | related_to |

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

Then run these seed queries for the new Coffee Shop use case:

```sql
-- Insert campaign for Emma Rodriguez (Coffee Shop Manager)
INSERT INTO campaigns (
  id, org_id, expert_name, role, department,
  years_experience, goal, capture_mode, status,
  total_sessions, completed_sessions, created_at
) VALUES (
  'c0000001-0000-0000-0000-000000000001',
  '37dd435e-b2be-461c-845f-7b3b9902e8f4',
  'Emma Rodriguez',
  'General Manager',
  'Operations',
  8,
  'Capture expertise in espresso machine maintenance, seasonal menu planning, staff training, and customer loyalty strategies for specialty coffee shop operations',
  'hybrid',
  'on-track',
  6,
  2,
  NOW()
);

-- Insert skills
INSERT INTO skills (campaign_id, name, category, captured, confidence) VALUES
('c0000001-0000-0000-0000-000000000001', 'Espresso machine maintenance', 'Equipment', true, 0.95),
('c0000001-0000-0000-0000-000000000001', 'Seasonal menu planning', 'Operations', true, 0.88),
('c0000001-0000-0000-0000-000000000001', 'Staff training & scheduling', 'People Management', false, 0.92),
('c0000001-0000-0000-0000-000000000001', 'Customer relationship management', 'Customer Service', false, 0.85),
('c0000001-0000-0000-0000-000000000001', 'Inventory management', 'Operations', false, 0.90),
('c0000001-0000-0000-0000-000000000001', 'Health & safety compliance', 'Compliance', false, 0.87);

-- Insert knowledge graph nodes
INSERT INTO graph_nodes (campaign_id, label, type, description, position_x, position_y) VALUES
('c0000001-0000-0000-0000-000000000001', 'Espresso Machine', 'system', 'Core equipment, requires consistent maintenance', 100, 150),
('c0000001-0000-0000-0000-000000000001', 'Preventive Maintenance', 'process', 'Daily, weekly, monthly maintenance schedule', 300, 150),
('c0000001-0000-0000-0000-000000000001', 'Barista Training Program', 'skill', 'Train staff to handle basic equipment care', 300, 300),
('c0000001-0000-0000-0000-000000000001', 'Seasonal Menu Planning', 'process', '6-week advance planning with suppliers', 500, 150),
('c0000001-0000-0000-0000-000000000001', 'Single-Origin Sourcing', 'skill', 'Building relationships with specialty coffee importers', 700, 150),
('c0000001-0000-0000-0000-000000000001', 'Customer Loyalty Program', 'core', 'Central hub for customer retention strategies', 400, 450),
('c0000001-0000-0000-0000-000000000001', 'Staff Scheduling & Management', 'skill', 'Optimized scheduling with trained backup staff', 100, 300);

-- Insert knowledge graph edges
INSERT INTO graph_edges (campaign_id, source_node_id, target_node_id, relationship, weight) VALUES
((SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Espresso Machine'),
 (SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Preventive Maintenance'),
 'requires', 1.0),
((SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Preventive Maintenance'),
 (SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Barista Training Program'),
 'enables', 1.0),
((SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Seasonal Menu Planning'),
 (SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Single-Origin Sourcing'),
 'part_of', 1.0),
((SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Single-Origin Sourcing'),
 (SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Customer Loyalty Program'),
 'enables', 1.0),
((SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Barista Training Program'),
 (SELECT id FROM graph_nodes WHERE campaign_id = 'c0000001-0000-0000-0000-000000000001' AND label = 'Customer Loyalty Program'),
 'related_to', 1.0);
```

This creates a clean, easy-to-understand coffee shop business knowledge graph with:
- **1 campaign**: Emma Rodriguez (General Manager)
- **6 skills**: All practical coffee shop operations knowledge
- **7 knowledge graph nodes**: Representing equipment, processes, and people skills
- **5 relationships**: Showing how espresso maintenance, menu planning, and staff training drive customer loyalty
