-- F4: Session ↔ Person Link
-- Add participant_id to sessions table to link sessions with participants

-- Add participant_id column to sessions
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL;

-- Add index for participant_id
CREATE INDEX IF NOT EXISTS idx_sessions_participant_id ON public.sessions(participant_id);

-- Add comment
COMMENT ON COLUMN public.sessions.participant_id IS 'Links session to a specific participant (for project campaigns)';
