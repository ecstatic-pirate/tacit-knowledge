-- Drop existing functions to allow recreation with updated signatures
DROP FUNCTION IF EXISTS public.create_campaign_tokens(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS public.schedule_token_reminders(uuid);
DROP FUNCTION IF EXISTS public.generate_secure_token();

-- Create function to generate secure tokens
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token_bytes bytea;
BEGIN
  -- Generate 32 random bytes and convert to hex
  token_bytes := gen_random_bytes(32);
  RETURN encode(token_bytes, 'hex');
END;
$$;

-- Create function to create campaign access tokens for expert and collaborators
CREATE OR REPLACE FUNCTION public.create_campaign_tokens(
  p_campaign_id uuid,
  p_expert_email text,
  p_expert_name text,
  p_collaborators jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(
  id uuid,
  token text,
  token_type text,
  email text,
  name text,
  role text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
  v_expires_at timestamptz;
  v_collaborator jsonb;
  v_token_id uuid;
BEGIN
  -- Authorization check: ensure user can access this campaign
  IF NOT public.can_access_campaign(p_campaign_id) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access campaign %', p_campaign_id;
  END IF;

  -- Tokens expire in 30 days
  v_expires_at := now() + interval '30 days';

  -- Create expert token if email is provided
  IF p_expert_email IS NOT NULL AND p_expert_email != '' THEN
    v_token := generate_secure_token();

    INSERT INTO public.campaign_access_tokens (
      campaign_id, token, token_type, email, name, expires_at
    )
    VALUES (
      p_campaign_id, v_token, 'expert', p_expert_email, p_expert_name, v_expires_at
    )
    ON CONFLICT (token) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
    RETURNING campaign_access_tokens.id INTO v_token_id;

    RETURN QUERY SELECT
      v_token_id,
      v_token,
      'expert'::text,
      p_expert_email,
      p_expert_name,
      NULL::text,
      v_expires_at;
  END IF;

  -- Create tokens for each collaborator
  FOR v_collaborator IN SELECT * FROM jsonb_array_elements(p_collaborators)
  LOOP
    v_token := generate_secure_token();

    INSERT INTO public.campaign_access_tokens (
      campaign_id,
      token,
      token_type,
      email,
      name,
      role,
      expires_at
    )
    VALUES (
      p_campaign_id,
      v_token,
      'collaborator',
      v_collaborator->>'email',
      v_collaborator->>'name',
      v_collaborator->>'role',
      v_expires_at
    )
    ON CONFLICT (token) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
    RETURNING campaign_access_tokens.id INTO v_token_id;

    RETURN QUERY SELECT
      v_token_id,
      v_token,
      'collaborator'::text,
      (v_collaborator->>'email')::text,
      (v_collaborator->>'name')::text,
      (v_collaborator->>'role')::text,
      v_expires_at;
  END LOOP;

  RETURN;
END;
$$;

-- Note: email_reminders table already exists in production with columns:
-- id, token_id, reminder_type, scheduled_for, sent_at, status,
-- resend_message_id, error_message, created_at

-- Create function to schedule reminder emails for a token
-- This uses the existing email_reminders table schema
CREATE OR REPLACE FUNCTION public.schedule_token_reminders(p_token_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at timestamptz;
  v_token_type text;
BEGIN
  -- Get token info
  SELECT expires_at, token_type INTO v_expires_at, v_token_type
  FROM public.campaign_access_tokens
  WHERE id = p_token_id;

  IF v_expires_at IS NULL THEN
    RETURN;
  END IF;

  -- Schedule 3 reminders:
  -- Reminder 1: 7 days after token creation
  -- Reminder 2: 14 days after token creation
  -- Reminder 3: 3 days before expiration

  -- Use INSERT with conflict handling for idempotency
  INSERT INTO public.email_reminders (token_id, reminder_type, scheduled_for, status)
  VALUES
    (p_token_id, v_token_type || '_reminder_1', now() + interval '7 days', 'pending'),
    (p_token_id, v_token_type || '_reminder_2', now() + interval '14 days', 'pending'),
    (p_token_id, v_token_type || '_reminder_final', v_expires_at - interval '3 days', 'pending')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_secure_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_campaign_tokens(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_token_reminders(uuid) TO authenticated;
