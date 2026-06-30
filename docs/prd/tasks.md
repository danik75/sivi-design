# Tasks Feature — PRD

Owner: pm (Product Manager)
Date: 2026-06-30

---

## Overview

Enable users to create, manage, and track tasks with scheduling, customer association, progress tracking, and two visualisation modes: a Gantt chart (default) and a grid table. Tasks are the primary work-unit in sivi-design and are linked optionally to customers.

---

## 1) Data Model

### Tasks table

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  start_date    date NOT NULL,
  start_time    time,                         -- NULL means 00:00 (start of day)
  end_date      date NOT NULL,
  end_time      time,                         -- NULL means 24:00 (end of day)
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'started', 'completed', 'aborted')),
  customer_id   uuid REFERENCES customers(id) ON DELETE SET NULL,
  estimated_hours numeric(6,2),               -- optional time estimate in hours
  percent_complete integer NOT NULL DEFAULT 0
                  CHECK (percent_complete BETWEEN 0 AND 100),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_customer_id_idx ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS tasks_start_date_idx  ON tasks(start_date);
CREATE INDEX IF NOT EXISTS tasks_status_idx      ON tasks(status);
```

### Field rules

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Free text, max 255 chars |
| `description` | No | Multi-line free text |
| `start_date` | Yes | ISO date |
| `start_time` | No | Defaults to `00:00` when absent |
| `end_date` | Yes | Must be ≥ `start_date` |
| `end_time` | No | Defaults to `24:00` (23:59:59) when absent |
| `status` | Yes | `pending` \| `started` \| `completed` \| `aborted` |
| `customer_id` | No | FK to customers; null = no customer |
| `estimated_hours` | No | Decimal, e.g. `2.5` = 2h 30m |
| `percent_complete` | Yes | 0–100; only editable on update (not create) |

---

## 2) API Endpoints (NestJS)

### Base path: `/tasks`

| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | List tasks (filterable, paginated) |
| GET | `/tasks/:id` | Get single task |
| POST | `/tasks` | Create task |
| PATCH | `/tasks/:id` | Update task (incl. percent_complete) |
| DELETE | `/tasks/:id` | Delete task |

### Query params for GET /tasks

| Param | Type | Description |
|---|---|---|
| `search` | string | Filter by name or description |
| `status` | string | Filter by status value |
| `customer_id` | uuid | Filter by associated customer |
| `from` | date | Tasks with end_date >= from |
| `to` | date | Tasks with start_date <= to |
| `view` | `gantt` \| `grid` | Hint for FE (optional, ignored by BE) |
| `page` | number | Page number (default 1) |
| `limit` | number | Page size (default 25) |

### Create task — POST /tasks

```json
{
  "name": "Initial onboarding",
  "description": "Get the customer set up in the system",
  "start_date": "2026-07-01",
  "start_time": "09:00",
  "end_date": "2026-07-05",
  "end_time": null,
  "status": "pending",
  "customer_id": "uuid-or-null",
  "estimated_hours": 8
}
```

`percent_complete` is NOT accepted on create — always starts at 0.

### Update task — PATCH /tasks/:id

All fields optional. `percent_complete` only settable here.

```json
{
  "status": "started",
  "percent_complete": 40,
  "estimated_hours": 10
}
```

---

## 3) Frontend — Task Form (Create / Edit Modal)

### Fields in form

| Field | Control | Notes |
|---|---|---|
| Task name | Text input | Required |
| Description | Textarea | Optional |
| Start date | Date picker | Required |
| Start time | Time picker | Optional; placeholder "Start of day (00:00)" |
| End date | Date picker | Required; must be ≥ start date |
| End time | Time picker | Optional; placeholder "End of day (24:00)" |
| Status | Select | `Pending / Started / Completed / Aborted` |
| Customer | Searchable lookup | Optional; typeahead from `/customers` |
| Time estimate | Number input (hours) | Optional; e.g. "8h" |
| % Complete | Slider or number input (0–100) | **Edit only** — hidden on create form |

### Validation rules (FE + BE)

- `name` required, non-empty
- `start_date` required
- `end_date` required and ≥ `start_date`
- If same day: `end_time` must be > `start_time` (when both set)
- `percent_complete` 0–100 integer
- `estimated_hours` positive decimal

---

## 4) Frontend — Views

### 4a. Gantt View (default)

- Horizontal bar chart showing each task as a bar spanning its start→end range
- X-axis: timeline with selectable range: **Day / Week / Month** (default: Week)
- Y-axis: task rows (sorted by start_date asc, then name)
- Bar colour coded by status:
  - `pending` → slate / grey
  - `started` → indigo
  - `completed` → green
  - `aborted` → rose / red
- Bar fill shows `percent_complete` (partially filled bar)
- Clicking a bar opens the edit modal
- Customer name shown on the bar label (if associated)
- Range navigation: prev / next arrows + "Today" button
- Tooltip on hover: name, dates, status, % complete, customer

### 4b. Grid View

- Standard data table (reuse ChadCN Table component)
- Columns: Name, Customer, Start, End, Status, Est. Hours, % Complete, Actions
- Status shown as a coloured badge
- % Complete shown as a progress bar or numeric value
- Actions: Edit, Delete
- Sortable columns: Start, End, Status, % Complete
- Search bar (filter by name / description / customer name)
- Pagination (25 per page)

### View switcher

- Toggle in the top-right of the Tasks page: `[Gantt] [Grid]`
- Default: Gantt
- Selection persisted to localStorage key `sivi_tasks_view`

---

## 5) DB Migration File

File: `db/migrations/003_tasks.sql`

```sql
-- Migration: 003_tasks
-- Up

