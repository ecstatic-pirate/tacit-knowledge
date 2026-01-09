-- Migration: Add subject_type to campaigns table
-- This allows campaigns to be about a person, project, or team

-- Add subject_type column with default 'person' for backward compatibility
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS subject_type TEXT NOT NULL DEFAULT 'person'
CHECK (subject_type IN ('person', 'project', 'team'));

-- Add comment explaining the field
COMMENT ON COLUMN campaigns.subject_type IS 'Defines what is being documented: person (expert knowledge), project (project documentation), or team (team practices)';

-- Create index for filtering by subject type
CREATE INDEX IF NOT EXISTS idx_campaigns_subject_type ON campaigns(subject_type);

-- Backfill subject_type for existing campaigns with project_id
UPDATE campaigns
SET subject_type = 'project'
WHERE project_id IS NOT NULL AND subject_type = 'person';

-- Backfill subject_type for existing campaigns with team_id (and no project_id)
UPDATE campaigns
SET subject_type = 'team'
WHERE team_id IS NOT NULL AND project_id IS NULL AND subject_type = 'person';
