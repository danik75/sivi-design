ALTER TABLE business_proposals
  ADD COLUMN IF NOT EXISTS context_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS llm_model text,
  ADD COLUMN IF NOT EXISTS llm_response jsonb;
