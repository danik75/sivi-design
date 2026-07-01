CREATE TYPE expense_category AS ENUM (
  'software',
  'hardware',
  'subcontractor',
  'travel',
  'office',
  'other'
);

CREATE TYPE expense_status AS ENUM ('active', 'inactive');

CREATE TABLE IF NOT EXISTS expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor      text NOT NULL,
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  currency    char(3) NOT NULL DEFAULT 'NIS',
  date        date NOT NULL,
  category    expense_category NOT NULL,
  description text,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status      expense_status NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_customer_id_idx ON expenses(customer_id);
CREATE INDEX IF NOT EXISTS expenses_status_idx      ON expenses(status);
CREATE INDEX IF NOT EXISTS expenses_date_idx        ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx    ON expenses(category);
