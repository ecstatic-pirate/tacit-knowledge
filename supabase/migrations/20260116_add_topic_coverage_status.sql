-- Add coverage_status column to topics table
-- This enables 4-tier coverage tracking: not_discussed, mentioned, partial, full
-- The coverage accumulates across sessions via the knowledge_topic_coverage junction table

-- Add coverage_status column to topics
ALTER TABLE public.topics
ADD COLUMN IF NOT EXISTS coverage_status text DEFAULT 'not_discussed';

-- Add check constraint for valid values
ALTER TABLE public.topics
ADD CONSTRAINT topics_coverage_status_check
CHECK (coverage_status IN ('not_discussed', 'mentioned', 'partial', 'full'));

-- Add comment explaining the coverage levels
COMMENT ON COLUMN public.topics.coverage_status IS
  'Topic coverage status: not_discussed (default), mentioned (briefly touched), partial (discussed but not in depth), full (thoroughly covered). Accumulated across sessions.';

-- Backfill existing data: captured=true -> full, otherwise not_discussed
UPDATE public.topics
SET coverage_status = CASE
  WHEN captured = true THEN 'full'
  ELSE 'not_discussed'
END
WHERE coverage_status IS NULL OR coverage_status = 'not_discussed';

-- Add index for filtering by coverage status
CREATE INDEX IF NOT EXISTS topics_coverage_status_idx
  ON public.topics(campaign_id, coverage_status)
  WHERE deleted_at IS NULL;

-- Create function to calculate coverage status from knowledge_topic_coverage
CREATE OR REPLACE FUNCTION public.calculate_topic_coverage_status(p_topic_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_level text;
  v_coverage_order integer;
BEGIN
  -- Get the maximum coverage level from all linked knowledge nodes
  SELECT COALESCE(MAX(
    CASE coverage_level
      WHEN 'full' THEN 4
      WHEN 'partial' THEN 3
      WHEN 'mentioned' THEN 2
      ELSE 1
    END
  ), 1)
  INTO v_coverage_order
  FROM public.knowledge_topic_coverage
  WHERE topic_id = p_topic_id;

  -- Convert back to text
  RETURN CASE v_coverage_order
    WHEN 4 THEN 'full'
    WHEN 3 THEN 'partial'
    WHEN 2 THEN 'mentioned'
    ELSE 'not_discussed'
  END;
END;
$$;

-- Create trigger function to update topic coverage_status when junction table changes
CREATE OR REPLACE FUNCTION public.update_topic_coverage_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_topic_id uuid;
  v_new_status text;
  v_is_full boolean;
BEGIN
  -- Get the topic_id from the affected row
  IF TG_OP = 'DELETE' THEN
    v_topic_id := OLD.topic_id;
  ELSE
    v_topic_id := NEW.topic_id;
  END IF;

  -- Calculate new coverage status
  v_new_status := public.calculate_topic_coverage_status(v_topic_id);
  v_is_full := (v_new_status = 'full');

  -- Update the topic
  UPDATE public.topics
  SET
    coverage_status = v_new_status,
    -- Also update captured flag for backward compatibility
    captured = CASE WHEN v_is_full THEN true ELSE captured END,
    captured_at = CASE
      WHEN v_is_full AND captured = false THEN now()
      ELSE captured_at
    END,
    updated_at = now()
  WHERE id = v_topic_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on knowledge_topic_coverage
DROP TRIGGER IF EXISTS trigger_update_topic_coverage ON public.knowledge_topic_coverage;
CREATE TRIGGER trigger_update_topic_coverage
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_topic_coverage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_coverage_status();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.calculate_topic_coverage_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_topic_coverage_status(uuid) TO service_role;
