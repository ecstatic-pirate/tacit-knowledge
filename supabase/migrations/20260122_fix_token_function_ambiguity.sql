-- Fix ambiguous column reference in create_campaign_tokens function
-- The RETURNS TABLE has a column named 'token' which conflicts with the table column

DROP FUNCTION IF EXISTS public.create_campaign_tokens(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.create_campaign_tokens(
  p_campaign_id uuid,
  p_expert_email text,
  p_expert_name text,
  p_collaborators jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(
  id uuid,
  token_value text,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_campaign_tokens(uuid, text, text, jsonb) TO authenticated;
