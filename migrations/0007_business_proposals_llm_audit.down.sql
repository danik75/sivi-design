ALTER TABLE business_proposals
  DROP COLUMN IF EXISTS llm_response,
  DROP COLUMN IF EXISTS llm_model,
  DROP COLUMN IF EXISTS context_snapshot;
