ALTER TABLE business_proposals
  DROP COLUMN IF EXISTS lifecycle_status;

DROP TYPE IF EXISTS proposal_lifecycle_status;
