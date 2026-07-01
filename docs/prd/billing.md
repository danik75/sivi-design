# Billing Feature — PRD

Owner: pm (Product Manager)
Date: 2026-07-01

---

## Overview

Provide a consolidated financial view of the business across time. The Billing screen surfaces a period-scoped snapshot of revenue and costs, showing which customers generated paid income, what was spent on their behalf, and the resulting net balance per customer.

The screen operates in two modes:

- **Monthly** — a single calendar month selected by the user (e.g. July 2026)
- **Yearly** — a full calendar year (e.g. 2026)

Each mode renders the same customer-level summary table, scoped to the chosen period. Only customers who have at least one **paid** invoice whose issue date falls within the period are included; customers with only drafts, sent, or cancelled invoices are excluded.

Clicking a customer row opens a **Customer Billing Detail** panel that shows the full breakdown: all invoices, expenses, tasks, and contracts for that customer, plus a net balance computed as `paid invoices total − expenses total`.

The scope of v1 includes **period overview + per-customer detail read view**. It does not include payment tracking beyond invoice status, PDF export, budget forecasting, or multi-currency conversion.

---

## 1) Data Model

No new database tables are required. The Billing feature aggregates data from existing tables: `invoices`, `invoice_line_items`, `expenses`, `tasks`, and `contracts`.

### Key source tables and fields used

| Table | Fields used | Filter |
|---|---|---|
| `invoices` | `customer_id`, `total`, `currency`, `status`, `issue_date` | `status = 'paid'`, `issue_date` within period |
| `expenses` | `customer_id`, `amount`, `currency`, `date`, `status` | `date` within period |
| `tasks` | `customer_id`, `name`, `status`, `start_date`, `end_date`, `estimated_hours`, `percent_complete` | all statuses |
| `contracts` | `customer_id`, `type`, `status`, `total_amount`, `hourly_rate`, `monthly_fee` | all statuses |
| `customers` | `id`, `name` | joined via `customer_id` |

### Derived balance definition

```
balance = SUM(paid invoice totals in period) − SUM(expense amounts in period)
```

- **Paid invoices** — invoices with `status = 'paid'` and `issue_date` within the selected period
- **Expenses** — expenses with `date` within the selected period and `status = 'active'`
- **Balance** is positive when revenue exceeds expenses (net income), negative when expenses exceed revenue (net loss)

### Currency handling in v1

Multi-currency aggregation is out of scope. When a customer has records in multiple currencies, amounts are grouped and displayed per currency rather than combined into a single total. Each currency group shows its own subtotals and balance.

### Period boundary definitions

| Mode | Start (inclusive) | End (inclusive) |
|---|---|---|
| Monthly | First day of selected month at 00:00 local | Last day of selected month at 23:59 local |
| Yearly | January 1 of selected year at 00:00 local | December 31 of selected year at 23:59 local |

Date comparison uses `issue_date` for invoices and `date` for expenses.

---

## 2) API Endpoints

### Base path: `/billing`

| Method | Path | Description |
|---|---|---|
| GET | `/billing/overview` | Period summary: one row per customer with paid income, expenses, and balance |
| GET | `/billing/customer/:customerId` | Full customer breakdown: invoices, expenses, tasks, contracts + balance |

### Query parameters (shared by both endpoints)

| Param | Type | Required | Notes |
|---|---|---|---|
| `period` | `monthly` \| `yearly` | Yes | Selects the aggregation mode |
| `year` | integer | Yes | e.g. `2026` |
| `month` | integer 1–12 | Required when `period=monthly` | e.g. `7` for July; ignored when `period=yearly` |

---

### GET /billing/overview

Returns one summary object per customer who has at least one paid invoice in the selected period, sorted by balance descending (highest earners first).

Example request:

```http
GET /billing/overview?period=monthly&year=2026&month=7
```

Example response:

