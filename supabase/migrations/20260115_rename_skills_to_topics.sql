-- Migration: Rename skills table to topics and add suggested_by field
-- Part of F3: Topics Refactor

-- Step 1: Add suggested_by column to skills table (before rename)
-- This field tracks who suggested the topic: 'creator', 'collaborator', 'ai', 'expert', or user_id
ALTER TABLE public.skills
ADD COLUMN IF NOT EXISTS suggested_by text DEFAULT 'creator';

-- Step 2: Add comment explaining suggested_by values
COMMENT ON COLUMN public.skills.suggested_by IS 'Who suggested this topic: creator (campaign creator), collaborator (via survey), ai (AI-generated), expert (expert self-assessment), or a specific user_id';

-- Step 3: Rename skills table to topics
ALTER TABLE public.skills RENAME TO topics;

-- Step 4: Update foreign key constraint names for clarity
-- First, drop old constraints and recreate with new names
ALTER TABLE public.topics DROP CONSTRAINT IF EXISTS skills_campaign_id_fkey;
ALTER TABLE public.topics DROP CONSTRAINT IF EXISTS skills_created_by_fkey;
ALTER TABLE public.topics DROP CONSTRAINT IF EXISTS skills_session_id_fkey;

ALTER TABLE public.topics
ADD CONSTRAINT topics_campaign_id_fkey
FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE public.topics
ADD CONSTRAINT topics_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.topics
ADD CONSTRAINT topics_session_id_fkey
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL;

-- Step 5: Update graph_nodes foreign key from skill_id to topic_id
ALTER TABLE public.graph_nodes RENAME COLUMN skill_id TO topic_id;

-- Drop old foreign key and create new one
ALTER TABLE public.graph_nodes DROP CONSTRAINT IF EXISTS graph_nodes_skill_id_fkey;

ALTER TABLE public.graph_nodes
ADD CONSTRAINT graph_nodes_topic_id_fkey
FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL;

-- Step 6: Rename extracted_skills column in documents table to extracted_topics
ALTER TABLE public.documents RENAME COLUMN extracted_skills TO extracted_topics;

-- Step 7: Update RLS policies if any exist for skills table
-- (They should automatically apply to renamed table, but let's be explicit)

-- Drop and recreate the index for better naming
DROP INDEX IF EXISTS skills_campaign_id_idx;
DROP INDEX IF EXISTS skills_session_id_idx;
CREATE INDEX IF NOT EXISTS topics_campaign_id_idx ON public.topics(campaign_id);
CREATE INDEX IF NOT EXISTS topics_session_id_idx ON public.topics(session_id);

-- Step 8: Add index for suggested_by to support filtering
CREATE INDEX IF NOT EXISTS topics_suggested_by_idx ON public.topics(suggested_by);
