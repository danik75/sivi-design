# Task Time Tracking, Hourly Gantt & Customer Cost Report — PRD

Owner: pm (Product Manager)
Date: 2026-07-04

---

## Overview

Three connected enhancements that turn Tasks from a scheduling tool into a lightweight time-and-cost tracker:

1. **Hourly (intra-day) Gantt view** — short tasks that run for a few hours on a single day are currently invisible on the Gantt (its columns are whole days). Add a day view whose columns are **hours** so multi-hour tasks appear as real, sized bars.
2. **Actual hours on completion** — when a task is marked **done**, capture how many hours it actually took, persist it, and pre-populate the field with the estimate.
3. **Customer task-hours & cost report** — a new report that lists a customer's tasks with estimated vs actual hours, an optional hourly fee, and the resulting cost, filtered by date range (default: current month).

These build on the existing `tasks` table (`estimated_hours`, `start_time`, `end_time`, `status`) and the existing reports framework.

---

## Current state (grounding)

- **Tasks table** (`db/schema.sql`): has `start_date`, `end_date`, `start_time TIME`, `end_time TIME`, `estimated_hours NUMERIC(6,2)`, `percent_complete`, and `status TEXT CHECK (status IN ('pending','in_progress','done','cancelled'))`. There is **no `actual_hours`** column. `done` is the completed state.
- **Gantt** (`fe/src/features/tasks/components/TasksGantt.jsx`): purely day-column based. `VIEW_RANGES = { day: 14, week: 28, month: 84 }` — even "day" view renders 14 **days**. Bars are positioned/sized by `start_date`→`end_date`, so a task that starts and ends on the same day has ~0 width and is effectively invisible. `start_time`/`end_time` are stored but **not used** by the Gantt.
- **Reports** (`fe/src/features/reports/index.jsx`): a registry map `{ id: { label, component } }`; BE endpoints in `be/src/reports/reports.controller.ts` (`@Get('...')`), FE calls via `reportsApi.js` `r(path, params)`. Shared `PeriodFilter` supports `monthly | yearly | range`; shared `ReportShell` wraps each report.

---

## Feature 1 — Hourly (intra-day) Gantt view

### Problem
On the Gantt, columns represent days. A task with `start_date === end_date` (e.g. "Logo touch-ups, 09:00–13:00") collapses to a sliver and cannot be seen or interacted with. Users want to see tasks that take **several hours**.

### Solution
Add a **Day** zoom level that renders a **single day** with **hour columns**, positioning each bar by time-of-day.

### Behaviour
- **View switcher**: extend the existing toggle to `Day (hours) / Week / Month`. The current 14-day "day" mode is replaced by the hourly day view; `week`/`month` are unchanged.
  - Keep `view` values explicit: `hour` (new, single-day hourly), `week`, `month`. (Rename in code to avoid confusion with the old `day`.)
- **X-axis**: hours of the selected day. Default visible window **07:00–21:00** (configurable constant `GANTT_DAY_START_HOUR` / `GANTT_DAY_END_HOUR`); allow horizontal scroll to reach 00:00–24:00.
- **Bar geometry**:
  - `left` = `start_time` (fraction of the day window), `width` = `end_time − start_time`.
  - If a task has `estimated_hours` but no `start_time`/`end_time`, render a block of that duration starting at a default anchor (`start_time` if present, else `GANTT_DAY_START_HOUR`), shown with a dashed/"estimated" style.
  - If a task has neither times nor an estimate, show it in a thin **"all-day / untimed"** lane at the top of the day.
- **Multi-day tasks** in day view: clamp the bar to the selected day's window and show a left/right "continues" chevron when it extends beyond the visible day.
- **Navigation**: prev/next **day** arrows + **Today** button (reuse existing `goToday`, adapted to single-day stepping).
- **Minimum bar width**: enforce a readable minimum (e.g. 24px) so very short tasks remain clickable.
- Bar colour by status, `percent_complete` fill, click-to-edit, and hover tooltip all behave as in the day/week/month views today. Tooltip additionally shows `start_time–end_time` and `estimated`/`actual` hours.

### Non-goals
- Drag-to-reschedule at hour granularity (v2). In the hourly view, dragging may be disabled or snapped to whole days initially.
- Overlap/lane-packing of many concurrent tasks (v2 — initial version may stack rows one task per row, same as today).

---

