# Task ↔ Contract Tracking, Prepaid-Hours Burndown & Contract Reports — PRD

Status: Draft
Owner: Daniel Pritsker
Created: 2026-07-07

## Overview

Let tasks be associated with one of a customer's **active contracts**, track how
much of a **prepaid-hours** block has been consumed, warn when a new estimate
would exhaust the paid hours, and add two reports: task distribution per
contract (with a prepaid-hours pie chart) and a historical tasks-by-
customer/contract breakdown (including tasks not tied to any contract).

## Current state (grounding)

- `tasks`: has `customer_id`, `estimated_hours`, `actual_hours`, `status`
  (`pending|in_progress|done|cancelled`), `percent_complete`. **No `contract_id`.**
- `contracts`: `type` ∈ `lump_sum | time_and_materials | prepaid_hours |
  monthly_retainer`, `status` ∈ `active | inactive`. Prepaid blocks carry
  `hours_purchased` and `amount_paid`; T&M carries `hourly_rate`.
- FE `useContracts({ customerId, status })` already fetches a customer's
  contracts; the Task modal has a Customer dropdown (`useCustomersLookup`).
- Reports framework: `REPORT_GROUPS` (`fe/src/features/reports/constants.js`) +
  `REPORT_META` (`index.jsx`) map an id → component; reports use the shared
  `PeriodFilter` + `ReportShell`. `recharts` is available (used for pie charts in
  billing).
- `actual_hours` is captured when a task is completed (completion popup).

## Goals

1. Associate a task with **one active contract** of its customer (optional).
2. For a **prepaid-hours** contract, show **hours remaining** =
   `hours_purchased − Σ(actual_hours of all tasks on that contract)`.
3. When a new/edited task's estimate would **spill over** the prepaid block, show
   a **warning popup** ("the hours the customer paid for are exhausted") and
   require the user to confirm before saving.
4. Report: **Tasks per Contract** — distribution of tasks across contracts.
5. For prepaid contracts, a **pie chart** of used vs remaining hours.
6. Report: **Task History by Customer / Contract** — historical, grouped by
   customer → contract, including tasks with **no contract**.

## Non-goals

- No automatic billing/deduction from the prepaid block (reporting + warning
  only; invoicing stays manual via the existing invoice flow).
- No enforcement/hard block on overspend — the spillover popup warns but the user
  may still confirm and save.
- A task belongs to at most one contract (no split across contracts).

## Data model

### `tasks.contract_id`

```sql
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;
```

Nullable — a task may have no contract. `ON DELETE SET NULL` so deactivating/
deleting a contract doesn't orphan tasks. Add an idempotent entry to
`be/src/migrations.ts` and update `db/schema.sql`.

Integrity note (validated in the service layer, not a DB constraint): a task's
`contract_id`, when set, must belong to the task's `customer_id`.

### Prepaid-hours usage (derived, not stored)

For a `prepaid_hours` contract:

```
hoursUsed      = COALESCE(SUM(t.actual_hours) WHERE t.contract_id = :contractId), 0)
hoursRemaining = contract.hours_purchased − hoursUsed
percentUsed    = hoursUsed / contract.hours_purchased          (clamped 0..1, guard /0)
```

`actual_hours` is only set on completed tasks, so "used" reflects real logged
time. (Open question: whether in-progress `estimated_hours` should count toward a
"projected used" figure — see Open Questions.)

## Feature 1 — Associate a task with an active contract