```json
{
  "period": { "type": "monthly", "year": 2026, "month": 7 },
  "customers": [
    {
      "customerId": "4a4db57c-fd55-482a-9a60-7a7db6efb482",
      "customerName": "Acme Corp",
      "currencies": [
        {
          "currency": "NIS",
          "paidInvoicesTotal": "6142.50",
          "expensesTotal": "1200.00",
          "balance": "4942.50"
        }
      ]
    },
    {
      "customerId": "9bb2c109-ec11-4c3a-9b30-21e6af1a9301",
      "customerName": "Beta Ltd",
      "currencies": [
        {
          "currency": "USD",
          "paidInvoicesTotal": "3000.00",
          "expensesTotal": "500.00",
          "balance": "2500.00"
        },
        {
          "currency": "NIS",
          "paidInvoicesTotal": "800.00",
          "expensesTotal": "950.00",
          "balance": "-150.00"
        }
      ]
    }
  ]
}
```

Yearly example request:

```http
GET /billing/overview?period=yearly&year=2026
```

Response shape is identical; the `period` object omits `month`.

Validation failures:

- HTTP `400 Bad Request` if `period` is missing or invalid
- HTTP `400 Bad Request` if `year` is missing or out of a reasonable range (e.g. < 2000 or > 2100)
- HTTP `400 Bad Request` if `period=monthly` and `month` is missing or not 1–12

---

### GET /billing/customer/:customerId

Returns the full breakdown for a single customer scoped to the period. Includes all invoices (any status), all expenses, all tasks, and all contracts for the customer, plus the computed balance for the period.

Example request:

```http
GET /billing/customer/4a4db57c-fd55-482a-9a60-7a7db6efb482?period=monthly&year=2026&month=7
```

Example response:

```json
{
  "period": { "type": "monthly", "year": 2026, "month": 7 },
  "customerId": "4a4db57c-fd55-482a-9a60-7a7db6efb482",
  "customerName": "Acme Corp",
  "balance": [
    {
      "currency": "NIS",
      "paidInvoicesTotal": "6142.50",
      "expensesTotal": "1200.00",
      "balance": "4942.50"
    }
  ],
  "invoices": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-0007",
      "status": "paid",
      "issueDate": "2026-07-01",
      "dueDate": "2026-07-31",
      "total": "6142.50",
      "currency": "NIS",
      "contractTypeLabel": "Time & Materials (T&M)"
    }
  ],
  "expenses": [
    {
      "id": "uuid",
      "vendor": "AWS",
      "amount": "1200.00",
      "currency": "NIS",
      "date": "2026-07-15",
      "category": "hosting",
      "status": "active"
    }
  ],
  "tasks": [
    {
      "id": "uuid",
      "name": "Homepage redesign",
      "status": "done",
      "startDate": "2026-07-01",
      "endDate": "2026-07-20",
      "estimatedHours": 40,
      "percentComplete": 100
    }
  ],
  "contracts": [
    {
      "id": "uuid",
      "type": "time_and_materials",
      "typeLabel": "Time & Materials (T&M)",
      "status": "active",
      "hourlyRate": "120.00",
      "currency": "NIS"
    }
  ]
}
```

Notes:

- `invoices` contains all invoices for the customer regardless of status; the balance computation uses only `paid` invoices within the period
- `expenses` contains all active expenses for the customer; balance computation uses only expenses whose `date` falls within the period
- `tasks` and `contracts` are not period-filtered — they reflect the full customer picture for context
- The `balance` array groups by currency the same way as the overview response

Validation failures:

- HTTP `404 Not Found` if `customerId` does not exist
- HTTP `400 Bad Request` for invalid period params (same rules as overview)

---

## 3) Business Rules

### Customer inclusion in overview

- A customer appears in the overview **only if** they have at least one invoice with `status = 'paid'` and `issue_date` within the selected period.
- Customers with only draft, sent, cancelled, or zero invoices in the period are excluded.
- Customers who have expenses in the period but no paid invoices are also excluded from the overview; their costs are only visible via direct lookup.

