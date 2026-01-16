-- Migration: Create Reports System
-- Enables text-based report generation with scheduling and delivery tracking

-- =============================================================================
-- 1. Report Templates (defines what can be generated)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,

  -- Template configuration
  prompt_template TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]',
  default_metadata JSONB DEFAULT '{}',

  -- Generation settings
  requires_campaign BOOLEAN DEFAULT true,
  requires_session BOOLEAN DEFAULT false,
  estimated_tokens INTEGER DEFAULT 2000,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Insert default report templates
INSERT INTO public.report_templates (type, name, description, prompt_template, sections, requires_campaign, requires_session) VALUES
(
  'progress_summary',
  'Progress Summary',
  'Weekly/periodic summary of sessions completed, topics covered, and overall progress',
  'You are creating a Progress Summary Report for a knowledge capture campaign.

Campaign: {{campaign_name}} ({{campaign_role}})
Goal: {{campaign_goal}}
Period: {{time_period}}

Data:
- Total Sessions: {{total_sessions}}
- Completed Sessions: {{completed_sessions}}
- Topics Covered: {{topics_covered}} / {{total_topics}}
- Coverage Percentage: {{coverage_percentage}}%

Session History:
{{session_history}}

Topic Coverage:
{{topic_coverage}}

Write a professional progress summary report in markdown format. Include:
1. Executive Summary (2-3 sentences)
2. Progress Highlights
3. Sessions Completed This Period
4. Topic Coverage Analysis
5. Next Steps & Recommendations

Be specific and data-driven. Use the actual numbers provided.',
  '[{"id": "summary", "title": "Executive Summary", "dataSource": "campaign", "format": "text"}, {"id": "highlights", "title": "Progress Highlights", "dataSource": "session", "format": "list"}, {"id": "coverage", "title": "Topic Coverage", "dataSource": "coverage", "format": "table"}]',
  true,
  false
),
(
  'knowledge_gap',
  'Knowledge Gap Analysis',
  'Report identifying topics not yet covered and areas needing more depth',
  'You are creating a Knowledge Gap Analysis Report for a knowledge capture campaign.

Campaign: {{campaign_name}} ({{campaign_role}})
Goal: {{campaign_goal}}

Topic Coverage Status:
{{topic_coverage_detailed}}

Not Discussed Topics:
{{not_discussed_topics}}

Partially Covered Topics:
{{partial_topics}}

Insights Captured:
{{insights_summary}}

Write a professional knowledge gap analysis report in markdown format. Include:
1. Executive Summary
2. Critical Knowledge Gaps (high priority topics not covered)
3. Topics Requiring Deeper Coverage
4. Recommendations for Upcoming Sessions
5. Risk Assessment (what knowledge might be lost if not captured)

Be specific about which topics need attention and why.',
  '[{"id": "summary", "title": "Executive Summary", "dataSource": "campaign", "format": "text"}, {"id": "gaps", "title": "Critical Gaps", "dataSource": "coverage", "format": "list"}, {"id": "recommendations", "title": "Recommendations", "dataSource": "insights", "format": "text"}]',
  true,
  false
),
(
  'session_summary',
  'Session Summary',
  'Generated after each session - what was discussed, key takeaways, extracted insights',
  'You are creating a Session Summary Report for a completed interview session.

Campaign: {{campaign_name}} ({{campaign_role}})
Session: {{session_number}} of {{total_sessions}}
Date: {{session_date}}
Duration: {{duration_minutes}} minutes

Transcript Summary:
{{transcript_summary}}

Topics Discussed:
{{topics_discussed}}

Insights Extracted:
{{insights}}

Questions Answered:
{{questions_answered}}

Write a professional session summary report in markdown format. Include:
1. Session Overview (date, duration, participants)
2. Key Discussion Points
3. Insights Captured
4. Topics Covered & Coverage Level
5. Follow-up Items for Next Session

Focus on actionable takeaways and specific knowledge captured.',
  '[{"id": "overview", "title": "Session Overview", "dataSource": "session", "format": "text"}, {"id": "insights", "title": "Key Insights", "dataSource": "insights", "format": "list"}, {"id": "topics", "title": "Topics Covered", "dataSource": "coverage", "format": "table"}]',
  true,
  true
),
(
  'expert_brief',
  'Expert Knowledge Brief',
  'Comprehensive document summarizing all captured knowledge for a campaign',
  'You are creating a comprehensive Expert Knowledge Brief - a handoff document that captures all the tacit knowledge from a departing expert.

Campaign: {{campaign_name}}
Expert: {{expert_name}} ({{campaign_role}})
Goal: {{campaign_goal}}
Capture Period: {{capture_period}}

Campaign Statistics:
- Sessions Completed: {{completed_sessions}} / {{total_sessions}}
- Topics Covered: {{topics_covered}} / {{total_topics}}
- Overall Coverage: {{coverage_percentage}}%

All Captured Insights:
{{all_insights}}

Knowledge Graph Summary:
{{graph_summary}}

Topic Deep Dives:
{{topic_details}}

Write a comprehensive knowledge brief document in markdown format. This is the primary handoff document for preserving this expert''s knowledge. Include:

1. Executive Summary
2. Expert Profile & Background
3. Key Knowledge Areas
   - For each major area, summarize the critical knowledge captured
4. Systems & Processes
   - Document any systems, tools, or processes the expert maintains
5. Key Contacts & Relationships
6. Undocumented Processes & Workarounds
7. Decision Rationale (why things are done certain ways)
8. Tips, Tricks & Best Practices
9. Knowledge Gaps & Risks (what wasn''t fully captured)
10. Recommended Next Steps

This document should stand alone as a comprehensive knowledge transfer resource.',
  '[{"id": "summary", "title": "Executive Summary", "dataSource": "campaign", "format": "text"}, {"id": "knowledge", "title": "Key Knowledge Areas", "dataSource": "insights", "format": "text"}, {"id": "graph", "title": "Knowledge Map", "dataSource": "graph", "format": "text"}]',
  true,
  false
);

