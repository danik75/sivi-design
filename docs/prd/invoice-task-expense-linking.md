# Invoice ↔ Task & Expense Linking (checkbox pickers) — PRD

Status: Draft
Owner: Daniel Pritsker
Created: 2026-07-05

## Overview

Today, when a user picks a contract on the invoice create/edit flow, the invoice
line items are **auto-prepopulated** from a prefill endpoint that pulls the
contract fee plus *every* non-cancelled task and *every* active expense for the
customer. This is noisy (it dumps unfinished tasks and unrelated expenses) and
gives the user no control over what actually goes on the invoice.

This feature replaces auto-prepopulation with **explicit, opt-in pickers**:

- A **"Add from tasks"** button opens a multi-select (checkbox) list of the
  customer's **done** tasks that are **not already on another invoice**.
- A **"Add from expenses"** button opens a searchable multi-select of the
  customer's **active** expenses that are **not already on another invoice**.
- Each checked item becomes a line-item row, carrying its **source date** (task
  end date / expense date) which is shown on the line and in invoice details.

The relation "task/expense belongs to invoice X" is expressed through the
existing `invoice_line_items.source_type` + `source_id` columns — no join table
is introduced.

## Current state (grounding)

- `invoice_line_items` already has `source_type TEXT CHECK (source_type IN
  ('task','expense','contract','manual'))` and `source_id UUID`
  (`db/schema.sql`). This is the linking mechanism.
- `GET /invoices/prefill/:contractId` → `InvoiceRepository.getInvoicePrefill`
  returns suggested line items: the contract fee, **all** tasks with
  `status != 'cancelled' AND estimated_hours > 0`, and **all** active expenses
  for the customer (matching contract currency).
- FE: `useInvoicePrefill(contractId)` (lazy query) + `InvoiceModal.jsx` writes
  the suggestions into `lineItems`. `InvoiceLineItemsEditor.jsx` renders the
  editable rows.
- `tasks`: has `status` (`pending|in_progress|done|cancelled`), `customer_id`,
  `end_date`, `estimated_hours`, `actual_hours`.
- `expenses`: has `vendor`, `amount`, `currency`, `date`, `customer_id`,
  `status` (`active|…`), `description`.

## Goals

1. Relate tasks to an invoice and expenses to an invoice (via line-item source).
2. Replace prefill auto-population with explicit checkbox pickers on
   create **and** edit.
3. Task picker lookup = **done** tasks for the selected customer that are
   **unrelated to any other invoice**.
4. Expense picker lookup = customer expenses that are **unrelated to any other
   invoice** (searchable).
5. Show the **task end date** / **expense date** on the line-item rows and in
   invoice details.
6. **Cancelling an invoice unrelates it from all its tasks and expenses**, so
   those items become available to pick again.
7. A task/expense that is on an invoice **shows that invoice's number**
   (read-only — it cannot be edited from the task/expense).
8. A task/expense linked to an invoice **cannot be cancelled or deleted**; the
   user must open the invoice and unrelate it first.

## Non-goals

- No new many-to-many join table (source columns are sufficient).
- No change to how the contract fee line is produced (still available; see
  Open Questions on whether it stays auto-added or moves behind a button).
- No partial/percentage billing of a task across multiple invoices — a task is
  either linked to exactly one invoice or none.

## Data model

### Linking (reuse existing columns)

A task/expense is **linked** to an invoice iff a row exists in
`invoice_line_items` with the matching `source_type` and `source_id`. "Unrelated
to other invoices" means no such row exists **in a different invoice** (the
invoice currently being edited is excluded so its own rows don't hide items from
its picker).

### New column: `invoice_line_items.source_date DATE` (nullable)

Snapshot of the source's date at the time it is added to the invoice:

- task-sourced row → `tasks.end_date`
- expense-sourced row → `expenses.date`
- contract/manual rows → `NULL`

Rationale: storing a snapshot keeps invoice details/PDF stable and avoids a join
per line at render time. Populated by the create/update path from the picker
payload.

`db/schema.sql` + idempotent entry in `be/src/migrations.ts`:
`ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS source_date DATE`.

### Cancellation lifecycle

When an invoice transitions to `status = 'cancelled'`, it is **unrelated from all
its tasks and expenses**: for that invoice's line items where
`source_type IN ('task','expense')`, clear `source_type`, `source_id` and
`source_date` (set to `NULL`). The line text/amounts stay on the cancelled
invoice for the record, but the underlying tasks/expenses are no longer linked
and immediately reappear in the pickers (the `NOT EXISTS` lookup no longer finds
a match).

Implementation: in `InvoiceRepository.update` (and any dedicated status/cancel
path), when the new status is `cancelled`, run a single
`UPDATE invoice_line_items SET source_type = NULL, source_id = NULL,
source_date = NULL WHERE invoice_id = $1 AND source_type IN ('task','expense')`.
Defence-in-depth: the availability lookups also add `AND inv.status <>
'cancelled'` (join `invoices`) so a cancelled invoice can never block re-picking
even if a link lingers.