### Balance computation

- `paidInvoicesTotal` — `SUM(invoices.total)` where `status = 'paid'` and `issue_date` within period
- `expensesTotal` — `SUM(expenses.amount)` where `status = 'active'` and `date` within period
- `balance` — `paidInvoicesTotal − expensesTotal`
- A positive balance indicates net income for the period; a negative balance indicates costs exceed received revenue.
- All monetary values are returned as strings to preserve decimal precision.

### Period scoping

- For `monthly` mode, the period spans the full calendar month.
- For `yearly` mode, the period spans January 1 through December 31.
- The default period on first load is the current calendar month.

### Sorting

- Overview rows are sorted by balance descending within each currency group.
- If a customer has multiple currencies, they appear as a single expanded row (or multiple sub-rows, depending on FE implementation).

### Detail data scope

- The customer detail panel (`/billing/customer/:customerId`) fetches all invoices, expenses, tasks, and contracts for that customer unconditionally (no status or date filter applied to those lists).
- The balance block within the detail panel remains period-scoped (same params as the overview).
- Tasks and contracts provide context for the customer relationship; they do not contribute to the financial balance.

---

## 4) FE Behavior

### 4a. Sidebar entry

- Add a new sidebar item: **Billing**
- Icon: a simple bar-chart or wallet icon consistent with the existing sidebar style
- Route recommendation: `/billing`

### 4b. Income distribution pie chart

A pie chart is displayed above the summary table, showing each qualifying customer's share of total paid income for the period.

- Each slice represents one customer
- Slice size = `customer paidInvoicesTotal / total paidInvoicesTotal across all customers` (per currency)
- Hovering a slice highlights the corresponding row in the summary table and shows a tooltip: `Customer Name — amount (percentage%)`
- Clicking a slice opens the Customer Billing Detail for that customer
- When multiple currencies exist, render one pie chart per currency or default to the dominant currency and note the others
- Chart library recommendation: `recharts` (already common in React/Tailwind stacks; lightweight, composable)
- The chart uses the same color palette as the existing status badges extended with per-customer colors assigned deterministically (e.g. by hashing customer ID into a fixed palette)

**`GET /billing/overview` already returns all data needed for the chart** — no additional endpoint required. The FE derives each customer's percentage from the returned `paidInvoicesTotal` values.

### 4c. Billing overview page

**Period controls (top of page):**

- Toggle: **Monthly** | **Yearly**
- Monthly mode: month selector (dropdown or left/right arrows) + year selector
- Yearly mode: year selector only (left/right arrows or dropdown)
- Default: current calendar month
- Changing the period immediately re-fetches `GET /billing/overview`

**Summary table columns:**

| Column | Notes |
|---|---|
| Customer | Customer name; clickable to open Customer Billing Detail |
| Paid Income | Sum of paid invoice totals in period, per currency |
| Expenses | Sum of active expense amounts in period, per currency |
| Balance | `Paid Income − Expenses`; colored green if positive, red if negative |

**Empty state:**

- "No paid invoices found for this period." with a link to Invoices

**Loading state:**

- Skeleton rows consistent with existing grids

**Error state:**

- Inline banner with retry

### 4c. Customer Billing Detail panel

Opens when the user clicks a customer row in the overview. Renders as a slide-over panel or a full-page sub-route (e.g. `/billing/customer/:customerId?period=monthly&year=2026&month=7`).

**Balance summary bar (top of panel):**

- Displays the period-scoped balance: Paid Income | Expenses | Net Balance
- Net balance colored green (positive) or red (negative)
- Shows currency label alongside each figure

**Four content sections (tabs or stacked):**

