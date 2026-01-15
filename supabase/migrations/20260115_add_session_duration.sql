-- Add session_duration column to campaigns table
-- Default is 30 minutes for existing campaigns
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS session_duration integer DEFAULT 30;

COMMENT ON COLUMN public.campaigns.session_duration IS 'Target duration for capture sessions in minutes (30, 45, or 60)';