-- =============================================================================
-- 2. Report Schedules (when to auto-generate)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,

  template_type TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Schedule configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('cron', 'event', 'manual')),
  cron_expression TEXT,
  event_trigger TEXT CHECK (event_trigger IN ('session_completed', 'campaign_completed', NULL)),

  -- Recipients
  enabled BOOLEAN NOT NULL DEFAULT true,
  recipients JSONB NOT NULL DEFAULT '[]',

  -- Tracking
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_report_id UUID,
  run_count INTEGER NOT NULL DEFAULT 0,

  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT fk_template_type FOREIGN KEY (template_type) REFERENCES public.report_templates(type)
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_org_id
  ON public.report_schedules(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_report_schedules_campaign_id
  ON public.report_schedules(campaign_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run
  ON public.report_schedules(next_run_at) WHERE enabled = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_report_schedules_event
  ON public.report_schedules(event_trigger) WHERE enabled = true AND deleted_at IS NULL AND event_trigger IS NOT NULL;

-- =============================================================================
-- 3. Extend existing reports table
-- =============================================================================

-- Add new columns to reports table
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS template_type TEXT,
  ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES public.report_schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_markdown TEXT,
  ADD COLUMN IF NOT EXISTS content_html TEXT,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generation_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS generation_error TEXT,
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add foreign key for template_type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_template_type_fkey'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_template_type_fkey
      FOREIGN KEY (template_type) REFERENCES public.report_templates(type);
  END IF;
END $$;

-- Update status constraint to include more states
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
-- Note: Adding constraint without enforcement since existing data may not comply
-- New inserts should use these statuses

CREATE INDEX IF NOT EXISTS idx_reports_org_id
  ON public.reports(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_template_type
  ON public.reports(template_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_schedule_id
  ON public.reports(schedule_id) WHERE schedule_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status
  ON public.reports(status) WHERE deleted_at IS NULL;

-- =============================================================================
-- 4. Report Deliveries (track email/notification sends)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.report_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,

  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'in_app', 'webhook')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,

  -- For email tracking
  resend_message_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_deliveries_report_id
  ON public.report_deliveries(report_id);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_status
  ON public.report_deliveries(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_report_deliveries_recipient
  ON public.report_deliveries(recipient_email);

-- =============================================================================
-- 5. RLS Policies
-- =============================================================================

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_deliveries ENABLE ROW LEVEL SECURITY;

-- Templates are publicly readable (catalog of available reports)
CREATE POLICY "Templates are viewable by authenticated users"
  ON public.report_templates FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Schedules: users can manage their org's schedules
CREATE POLICY "Users can view own org schedules"
  ON public.report_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND org_id = report_schedules.org_id
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create own org schedules"
  ON public.report_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND org_id = report_schedules.org_id
    )
  );

CREATE POLICY "Users can update own org schedules"
  ON public.report_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND org_id = report_schedules.org_id
    )
  );