| Section | Content | Notes |
|---|---|---|
| Invoices | All customer invoices, any status; columns: Invoice #, Status badge, Issue Date, Due Date, Total, Currency | Paid invoices in the period highlighted |
| Expenses | All active customer expenses; columns: Vendor, Category, Amount, Currency, Date | Expenses within period highlighted |
| Tasks | All customer tasks; columns: Name, Status badge, Start, End, Est. Hours, % Complete | Read-only, no actions |
| Contracts | All customer contracts; columns: Type, Status, Amount/Rate, Currency | Read-only, no actions |

**Navigation:**

- Back button or close button returns to the overview
- Period selector in the panel header stays in sync with the overview period

### 4d. Balance display rules

| Balance | Display |
|---|---|
| Positive (`> 0`) | Green text, e.g. `+4,942.50 NIS` |
| Zero (`= 0`) | Neutral (slate) text, e.g. `0.00 NIS` |
| Negative (`< 0`) | Red text, e.g. `−150.00 NIS` |

### 4e. Multi-currency display

When a customer has records in more than one currency, the overview row expands to show one balance line per currency. The FE should not attempt to convert or sum across currencies.

### 4f. Period navigation

- Left/right arrow buttons step the period backward/forward by one month (monthly mode) or one year (yearly mode).
- Navigating forward past the current month/year is allowed (useful for planning), but the data will likely be empty.
- The current month/year is visually indicated (e.g. "July 2026 ·  current").

---

## 5) Acceptance Criteria

### API

- [ ] `GET /billing/overview?period=monthly&year=2026&month=7` returns only customers with at least one paid invoice in July 2026.
- [ ] `GET /billing/overview?period=yearly&year=2026` returns only customers with at least one paid invoice in 2026.
- [ ] Each customer entry in the overview includes `paidInvoicesTotal`, `expensesTotal`, and `balance` per currency.
- [ ] `balance` is computed as `paidInvoicesTotal − expensesTotal`.
- [ ] `expensesTotal` includes only active expenses (`status = 'active'`) whose `date` falls within the period.
- [ ] Customers with no paid invoices in the period are excluded from the overview.
- [ ] `GET /billing/customer/:customerId` returns all invoices, expenses, tasks, and contracts for the customer.
- [ ] The `balance` block in the customer detail response is period-scoped.
- [ ] Missing or invalid `period`, `year`, or `month` params return HTTP `400 Bad Request`.
- [ ] A non-existent `customerId` on the detail endpoint returns HTTP `404 Not Found`.
- [ ] All monetary values are returned as strings.

### Business behavior

- [ ] Monthly period covers the full calendar month (first day through last day inclusive).
- [ ] Yearly period covers January 1 through December 31 inclusive.
- [ ] A customer with expenses but no paid invoices in the period does not appear in the overview.
- [ ] Multi-currency customers show one balance entry per currency, not a combined total.
- [ ] A negative balance is valid and must not be rejected or hidden.

### Frontend

- [ ] The sidebar contains a Billing navigation item.
- [ ] The Billing page renders a period toggle (Monthly / Yearly) and a period selector.
- [ ] The default period is the current calendar month.
- [ ] The overview table shows Customer, Paid Income, Expenses, and Balance columns.
- [ ] Balance is green when positive and red when negative.
- [ ] Clicking a customer opens the Customer Billing Detail.
- [ ] The detail panel shows period-scoped balance at the top.
- [ ] The detail panel includes Invoices, Expenses, Tasks, and Contracts sections.
- [ ] Navigating the period (arrows or dropdown) re-fetches the overview data.
- [ ] Empty state is shown when no customers qualify for the selected period.
- [ ] The detail panel period stays in sync with the overview period selector.
- [ ] A pie chart is displayed above the summary table showing each customer's share of total paid income for the period.
- [ ] Hovering a pie slice shows a tooltip with the customer name, amount, and percentage.
- [ ] Clicking a pie slice opens the Customer Billing Detail for that customer.
- [ ] The pie chart updates when the period changes.
- [ ] When there is only one customer (100% slice) or no data, the chart renders an appropriate state.

---
