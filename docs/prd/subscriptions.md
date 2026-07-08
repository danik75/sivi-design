# Subscriptions (recurring expenses) — PRD

Status: Draft
Owner: Daniel Pritsker
Created: 2026-07-08

## Overview

Add **subscriptions** — recurring monthly expenses — to the Expenses area. Unlike
a one-off expense (a single vendor/amount/date), a subscription is an ongoing
monthly charge described by a **name, start date, monthly payment, and a renewal
day** (the day of the month it renews). The Expenses tab surfaces subscriptions
alongside one-off expenses, with a **pie chart splitting subscriptions by monthly
fee** and a headline **total monthly recurring spend**.

## Current state (grounding)

- `expenses`: `vendor`, `amount`, `currency`, `date`, `category`
  (`expense_category` enum: software/hardware/subcontractor/travel/office/other),
  `description`, `customer_id`, `status` (`active|inactive`). One-off only — no
  recurrence.
- FE `fe/src/features/expenses`: `ExpenseGrid` + `ExpenseModal` +
  `ExpenseDeactivateDialog`, wired in `index.jsx`. No chart today.
- `recharts` is available (used in reports/billing) for the pie.
- Expenses are soft-deleted via `PATCH /expenses/:id/deactivate` (status →
  `inactive`); the same lifecycle fits subscriptions (cancel = deactivate).

## Goals

1. Model a **subscription**: name, start date, monthly payment, currency,
   **renewal day** (1–31), optional category/customer/description.
2. Manage subscriptions (create / edit / cancel) in the **Expenses tab**.
3. A **pie chart** splitting active subscriptions by **monthly fee**.
4. Show the **total monthly recurring spend** (sum of active subscriptions'
   monthly payments, per currency).
5. Show each subscription's **next renewal date** (derived from the renewal day).

## Non-goals

- No automatic creation of expense rows on each renewal (subscriptions are
  tracked/summarised, not auto-posted as individual expenses). Can be a future
  enhancement.
- No proration or mid-month cancellation math — the monthly figure is the
  subscription's `monthly_amount`.
- No multi-currency conversion — totals are grouped by currency.

## Data model