## Feature 2 — Actual hours on completion

### Data model change
Add a nullable column:

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(6,2)
  CHECK (actual_hours IS NULL OR actual_hours >= 0);
```

Also add it to `db/schema.sql` (tasks table) so fresh setups include it. Apply on staging Supabase as a manual migration (same pattern as `business_proposals.content_json`).

| Field | Required | Notes |
|---|---|---|
| `actual_hours` | No | Decimal hours the task actually took; set when completing, editable afterwards |

### Behaviour
- When a task's status transitions **to `done`** (from the Gantt bar menu, the grid row action, or the edit modal), prompt for **Actual hours** before saving.
  - The input is **pre-populated with `estimated_hours`** (or the existing `actual_hours` if already set, else `estimated_hours`, else empty).
  - Confirming persists `status: 'done'` **and** `actual_hours` in the same `PATCH /tasks/:id`.
- `actual_hours` is also editable on the normal **edit modal** (plain number field, shown alongside "Estimated hours").
- If the user reopens a done task and changes status away from `done`, `actual_hours` is retained (not cleared).
- **Display**: show `actual_hours` in the grid (new "Actual" column next to "Est."), in the edit form, and in the Gantt tooltip. When both exist, optionally show a variance hint (actual − estimated).

### API
`PATCH /tasks/:id` accepts optional `actual_hours` (validated `>= 0`). Returned task objects include `actualHours`. `POST /tasks` does **not** accept `actual_hours` (always starts null).

### Completion dialog (FE)
Small confirm dialog (reuse ChadCN Dialog):
- Title: "Complete task"
- Body: one number input "Actual hours" (step 0.25), pre-filled with the estimate, helper text "Estimated: {estimated_hours}h".
- Actions: Cancel / Mark done.
- Validation: `>= 0`; empty allowed (persists null) but nudges the user to fill it.

---

## Feature 3 — Customer task-hours & cost report

### Purpose
Give a per-customer breakdown of all tasks in a period: what was worked on, how long it **actually** took, and — with an hourly fee — how much it costs.

### Registration
- FE: add to the reports registry in `fe/src/features/reports/index.jsx` as `'customer-tasks': { label: 'Customer Task Hours', component: CustomerTaskHoursReport }` and a new `components/CustomerTaskHoursReport.jsx`.
- BE: add `@Get('customer-tasks')` in `reports.controller.ts` → service → repository; FE helper `getCustomerTaskHours(params)` in `reportsApi.js`.

### Filters
- **Date range** (`from`, `to`): reuse `PeriodFilter`. **Default = current month** (`period: 'monthly'`, current year/month → resolves to first…last day of the current month). Range and yearly modes also supported.
- **Customer** (optional): dropdown of customers (typeahead), plus an "All customers" option. When "All", the report groups rows by customer.
- **Hourly fee**: a number input on the report toolbar (default the Sivi standard **250 ₪/hr**, editable). Cost is computed as `actual_hours × hourly_fee`. Changing the fee re-computes costs instantly (client-side; the BE returns hours, the FE multiplies — or the BE accepts `hourlyRate` and returns costs. Prefer FE multiplication so the slider is instant).

### Data / matching
- A task falls in the period if it **overlaps** `[from, to]` (i.e. `start_date <= to AND end_date >= from`).
- "How much they actually took" uses `actual_hours`; when a task has no `actual_hours` (e.g. not yet done), fall back to `estimated_hours` and flag the row as "estimated".
- Cost uses `actual_hours` where present, else the estimated fallback (clearly marked).

### Table columns
| Column | Source |
|---|---|
| Task | `name` |
| Customer | `customer_id` → name (hidden when a single customer is selected) |
| Status | `status` badge |
| Start / End | `start_date` (+ `start_time`), `end_date` (+ `end_time`) |
| Estimated (h) | `estimated_hours` |
| Actual (h) | `actual_hours` (or estimate, marked) |
| Cost | `actual_hours × hourly_fee` (currency) |

- **Group subtotals** per customer (when "All customers"): sum of estimated, actual, cost.
- **Grand totals** row: total estimated hours, total actual hours, total cost.
- Empty state when no tasks in the period.

### API shape (BE)
`GET /reports/customer-tasks?from=YYYY-MM-DD&to=YYYY-MM-DD&customerId=<uuid|omitted>`

```json
{
  "from": "2026-07-01",
  "to": "2026-07-31",
  "rows": [
    {
      "taskId": "…",
      "name": "Logo touch-ups",
      "customerId": "…",
      "customerName": "Dani",
      "status": "done",
      "startDate": "2026-07-03", "startTime": "09:00",
      "endDate": "2026-07-03",   "endTime": "13:00",
      "estimatedHours": 4,
      "actualHours": 4.5,
      "actualIsEstimate": false
    }
  ],
  "totals": { "estimatedHours": 4, "actualHours": 4.5 }
}
```

Costs are derived on the FE (`actualHours × hourlyFee`) so the fee control is instant; the endpoint stays fee-agnostic.

---

## DB Migration

File: `db/migrations/00X_task_actual_hours.sql` (and mirror into `db/schema.sql`):

```sql
-- Up
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(6,2)
  CHECK (actual_hours IS NULL OR actual_hours >= 0);