CREATE TABLE IF NOT EXISTS tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text,
  start_date       date NOT NULL,
  start_time       time,
  end_date         date NOT NULL,
  end_time         time,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'started', 'completed', 'aborted')),
  customer_id      uuid REFERENCES customers(id) ON DELETE SET NULL,
  estimated_hours  numeric(6,2),
  percent_complete integer NOT NULL DEFAULT 0
                     CHECK (percent_complete BETWEEN 0 AND 100),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_customer_id_idx ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS tasks_start_date_idx  ON tasks(start_date);
CREATE INDEX IF NOT EXISTS tasks_status_idx      ON tasks(status);
```

---

## 6) Seed Data (dev only)

Add to `db/seed.sql`:

```sql
-- Sample tasks (DEV only)
INSERT INTO tasks (name, description, start_date, end_date, status, customer_id, estimated_hours)
SELECT 'Initial onboarding', 'Get Acme Corp set up in the system',
       '2026-07-01', '2026-07-05', 'pending', id, 8
FROM customers WHERE name = 'Acme Corp'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (name, description, start_date, end_date, status, customer_id, estimated_hours, percent_complete)
SELECT 'Contract renewal', 'Renew annual service contract',
       '2026-07-10', '2026-07-15', 'started', id, 4, 50
FROM customers WHERE name = 'Globex Inc'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (name, description, start_date, end_date, status, estimated_hours)
VALUES ('Internal review', 'Quarterly internal process review',
        '2026-07-20', '2026-07-22', 'pending', 3)
ON CONFLICT DO NOTHING;
```

---

## 7) Acceptance Criteria

### Data

- [ ] Creating a task without a time defaults start to 00:00 and end to 24:00 (stored as NULL in DB)
- [ ] `percent_complete` field is absent from the create form and defaults to 0
- [ ] `percent_complete` is editable (0–100) on the edit form
- [ ] Customer association is optional; task saves successfully with no customer
- [ ] Status transitions are unrestricted (any → any) in this version
- [ ] Deleting a customer does not delete associated tasks (SET NULL on FK)

### Gantt view

- [ ] All tasks visible as horizontal bars on a timeline
- [ ] Day / Week / Month range switcher works and changes the X-axis scale
- [ ] Prev / Next navigation moves the visible range
- [ ] "Today" button resets view to current date
- [ ] Bar colour matches task status
- [ ] Bar fill % visually represents percent_complete
- [ ] Clicking a bar opens the edit modal pre-populated with task data
- [ ] Tooltip shows on hover with task details

### Grid view

- [ ] All tasks listed with correct column data
- [ ] Search filters by name, description, and customer name
- [ ] Status badge colour matches Gantt colour coding
- [ ] Edit and Delete actions work
- [ ] Pagination works (25/page)

### General

- [ ] View toggle (Gantt / Grid) persists across page refreshes (localStorage)
- [ ] Gantt is the default view on first load
- [ ] Tasks page accessible from sidebar nav item (currently "Coming soon" — to be replaced)

---

## 8) Backlog Items

- `db-tasks-migration` — create `003_tasks.sql` migration and run it
- `be-tasks-crud` — NestJS tasks module (controller, service, repository, DTOs) — **already done on `feature/tasks-impl`**
- `be-tasks-customer-lookup` — ensure GET /customers returns id+name for lookup typeahead
- `fe-tasks-form` — create/edit modal with all fields and validation
- `fe-tasks-gantt` — Gantt chart component (recommend `frappe-gantt` or custom with SVG/canvas)
- `fe-tasks-grid` — grid view table with search, sort, pagination
- `fe-tasks-view-switcher` — Gantt/Grid toggle + localStorage persistence
- `fe-tasks-sidebar-link` — wire up Tasks sidebar nav item to tasks page

---

## 9) Open Questions

- Should tasks support **recurring** schedules (daily/weekly/monthly repeat)? → Defer to v2
- Should `percent_complete` auto-update to 100 when status → `completed`? → Yes, enforce in BE
- Should `status` auto-update to `started` when `percent_complete` > 0? → TBD
- Gantt library preference: `frappe-gantt` (MIT, zero-dep) vs custom SVG vs `react-gantt-chart`? → Recommend `frappe-gantt` for speed
- Should tasks be assignable to users? → Defer to v2

---

Branch: `feature/prd-tasks`
