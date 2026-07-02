CREATE TYPE proposal_status AS ENUM ('queued', 'in_progress', 'completed', 'failed');
CREATE TYPE proposal_language AS ENUM ('en', 'he');
CREATE TYPE proposal_pricing_model AS ENUM (
  'fixed_fee',
  'time_and_materials',
  'capped_hours_bundle',
  'monthly_retainer'
);

CREATE TABLE IF NOT EXISTS business_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  business_requirement text NOT NULL,
  pricing_model proposal_pricing_model NOT NULL,
  estimated_hours numeric(10,2),
  hourly_rate numeric(12,2),
  currency char(3) NOT NULL DEFAULT 'NIS',
  payment_distribution text NOT NULL,
  requested_language proposal_language NOT NULL DEFAULT 'en',
  status proposal_status NOT NULL DEFAULT 'queued',
  english_html text,
  hebrew_html text,
  generation_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS business_proposals_customer_id_idx
  ON business_proposals(customer_id);

CREATE INDEX IF NOT EXISTS business_proposals_status_idx
  ON business_proposals(status);

CREATE INDEX IF NOT EXISTS business_proposals_created_at_idx
  ON business_proposals(created_at DESC);