```

Staging: run `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(6,2);` on Supabase (idempotent).

---

## Acceptance Criteria

### Hourly Gantt
- [ ] A new **Day (hours)** view renders a single day with hour columns.
- [ ] A same-day task with `start_time`/`end_time` appears as a bar sized to its hours and is clickable.
- [ ] A same-day task with only `estimated_hours` renders a duration block (marked as estimated).
- [ ] Multi-day tasks are clamped to the visible day with a "continues" indicator.
- [ ] Prev/Next day + Today navigation work; Week/Month views are unchanged.
- [ ] Tooltip shows start–end time and estimated/actual hours.

### Actual hours
- [ ] `tasks.actual_hours` column exists (migration + schema.sql).
- [ ] Marking a task **done** opens a dialog pre-filled with the estimate; confirming persists `status='done'` and `actual_hours`.
- [ ] `actual_hours` is editable on the edit modal and shown in the grid ("Actual" column) and Gantt tooltip.
- [ ] `PATCH /tasks/:id` accepts and validates `actual_hours >= 0`; `POST` ignores it.
- [ ] Changing status away from `done` does not clear `actual_hours`.

### Customer report
- [ ] New "Customer Task Hours" report appears in the reports list.
- [ ] Defaults to the **current month** on first open.
- [ ] Lists tasks overlapping the period with estimated & actual hours.
- [ ] Hourly fee input (default 250 ₪) drives a Cost column and totals; changing it updates costs instantly.
- [ ] "All customers" groups by customer with subtotals; selecting one customer filters and hides the customer column.
- [ ] Grand totals row shows total estimated hours, actual hours, and cost.
- [ ] Date-range and yearly modes work via `PeriodFilter`.

---

## Backlog Items

- `db-tasks-actual-hours` — migration `00X_task_actual_hours.sql` + `schema.sql`; apply on staging Supabase.
- `be-tasks-actual-hours` — accept/validate/return `actual_hours` in tasks DTO/repository/service.
- `fe-tasks-complete-dialog` — completion dialog capturing actual hours (pre-filled with estimate); wire to Gantt/grid/edit "mark done".
- `fe-tasks-actual-hours-display` — show actual hours in grid, edit form, tooltip.
- `fe-gantt-hourly-view` — hourly single-day Gantt view (new `hour` view mode, time-based bar geometry, clamping, min width, day navigation).
- `be-report-customer-tasks` — `GET /reports/customer-tasks` (period overlap + customer filter) returning task rows and hour totals.
- `fe-report-customer-tasks` — `CustomerTaskHoursReport.jsx` (PeriodFilter default current month, customer selector, hourly-fee input, cost + totals), registry + `reportsApi` entry.

---

## Open Questions

- Hourly Gantt default window: fixed 07:00–21:00, or derived from the day's earliest/latest task times? → Propose fixed window + scroll; revisit.
- Should `actual_hours` be **required** to mark a task done, or optional (nudge only)? → Propose optional in v1.
- Hourly fee: single global rate on the report, or per-customer default (e.g. from a customer field / contract `hourly_rate`)? → v1 single editable rate defaulting to 250 ₪; consider per-customer default in v2.
- For untimed same-day tasks, anchor the estimated block at `GANTT_DAY_START_HOUR` or stack in an "untimed" lane? → Propose untimed lane for clarity.
- Should the report be exportable (CSV/PDF)? → Defer to v2.

---

Branch: `docs/prd-task-time-tracking`
