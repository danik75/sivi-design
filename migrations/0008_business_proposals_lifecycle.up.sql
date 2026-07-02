DO $$
BEGIN
  CREATE TYPE proposal_lifecycle_status AS ENUM ('sent', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE business_proposals
  ADD COLUMN IF NOT EXISTS lifecycle_status proposal_lifecycle_status NOT NULL DEFAULT 'sent';