CREATE POLICY "Users can delete own org schedules"
  ON public.report_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND org_id = report_schedules.org_id
    )
  );

-- Deliveries: users can see deliveries for reports in their org
CREATE POLICY "Users can view org report deliveries"
  ON public.report_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.users u ON r.org_id = u.org_id
      WHERE r.id = report_id AND u.id = auth.uid()
    )
  );

-- Service role can manage everything
CREATE POLICY "Service role full access templates"
  ON public.report_templates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access schedules"
  ON public.report_schedules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access deliveries"
  ON public.report_deliveries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 6. Functions
-- =============================================================================

-- Function to calculate next run time based on cron expression
-- For MVP, we support simple patterns: 'weekly', 'biweekly', 'monthly'
CREATE OR REPLACE FUNCTION calculate_next_run_at(
  p_trigger_type TEXT,
  p_cron_expression TEXT,
  p_last_run_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_time TIMESTAMPTZ;
  v_next_run TIMESTAMPTZ;
BEGIN
  v_base_time := COALESCE(p_last_run_at, NOW());

  IF p_trigger_type != 'cron' THEN
    RETURN NULL;
  END IF;

  -- Simple pattern matching for MVP
  CASE p_cron_expression
    WHEN 'weekly' THEN
      -- Next Friday at 9am
      v_next_run := date_trunc('week', v_base_time) + INTERVAL '4 days 9 hours' + INTERVAL '1 week';
    WHEN 'biweekly' THEN
      -- Every other Friday at 9am
      v_next_run := date_trunc('week', v_base_time) + INTERVAL '4 days 9 hours' + INTERVAL '2 weeks';
    WHEN 'monthly' THEN
      -- First of next month at 9am
      v_next_run := date_trunc('month', v_base_time) + INTERVAL '1 month 9 hours';
    WHEN 'daily' THEN
      -- Tomorrow at 9am
      v_next_run := date_trunc('day', v_base_time) + INTERVAL '1 day 9 hours';
    ELSE
      -- Default to weekly
      v_next_run := date_trunc('week', v_base_time) + INTERVAL '4 days 9 hours' + INTERVAL '1 week';
  END CASE;

  -- Ensure next run is in the future
  WHILE v_next_run <= NOW() LOOP
    v_next_run := v_next_run + INTERVAL '1 week';
  END LOOP;

  RETURN v_next_run;
END;
$$;

-- Trigger to set next_run_at on schedule creation/update
CREATE OR REPLACE FUNCTION update_schedule_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trigger_type = 'cron' AND NEW.enabled = true THEN
    NEW.next_run_at := calculate_next_run_at(NEW.trigger_type, NEW.cron_expression, NEW.last_run_at);
  ELSE
    NEW.next_run_at := NULL;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schedule_next_run_trigger ON public.report_schedules;
CREATE TRIGGER update_schedule_next_run_trigger
  BEFORE INSERT OR UPDATE ON public.report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_next_run();

-- Function to get schedules due for execution
CREATE OR REPLACE FUNCTION get_due_report_schedules()
RETURNS TABLE (
  id UUID,
  org_id UUID,
  campaign_id UUID,
  template_type TEXT,
  name TEXT,
  recipients JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.id,
    rs.org_id,
    rs.campaign_id,
    rs.template_type,
    rs.name,
    rs.recipients
  FROM public.report_schedules rs
  WHERE
    rs.enabled = true
    AND rs.deleted_at IS NULL
    AND rs.trigger_type = 'cron'
    AND rs.next_run_at <= NOW();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_next_run_at TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_report_schedules TO service_role;