### Reverse link (invoice number on task/expense)

Tasks and expenses expose the invoice they belong to so the UI can show it
**read-only**. Derived by a correlated lookup (a task/expense is on at most one
non-cancelled invoice, since the picker hides already-linked items):

```sql
-- added to the task / expense read queries
(SELECT inv.invoice_number
   FROM invoice_line_items li
   JOIN invoices inv ON inv.id = li.invoice_id
  WHERE li.source_type = 'task'      -- or 'expense'
    AND li.source_id = t.id          -- or e.id
    AND inv.status <> 'cancelled'
  LIMIT 1) AS "invoiceNumber",
```

Also return the `invoiceId` (for a link/navigation from the task/expense to the
invoice). These fields are **never** writable from the task/expense edit forms.

### Cancel / delete guard

A task or expense that is linked to a non-cancelled invoice **cannot be
cancelled or deleted**. The relevant BE mutations (task delete, task → status
`cancelled`; expense delete, expense → status `cancelled`) first check for an
active link and, if found, reject with `409 Conflict`:

> "This <task|expense> is on invoice <number>. Unrelate it from the invoice
> before cancelling/deleting."

Guard query (reused): `EXISTS (SELECT 1 FROM invoice_line_items li JOIN invoices
inv ON inv.id = li.invoice_id WHERE li.source_type = 'task' AND li.source_id =
$1 AND inv.status <> 'cancelled')`.

The only way to free it is to open that invoice and remove the line (or cancel
the invoice, per the Cancellation lifecycle).

## API

### `GET /invoices/available-tasks`

Query: `customerId` (required), `excludeInvoiceId` (optional — the invoice being
edited).

Returns done, unlinked tasks for the customer:

```sql
SELECT t.id, t.name, t.end_date AS "endDate",
       t.estimated_hours AS "estimatedHours",
       t.actual_hours AS "actualHours"
FROM tasks t
WHERE t.customer_id = $1
  AND t.status = 'done'
  AND NOT EXISTS (
    SELECT 1 FROM invoice_line_items li
    JOIN invoices inv ON inv.id = li.invoice_id
    WHERE li.source_type = 'task' AND li.source_id = t.id
      AND inv.status <> 'cancelled'
      AND ($2::uuid IS NULL OR li.invoice_id <> $2)
  )
ORDER BY t.end_date DESC, t.name;
```

### `GET /invoices/available-expenses`

Query: `customerId` (required), `excludeInvoiceId` (optional), optional `search`
(matches vendor/description).

```sql
SELECT e.id, e.vendor, e.amount, e.currency, e.date, e.description
FROM expenses e
WHERE e.customer_id = $1
  AND e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM invoice_line_items li
    JOIN invoices inv ON inv.id = li.invoice_id
    WHERE li.source_type = 'expense' AND li.source_id = e.id
      AND inv.status <> 'cancelled'
      AND ($2::uuid IS NULL OR li.invoice_id <> $2)
  )
ORDER BY e.date DESC, e.created_at DESC;
```

### Line-item payload

Create/update invoice line-item DTO gains an optional `sourceDate` (ISO date)
alongside the existing `sourceType`/`sourceId`, persisted to `source_date`.

The single-invoice read query returns `source_date AS "sourceDate"` per line so
the editor and details view can show it.

### Deprecate/retire prefill

`GET /invoices/prefill/:contractId` and `useInvoicePrefill` are removed (or the
contract-fee portion is kept behind an explicit "Add contract fee" action — see
Open Questions). The task/expense dumping behaviour is gone.

## Frontend UX

In `InvoiceLineItemsEditor` (or the modal toolbar above it), add two buttons:

- **Add from tasks** — disabled until a customer is selected. Opens a
  `TaskPickerDialog`: a checkbox list of done, unlinked tasks (name, end date,
  hours). A header checkbox selects all; a search box filters by name.
- **Add from expenses** — opens an `ExpensePickerDialog`: searchable checkbox
  list (vendor, date, amount, description).

On confirm, each checked item is appended as a line item:

| Source | description | quantity | unit_price | source_date |
|---|---|---|---|---|
| task (T&M contract) | task name | actual_hours ?? estimated_hours | contract hourly rate | task.end_date |
| task (other contract) | task name | 1 | 0 (editable) | task.end_date |
| expense | vendor (+ description) | 1 | expense.amount | expense.date |

Rules:

