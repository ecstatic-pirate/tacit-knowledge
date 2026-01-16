-- Add processing status tracking to sessions table
-- This tracks the status of post-session AI processing

ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
ADD COLUMN IF NOT EXISTS processing_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS processing_error text,
ADD COLUMN IF NOT EXISTS processing_steps_completed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS processing_metrics jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining status values
COMMENT ON COLUMN public.sessions.processing_status IS
  'Status of post-session AI processing: pending, processing, completed, failed, partial';

-- Add index for querying sessions by processing status
CREATE INDEX IF NOT EXISTS sessions_processing_status_idx
  ON public.sessions(processing_status)
  WHERE deleted_at IS NULL;

-- Add index for finding failed sessions that need retry
CREATE INDEX IF NOT EXISTS sessions_processing_failed_idx
  ON public.sessions(processing_status, processing_started_at)
  WHERE processing_status IN ('failed', 'partial') AND deleted_at IS NULL;