### Behaviour
- The Task modal gains a **Contract** dropdown, shown once a Customer is chosen.
- Options = that customer's **active** contracts (`useContracts({ customerId,
  status: 'active' })`), each labelled by type + a short descriptor (e.g.
  "Prepaid hours — 40h", "T&M — ₪250/h", "Lump sum"). Plus a "— No contract —"
  option (default).
- Changing the customer clears the selected contract.
- Persisted via `tasks.contract_id`.

### API
- `CreateTaskDto` / `UpdateTaskDto` gain optional `contractId` (`@IsOptional
  @IsUUID`). Repository selects `t.contract_id AS "contractId"` and, for display,
  may join the contract type/label.
- Service validates the contract belongs to the customer and is active on create/
  update; otherwise `400`.

## Feature 2 — Prepaid-hours remaining indicator

### Behaviour
- When the selected contract is `prepaid_hours`, the Task modal shows a live
  **"X of Y hours remaining"** line (Y = `hours_purchased`), with a small
  progress bar. Excludes the task being edited from the used sum (so re-saving
  doesn't double-count its own actual hours).

### API
- `GET /contracts/:id/usage` → `{ contractId, type, hoursPurchased, hoursUsed,
  hoursRemaining, percentUsed }`. Returns nulls/`type` for non-prepaid contracts.
  Optionally accepts `excludeTaskId` to omit the current task from the sum.

## Feature 3 — Spillover warning popup

### Trigger
On saving a task **associated with a prepaid contract**, compute the projected
total against the paid block:

```
projected = hoursUsed(excluding this task) + thisTask.estimatedHours   // "current estimation"
```

If `projected > contract.hours_purchased`, intercept the save and open a
**warning dialog**:

> "This will exceed the hours the customer prepaid on this contract
>  (Y h purchased, Z h used, this task adds E h). The prepaid block is
>  exhausted. Save anyway?"

- **Cancel** → return to the modal (nothing saved).
- **Save anyway** → proceed with the update/create.

Notes:
- Uses `estimated_hours` for the projection ("in current estimation"). When the
  task is later completed with `actual_hours`, the same check applies at
  completion time (the completion popup already runs on done).
- Non-prepaid contracts (or no contract) never trigger the popup.

## Feature 4 — Report: Tasks per Contract

### Purpose
Show how tasks are distributed across a customer's contracts for a period.

### Filters
Shared `PeriodFilter` (monthly/yearly/range, default current month) + a Customer
selector (all customers or one). Matches tasks by `end_date` within the range
(consistent with the existing Task Hours report).

### Table columns
Contract (type + descriptor) · Tasks (count) · Estimated (h) · Actual (h) ·
[prepaid only] Purchased (h) · Used (h) · Remaining (h) · % Used.

### Prepaid pie chart (Feature 5)
For each `prepaid_hours` contract in view (or a selected one), a **recharts
`PieChart`** with two slices — **Used** vs **Remaining** — labelled with the
percentage. If overrun (`used > purchased`), show Used = purchased and an
"Over by N h" callout (no negative slice).

### API
`GET /reports/tasks-per-contract?from&to&customerId?` →

```jsonc
{
  "rows": [
    { "contractId": "…", "customerId": "…", "customerName": "…",
      "contractType": "prepaid_hours", "contractLabel": "Prepaid hours — 40h",
      "taskCount": 7, "estimatedHours": 22.5, "actualHours": 18.0,
      "hoursPurchased": 40, "hoursUsed": 18.0, "hoursRemaining": 22.0,
      "percentUsed": 0.45 }
  ]
}
```

Non-prepaid rows omit the prepaid fields (null).

## Feature 6 — Report: Task History by Customer / Contract

### Purpose
Historical view of tasks grouped by **customer → contract**, explicitly
including tasks with **no contract** (and customers with no contract at all).

### Structure
- Grouped/expandable: Customer → [each contract] → tasks, plus a **"No contract"**
  bucket under each customer for its unassigned tasks.
- Per task: name, dates, status, estimated/actual hours, contract (or "—").
- Period filter (range, defaulting wider — e.g. current year) so it's a history
  view; a customer filter to focus on one.

### API
`GET /reports/task-history?from&to&customerId?` → customers, each with a
`contracts[]` (id/label + its tasks) and an `unassignedTasks[]` bucket. Tasks
where `contract_id IS NULL` fall into `unassignedTasks`; a customer with only
unassigned tasks still appears.

## DB Migration

1. `db/schema.sql`: add `tasks.contract_id` (FK, ON DELETE SET NULL).
2. `be/src/migrations.ts`:
   `{ name: 'tasks.contract_id', sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL' }`.

No backfill (existing tasks keep `NULL` = no contract).

## Acceptance criteria

### Association
- The Task modal shows a Contract dropdown listing only the customer's **active**
  contracts, plus "No contract"; selection persists and round-trips.
- Saving a task with a contract that isn't the customer's active contract → `400`.
- Changing the customer clears the contract.

### Prepaid remaining
- For a prepaid contract, the modal shows correct **remaining** hours =
  `hours_purchased − Σ(actual_hours of the contract's other tasks)`.

### Spillover
- Creating/editing a task on a prepaid contract whose estimate pushes projected
  usage over `hours_purchased` opens the warning popup; **Cancel** aborts, **Save
  anyway** persists.
- No popup for non-prepaid or no-contract tasks, or when still within the block.

### Reports
- **Tasks per Contract** lists contracts with task counts and hours; prepaid rows
  show purchased/used/remaining/% and render a Used-vs-Remaining **pie chart**;
  overrun is shown without a negative slice.
- **Task History** groups tasks by customer → contract, shows a **No contract**
  bucket, and includes customers/tasks with no contract.

## Backlog items

- **BE-1**: `tasks.contract_id` (schema + migration).
- **BE-2**: task DTO/repo/service — accept/return/validate `contractId`.
- **BE-3**: `GET /contracts/:id/usage` (prepaid burndown, `excludeTaskId`).
- **BE-4**: `GET /reports/tasks-per-contract`.
- **BE-5**: `GET /reports/task-history`.
- **FE-1**: Task modal — Contract dropdown + prepaid "remaining" indicator.
- **FE-2**: Spillover warning dialog wired into the task save (create + edit +
  completion).
- **FE-3**: `TasksPerContractReport` (table + prepaid pie chart) — register in
  `REPORT_GROUPS`/`REPORT_META`.
- **FE-4**: `TaskHistoryByContractReport` (grouped, incl. No-contract) — register.
- **QA**: association round-trip, remaining math, spillover confirm/cancel, both
  reports incl. overrun and no-contract cases.

## Open questions

1. **Projection basis**: for "remaining" and the spillover check, count only
   completed `actual_hours`, or also in-progress `estimated_hours` as projected
   usage? (Recommendation: remaining = actuals; spillover projection = actuals +
   this task's estimate.)
2. **Contract dropdown scope**: only `active` contracts, or also show the
   currently-linked contract even if it went `inactive` (so old tasks still show
   their contract)? (Recommendation: show active + the already-linked one.)
3. **Report period matching**: match tasks by `end_date` (like Task Hours) or by
   `start_date`/overlap?
4. Should the spillover warning also fire on the **completion** popup when
   `actual_hours` (not just estimate) crosses the block, in addition to save?