### New table `subscriptions`

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT             NOT NULL CHECK (char_length(trim(name)) > 0),
  start_date     DATE             NOT NULL,
  monthly_amount NUMERIC(14,2)    NOT NULL CHECK (monthly_amount > 0),
  currency       CHAR(3)          NOT NULL DEFAULT 'NIS',
  renewal_day    INTEGER          NOT NULL CHECK (renewal_day BETWEEN 1 AND 31),
  category       expense_category,
  description    TEXT,
  customer_id    UUID             REFERENCES customers(id) ON DELETE SET NULL,
  status         expense_status   NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
);
```

Reuses the existing `expense_category` and `expense_status` enums. `db/schema.sql`
gets the table; `be/src/migrations.ts` gets an idempotent
`CREATE TABLE IF NOT EXISTS subscriptions (...)` so hosted DBs get it on boot.

### Derived values (not stored)

- **Next renewal date** — the next occurrence of `renewal_day` on/after today,
  **clamped to the month length** (e.g. renewal day 31 → Feb 28/29). Never before
  `start_date`.
- **Monthly recurring total** — `Σ monthly_amount` over `status='active'`
  subscriptions, grouped by currency.

## API — `/subscriptions`

Mirrors the expenses controller style.

- `GET /subscriptions?status=active|inactive|all` → list; each row includes
  `nextRenewalDate` (computed server-side) and the raw fields.
- `POST /subscriptions` — `CreateSubscriptionDto`: `name`, `startDate`,
  `monthlyAmount` (>0), `currency`, `renewalDay` (1–31), optional `category`,
  `customerId`, `description`.
- `PUT /subscriptions/:id` — edit (same shape, partial).
- `PATCH /subscriptions/:id/deactivate` — cancel (status → `inactive`).
- `GET /subscriptions/summary` → `{ totalsByCurrency: [{ currency, monthlyTotal,
  count }], byCurrencyBreakdown? }` for the headline total (the pie can also be
  built client-side from the list).

Validation: `renewalDay` 1–31 (`@Min(1) @Max(31)`), `monthlyAmount` positive.

## Frontend — Expenses tab

Add a **sub-navigation** to the Expenses page: **Expenses** (existing one-offs)
and **Subscriptions** (new). The Subscriptions view contains:

### Summary + pie
- A **headline card**: "Total monthly recurring — `<amount> <currency>`" (one per
  currency if mixed), plus the count of active subscriptions.
- A **pie chart** (recharts) where each slice is a subscription, sized by its
  **monthly fee**; legend + tooltip show name and amount; label shows the % of
  total monthly spend.

### Subscriptions grid
Columns: **Name · Monthly fee · Renewal day · Next renewal · Start date ·
Category · Status · Actions**. "Add Subscription" opens a modal; a cancel
(deactivate) action per row (with confirm dialog, like expenses).

### Subscription modal
Fields: **Name**, **Start date** (DatePicker), **Monthly payment** + currency,
**Renewal day** (1–31; a number input or day-of-month dropdown), optional
**Category** and **Customer** and **Description**. Reuses the expense
category/currency options.

Hooks/services mirror `fe/src/features/expenses` (`useSubscriptions`,
`useCreateSubscription`, `useUpdateSubscription`, `useDeactivateSubscription`,
`subscriptionsApi`).

## DB Migration

1. `db/schema.sql`: add the `subscriptions` table (after `expenses`).
2. `be/src/migrations.ts`: append an idempotent
   `{ name: 'subscriptions.table', sql: 'CREATE TABLE IF NOT EXISTS subscriptions (...)' }`
   (full create, guarded by IF NOT EXISTS; enums already exist).

## Acceptance criteria

- A subscription can be created with name, start date, monthly payment, currency
  and renewal day; it persists and appears in the Subscriptions grid.
- Each row shows the correct **next renewal date** derived from the renewal day
  (clamped for short months; never before start date).
- The **pie chart** shows one slice per active subscription sized by monthly fee.
- The **total monthly recurring** equals the sum of active subscriptions'
  monthly payments (per currency) and updates as subscriptions are added/cancelled.
- Cancelling (deactivating) a subscription removes it from the active total/pie
  but keeps it visible under an "inactive/all" filter.

## Backlog items

- **BE-1**: `subscriptions` table (schema + idempotent migration).
- **BE-2**: `CreateSubscriptionDto` + repository + service + controller (CRUD +
  deactivate), with `nextRenewalDate` computed and `renewalDay` validation.
- **BE-3**: `GET /subscriptions/summary` (monthly totals by currency).
- **FE-1**: Expenses tab sub-navigation (Expenses | Subscriptions).
- **FE-2**: Subscriptions grid + row actions + hooks/services.
- **FE-3**: Subscription modal (create/edit).
- **FE-4**: Summary card (monthly total) + pie chart by monthly fee.
- **QA**: renewal-day edge cases (28/29/30/31), currency grouping, cancel flow.

## Open questions

1. **Scope of "recurring"**: only these subscriptions, or should the summary also
   fold in any other recurring expenses (e.g. a future "recurring" flag on
   `expenses`)? (Recommendation: subscriptions only for now; the wording "or
   other recurring payments" is covered by categorising them as subscriptions.)
2. **Renewal cadence**: monthly only, or also support yearly/weekly? (This PRD is
   monthly; a `cadence` column could extend it later.)
3. **Auto-posting**: should a real `expenses` row be generated on each renewal so
   it flows into P&L/reports, or is the subscription list purely a tracker?
   (Recommendation: tracker now; auto-post is a follow-up.)
4. **Category**: required or optional on a subscription? (Recommendation:
   optional, defaulting to `software`.)