- Items already present as line items (same `source_type`+`source_id`) are shown
  **checked & disabled** in the picker (can't add twice).
- After adding, amounts/totals recompute as they do for manual rows; the user can
  still edit description/qty/price and delete rows.
- Each line row displays a **Date** column: the task end date or expense date
  (blank for contract/manual). Same column appears in the invoice details view
  (`InvoiceOverview`, on-screen and printable).
- Changing the customer clears source-linked rows (or warns), since the pickers
  are customer-scoped.

### Task & expense screens

- The task edit modal / expense modal show a **read-only "Invoice"** field with
  the linked invoice number (a link to the invoice) when `invoiceNumber` is set;
  hidden/blank otherwise. It is display-only — no input.
- Grids may show an invoice-number chip on linked rows.
- When a task/expense is linked, its **Cancel** and **Delete** actions are
  disabled (with a tooltip: "On invoice <number> — unrelate it first"). If the
  guard is somehow reached, the `409` message is surfaced as a toast/inline
  error. The user unrelates by opening the invoice and removing the line (or
  cancelling the invoice).

## DB Migration

1. `db/schema.sql`: add `source_date DATE` to `invoice_line_items`.
2. `be/src/migrations.ts`: append
   `{ name: 'invoice_line_items.source_date', sql: 'ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS source_date DATE' }`.

No backfill required (existing rows keep `NULL`).

## Acceptance Criteria

### Linking & lookups
- Task picker lists only `status='done'` tasks for the selected customer.
- A task already linked to another invoice does **not** appear in the picker.
- When editing an invoice, tasks/expenses linked to **that** invoice still appear
  (checked/disabled) and are not treated as "linked elsewhere".
- Expense picker lists only active, unlinked expenses for the customer and is
  searchable by vendor/description.

### Line items
- Checking N tasks/expenses and confirming adds exactly N rows with correct
  `source_type`, `source_id`, `source_date`, and sensible qty/price defaults.
- The same task/expense cannot be added twice to one invoice.
- Saving the invoice persists the source link and `source_date`; reopening the
  invoice shows the rows with their dates.

### Prefill removal
- Selecting a contract no longer auto-dumps tasks/expenses into the line items.

### Cancellation
- Setting an invoice to `cancelled` clears the task/expense source links on its
  line items; those tasks/expenses reappear in the pickers immediately.
- A cancelled invoice never blocks a task/expense from being picked, even if a
  stale link remained.

### Reverse link & guard
- A task/expense on a non-cancelled invoice shows that invoice's number
  (read-only) on its edit screen; it cannot be changed there.
- Attempting to cancel or delete a linked task/expense is blocked with a `409`
  naming the invoice; the FE disables those actions for linked items.
- After the invoice unrelates the item (line removed or invoice cancelled), the
  task/expense can be cancelled/deleted again.

### Dates in details
- Invoice details (screen + printable) show the task end date / expense date on
  each sourced line.

## Backlog Items

- **BE-1**: Add `source_date` to `invoice_line_items` (schema + migration).
- **BE-2**: `GET /invoices/available-tasks` (done + unlinked, customer-scoped,
  `excludeInvoiceId`).
- **BE-3**: `GET /invoices/available-expenses` (active + unlinked, searchable,
  `excludeInvoiceId`).
- **BE-4**: Persist/return `sourceDate` on line-item create/update/read; remove
  the prefill endpoint (or reduce to contract-fee only).
- **BE-5**: On invoice → `cancelled`, unlink its task/expense line items
  (`source_type`/`source_id`/`source_date` → `NULL`); add `inv.status <>
  'cancelled'` guard to both availability lookups.
- **BE-6**: Return `invoiceNumber`/`invoiceId` on task and expense reads
  (correlated lookup, non-cancelled invoices only).
- **BE-7**: Guard task/expense **delete** and **→ cancelled** transitions with a
  `409` when linked to a non-cancelled invoice.
- **FE-5**: Read-only "Invoice" field + disabled Cancel/Delete (with tooltip) on
  task and expense screens when linked; surface the `409` message.
- **FE-1**: `TaskPickerDialog` (checkbox multiselect + search, checked/disabled
  for already-linked).
- **FE-2**: `ExpensePickerDialog` (searchable checkbox multiselect).
- **FE-3**: Wire "Add from tasks/expenses" buttons into the invoice modal; map
  checked items → line items with correct defaults; drop `useInvoicePrefill`.
- **FE-4**: Add a Date column to the line-items editor and to `InvoiceOverview`
  (screen + printable).
- **QA**: verify no double-linking, customer switch behaviour, edit-invoice
  re-linking, and PDF rendering of dates.

## Open Questions

1. **Contract fee line**: keep it auto-added when a contract is selected, or move
   it behind an explicit "Add contract fee" button too? (Recommendation: keep the
   contract fee auto-added; only tasks/expenses move to pickers.)
2. **Currency**: should the expense picker filter to the invoice currency (as the
   old prefill did), or show all and warn on mismatch?
3. **Customer switch with existing sourced rows**: clear silently, or confirm?
4. **Deleting a linked line item** (on an active invoice) frees the task/expense
   to be picked again — confirmed desired (falls out of the `NOT EXISTS` lookup).
   Cancelling an invoice is handled explicitly (see Cancellation lifecycle).
