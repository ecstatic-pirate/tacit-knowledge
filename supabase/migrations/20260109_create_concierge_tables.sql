-- Migration: Create AI Concierge tables
-- Enables RAG-based chat over captured knowledge with conversation persistence

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS public.concierge_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_concierge_conversations_user_id
  ON public.concierge_conversations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_concierge_conversations_org_id
  ON public.concierge_conversations(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_concierge_conversations_updated_at
  ON public.concierge_conversations(updated_at DESC) WHERE deleted_at IS NULL;

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.concierge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.concierge_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB, -- Array of {type, id, title, excerpt, relevance_score, metadata}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concierge_messages_conversation_id
  ON public.concierge_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_concierge_messages_created_at
  ON public.concierge_messages(created_at DESC);

-- 3. Knowledge embeddings table (unified for all content types)
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('transcript', 'insight', 'graph_node', 'document')),
  content_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- OpenAI ada-002 dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for vector similarity search and filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_org_id
  ON public.knowledge_embeddings(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_content_type
  ON public.knowledge_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_campaign_id
  ON public.knowledge_embeddings(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_org_type
  ON public.knowledge_embeddings(org_id, content_type);

-- Vector similarity search index (IVFFlat for performance)
-- Note: This index is created after initial data load for better performance
-- For production, run: CREATE INDEX idx_knowledge_embeddings_embedding
--   ON public.knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. RLS Policies
ALTER TABLE public.concierge_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see their own
CREATE POLICY "Users can view own conversations"
  ON public.concierge_conversations FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can create own conversations"
  ON public.concierge_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.concierge_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.concierge_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON public.concierge_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.concierge_conversations
      WHERE id = conversation_id AND user_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON public.concierge_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.concierge_conversations
      WHERE id = conversation_id AND user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Embeddings: Users can query embeddings from their org
CREATE POLICY "Users can view org embeddings"
  ON public.knowledge_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND org_id = knowledge_embeddings.org_id
    )
  );

-- Allow service role full access to embeddings (for background jobs)
CREATE POLICY "Service role can manage embeddings"
  ON public.knowledge_embeddings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Trigger to update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_concierge_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.concierge_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_conversation_on_new_message ON public.concierge_messages;
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.concierge_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_concierge_conversation_timestamp();

-- 6. Function for semantic search
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_org_id uuid DEFAULT NULL,
  filter_campaign_id uuid DEFAULT NULL,
  filter_content_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_id uuid,
  campaign_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.content_type,
    ke.content_id,
    ke.campaign_id,
    ke.chunk_text,
    ke.metadata,
    1 - (ke.embedding <=> query_embedding) as similarity
  FROM public.knowledge_embeddings ke
  WHERE
    (filter_org_id IS NULL OR ke.org_id = filter_org_id)
    AND (filter_campaign_id IS NULL OR ke.campaign_id = filter_campaign_id)
    AND (filter_content_types IS NULL OR ke.content_type = ANY(filter_content_types))
    AND ke.embedding IS NOT NULL
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_knowledge TO authenticated;
