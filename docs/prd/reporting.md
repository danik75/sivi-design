# Reporting Feature — PRD

Owner: pm (Product Manager)
Date: 2026-07-01

---

## Overview

The Reporting module gives a complete, multi-angle view of the business — from documents to send to customers and accountants, to data needed for planning and day-to-day visibility.

Every report is available in two renderings:

- **Table view** — structured rows for precise reading, copy/paste, and printing
- **Chart view** — visual summary for pattern recognition and presentations

Each report can be exported to CSV and, where applicable, printed or sent directly to Gmail as a pre-composed HTML email (same clipboard-paste mechanism used in the Invoices overview).

Reports are grouped into three audiences:

| Audience | Reports |
|---|---|
| **Customer-facing** | Customer Statement, Project Status Report |
| **Accountant / tax** | P&L Statement, Tax Summary, Accounts Receivable Aging |
| **Business planning / visibility** | Revenue & Expense Breakdown, Customer Profitability, Revenue Forecast, Expense Analysis |

The Reports page is accessible from the main sidebar under a new **Reports** entry.

No new database tables are required. All reports aggregate from existing tables: `customers`, `invoices`, `invoice_line_items`, `contracts`, `expenses`, `tasks`.

---

## 1) Data Model

All monetary output is returned as strings. Percentages are returned as strings to two decimal places (e.g. `"42.50"`). Dates are returned as ISO-8601 strings.

### Source tables and key fields per report

| Report | Source tables |
|---|---|
| P&L Statement | `invoices`, `expenses` |
| Revenue & Expense Breakdown | `invoices`, `expenses`, `customers` |
| Customer Statement | `invoices`, `expenses`, `customers` |
| AR Aging | `invoices`, `customers` |
| Tax Summary | `invoices`, `customers` |
| Expense Analysis | `expenses`, `customers` |
| Customer Profitability | `invoices`, `expenses`, `customers` |
| Revenue Forecast | `contracts`, `invoices`, `customers` |
| Project Status | `tasks`, `contracts`, `customers` |

### Shared period filter

All reports that accept a period filter use the same query-param shape already defined in the Billing PRD:

| Param | Type | When required |
|---|---|---|
| `period` | `monthly` \| `yearly` \| `range` | Yes |
| `year` | integer | `monthly` and `yearly` |
| `month` | integer 1–12 | `monthly` only |
| `from` | ISO date `YYYY-MM-DD` | `range` only |
| `to` | ISO date `YYYY-MM-DD` | `range` only |

`range` mode allows arbitrary date ranges (needed for customer statements and tax filings covering non-calendar spans).

---

## 2) API Endpoints

### Base path: `/reports`

| Method | Path | Report |
|---|---|---|
| GET | `/reports/pl` | P&L Statement |
| GET | `/reports/revenue-breakdown` | Revenue & Expense Breakdown |
| GET | `/reports/customer-statement/:customerId` | Customer Statement |
| GET | `/reports/ar-aging` | Accounts Receivable Aging |
| GET | `/reports/tax-summary` | Tax Summary |
| GET | `/reports/expense-analysis` | Expense Analysis |
| GET | `/reports/customer-profitability` | Customer Profitability |
| GET | `/reports/forecast` | Revenue Forecast |
| GET | `/reports/project-status` | Project Status |

All endpoints require authentication (same JWT middleware as the rest of the app).

---

### 2a. P&L Statement — `GET /reports/pl`

Profit-and-loss statement across all customers for the selected period. Intended for the business owner and accountant.

Query params: `period`, `year`, `month`, `from`, `to`

Example request:

```http
GET /reports/pl?period=monthly&year=2026&month=7
```

Example response:

```json
{
  "period": { "type": "monthly", "year": 2026, "month": 7 },
  "summary": {
    "revenue": "12480.00",
    "expenses": "3200.00",
    "grossProfit": "9280.00",
    "profitMarginPct": "74.36",
    "currency": "NIS"
  },
  "rows": [
    {
      "label": "Jul '26",
      "revenue": "12480.00",
      "expenses": "3200.00",
      "grossProfit": "9280.00",
      "profitMarginPct": "74.36"
    }
  ],
  "trend": [
    { "label": "Aug '25", "revenue": "8100.00", "expenses": "2100.00", "grossProfit": "6000.00", "profitMarginPct": "74.07" },
    { "label": "Sep '25", "revenue": "9400.00", "expenses": "2700.00", "grossProfit": "6700.00", "profitMarginPct": "71.28" }
  ]
}
```

`trend` always returns the 12-month (monthly) or 5-year (yearly) lookback used for context.

**Chart:** ComposedChart — Revenue bar (indigo), Expenses bar (rose), Gross Profit line (emerald). Second line for Profit Margin % on a right Y-axis.

**Table columns:** Period · Revenue · Expenses · Gross Profit · Margin %

---

### 2b. Revenue & Expense Breakdown — `GET /reports/revenue-breakdown`

Breaks revenue and expenses down by customer and category within the selected period.

Query params: `period`, `year`, `month`, `from`, `to`

Example response:

```json
{
  "period": { "type": "monthly", "year": 2026, "month": 7 },
  "byCustomer": [
    {
      "customerId": "uuid",
      "customerName": "Acme Corp",
      "revenue": "8400.00",
      "expenses": "1200.00",
      "net": "7200.00",
      "currency": "NIS"
    }
  ],
  "expensesByCategory": [
    { "category": "hosting", "total": "800.00", "currency": "NIS", "pct": "25.00" },
    { "category": "subcontractor", "total": "2400.00", "currency": "NIS", "pct": "75.00" }
  ]
}
```

**Charts:** Stacked bar chart (revenue vs expenses per customer) + pie chart for expense categories.

**Table:** Two sub-tables — one per customer, one per expense category.

---

### 2c. Customer Statement — `GET /reports/customer-statement/:customerId`

Full chronological financial history for one customer. Designed to be sent to the customer as a periodic account summary.

Query params: `period`, `year`, `month`, `from`, `to` (default: current year-to-date)

Example response:

```json
{
  "customerId": "uuid",
  "customerName": "Acme Corp",
  "period": { "from": "2026-01-01", "to": "2026-07-01" },
  "openingBalance": "0.00",
  "closingBalance": "4800.00",
  "currency": "NIS",
  "entries": [
    {
      "date": "2026-01-15",
      "type": "invoice",
      "reference": "INV-0002",
      "description": "January retainer",
      "amount": "3000.00",
      "runningBalance": "3000.00",
      "status": "paid"
    },
    {
      "date": "2026-02-01",
      "type": "expense",
      "reference": "EXP-0010",
      "description": "AWS hosting",
      "amount": "-800.00",
      "runningBalance": "2200.00",
      "status": "active"
    }
  ]
}
```

`amount` is positive for invoices (income), negative for expenses (cost). `runningBalance` is the cumulative net at each entry.

**Chart:** Area chart of `runningBalance` over time with a zero reference line.

**Table columns:** Date · Type · Reference · Description · Amount · Running Balance · Status

**"Send to Customer" button:** Opens Gmail compose with `to` pre-filled from the customer's primary contact email; copies a styled HTML version of the statement to the clipboard. Subject: `Account Statement — Acme Corp — Jan–Jul 2026`.

---

### 2d. Accounts Receivable Aging — `GET /reports/ar-aging`

All unpaid (status = `sent`) invoices grouped by how overdue they are relative to their due date. Designed for cash-flow management and follow-up. No period filter — always reflects the current open AR position.

Example response:

```json
{
  "asOf": "2026-07-01",
  "summary": {
    "totalOutstanding": "18400.00",
    "current": "6000.00",
    "days1to30": "4200.00",
    "days31to60": "5000.00",
    "days61to90": "1800.00",
    "days90plus": "1400.00"
  },
  "invoices": [
    {
      "invoiceId": "uuid",
      "invoiceNumber": "INV-0011",
      "customerId": "uuid",
      "customerName": "Beta Ltd",
      "issueDate": "2026-05-01",
      "dueDate": "2026-05-31",
      "total": "5000.00",
      "currency": "NIS",
      "daysOverdue": 31,
      "bucket": "days31to60"
    }
  ]
}
```

Buckets: **Current** (due date in the future or today) · **1–30 days** · **31–60 days** · **61–90 days** · **90+ days**

**Chart:** Stacked bar chart by bucket with total outstanding annotated. Optionally a horizontal bar per customer sorted by largest exposure.

**Table columns:** Customer · Invoice # · Issue Date · Due Date · Days Overdue · Amount · Bucket (badge)

**Color coding:** Current = slate · 1–30 = amber · 31–60 = orange · 61–90 = red · 90+ = deep red

---

### 2e. Tax Summary — `GET /reports/tax-summary`

All invoices with non-zero tax in the period. Designed for VAT filing and accountant handoff.

Query params: `period`, `year`, `month`, `from`, `to`

Example response:

```json
{
  "period": { "type": "monthly", "year": 2026, "month": 7 },
  "totalTaxCollected": "2121.60",
  "currency": "NIS",
  "invoices": [
    {
      "invoiceNumber": "INV-0007",
      "customerName": "Acme Corp",
      "issueDate": "2026-07-01",
      "status": "paid",
      "subtotal": "6000.00",
      "taxRate": "17.00",
      "taxAmount": "1020.00",
      "total": "7020.00",
      "currency": "NIS"
    }
  ],
  "byTaxRate": [
    { "taxRate": "17.00", "count": 3, "subtotalSum": "18000.00", "taxSum": "3060.00" }
  ]
}
```

**Chart:** Bar chart of tax collected per month (12-month trend). Pie chart showing tax split by tax rate if multiple rates exist.

**Table columns:** Invoice # · Customer · Issue Date · Status · Subtotal · Tax Rate · Tax Amount · Total

**Summary row** at the bottom of the table: total tax collected for the period.

**Printable layout:** The table view has a print-optimised CSS class so `window.print()` renders it cleanly without sidebars or buttons.

---

### 2f. Expense Analysis — `GET /reports/expense-analysis`

Deep breakdown of expenses by category, vendor, and customer.

Query params: `period`, `year`, `month`, `from`, `to`

Example response:

```json
{
  "period": { "type": "monthly", "year": 2026, "month": 7 },
  "totalExpenses": "3200.00",
  "currency": "NIS",
  "byCategory": [
    { "category": "software", "total": "500.00", "pct": "15.63", "count": 2 },
    { "category": "subcontractor", "total": "2200.00", "pct": "68.75", "count": 1 }
  ],
  "byCustomer": [
    { "customerId": "uuid", "customerName": "Acme Corp", "total": "1800.00", "pct": "56.25" }
  ],
  "byVendor": [
    { "vendor": "AWS", "total": "500.00", "category": "hosting", "count": 1 }
  ],
  "trend": [
    { "label": "Aug '25", "total": "2100.00" },
    { "label": "Sep '25", "total": "2700.00" }
  ]
}
```

**Charts:**
- Pie chart — expense share by category
- Horizontal bar chart — top vendors by amount
- Line chart — expense trend over 12 months

**Table:** Three sub-tables (by category, by customer, by vendor), tab-switchable.

---

### 2g. Customer Profitability — `GET /reports/customer-profitability`

Ranks all customers by net profit margin for the selected period. Combines paid invoice revenue with all active expenses attributable to each customer.

Query params: `period`, `year`, `month`, `from`, `to`

Example response:

```json
{
  "period": { "type": "monthly", "year": 2026, "month": 7 },
  "rows": [
    {
      "customerId": "uuid",
      "customerName": "Acme Corp",
      "revenue": "8400.00",
      "expenses": "1200.00",
      "profit": "7200.00",
      "marginPct": "85.71",
      "invoiceCount": 2,
      "expenseCount": 3,
      "currency": "NIS"
    }
  ]
}
```

Sorted by `marginPct` descending by default. Customers with zero revenue in the period are excluded (same rule as the billing overview).

**Charts:**
- Horizontal bar chart — profit per customer (bars sized by profit amount, colored by margin tier: green ≥ 70 %, amber 40–70 %, red < 40 %)
- Scatter plot — revenue (X) vs profit (Y), bubble size = expense count

**Table columns:** Customer · Revenue · Expenses · Profit · Margin % · Invoices · Expenses (count)

**Margin tiers used for colour coding:**

| Tier | Margin range | Color |
|---|---|---|
| High | ≥ 70 % | Emerald |
| Medium | 40 – 69 % | Amber |
| Low | < 40 % | Rose |

---

### 2h. Revenue Forecast — `GET /reports/forecast`

Projects expected future revenue over the next 6 months based on active contracts and outstanding (sent) invoices.

No period filter — always projects from today forward.

**Forecast logic by contract type:**

| Contract type | Forecast contribution |
|---|---|
| Retainer | `monthly_fee` × months remaining (until `expires_at`) |
| Time & Materials | Not forecasted (variable) — shown as "active engagement" |
| Fixed Price | `total_amount − amount_paid` as remaining expected revenue |

Example response:

```json
{
  "asOf": "2026-07-01",
  "forecastMonths": ["Jul '26", "Aug '26", "Sep '26", "Oct '26", "Nov '26", "Dec '26"],
  "confirmed": [
    {
      "customerId": "uuid",
      "customerName": "Acme Corp",
      "source": "invoice",
      "invoiceNumber": "INV-0012",
      "dueDate": "2026-07-31",
      "amount": "3000.00",
      "currency": "NIS",
      "forecastMonth": "Jul '26"
    }
  ],
  "projected": [
    {
      "customerId": "uuid",
      "customerName": "Beta Ltd",
      "source": "retainer_contract",
      "contractId": "uuid",
      "monthlyAmount": "1500.00",
      "currency": "NIS",
      "forecastMonth": "Aug '26"
    }
  ],
  "summary": [
    { "month": "Jul '26", "confirmed": "3000.00", "projected": "1500.00", "total": "4500.00" }
  ]
}
```

**Confirmed** = sent invoices with a due date in the forecast window.
**Projected** = retainer and fixed-price contract remainders distributed across months.

**Charts:**
- Stacked bar chart — confirmed (indigo) vs projected (violet) per month
- Summary card: total confirmed + total projected + combined 6-month outlook

**Table:** Two sub-tables — Confirmed (from invoices) and Projected (from contracts) — with a combined monthly summary row.

---

### 2i. Project Status Report — `GET /reports/project-status`

Current status of all tasks across all customers (or filtered to one customer). Designed to be sent to a customer as a progress update.

Query params (optional): `customerId`, `status` (filter by task status), `from`, `to` (filter by task start/end date)

Example response:

```json
{
  "asOf": "2026-07-01",
  "summary": {
    "total": 24,
    "todo": 8,
    "in_progress": 11,
    "done": 4,
    "cancelled": 1,
    "avgCompletion": "52.30"
  },
  "byCustomer": [
    {
      "customerId": "uuid",
      "customerName": "Acme Corp",
      "tasks": [
        {
          "id": "uuid",
          "name": "Homepage redesign",
          "status": "in_progress",
          "startDate": "2026-06-01",
          "endDate": "2026-07-31",
          "estimatedHours": 40,
          "percentComplete": 70
        }
      ],
      "avgCompletion": "70.00",
      "contracts": [
        { "type": "time_and_materials", "status": "active", "hourlyRate": "120.00", "currency": "NIS" }
      ]
    }
  ]
}
```

**Charts:**
- Donut chart — task count by status
- Horizontal progress bars — one bar per customer showing `avgCompletion`
- Gantt-style timeline view (optional v2): tasks plotted on a date axis per customer

**Table columns:** Customer · Task · Status · Start · End · Est. Hours · % Complete (progress bar inline)

**"Send to Customer" button:** Sends a styled HTML project-status email (one customer selected) — subject `Project Update — Acme Corp — July 2026`.

---

## 3) Business Rules

### Period filter defaults

- If no period params are supplied to a report that accepts them, default to the current calendar month.
- AR Aging and Forecast do not accept a period filter — they always reflect real-time state.

### Currency handling

- Revenue and expense aggregations group by currency. When a report summary contains multiple currencies, each currency is shown as a separate row in the summary section.
- Charts default to the dominant currency (highest total). A currency selector dropdown is shown if more than one currency exists in the result.

### Rounding

- All amounts are rounded to 2 decimal places before being returned.
- Percentage values are rounded to 2 decimal places.

### AR Aging: overdue calculation

- `daysOverdue = MAX(0, today − dueDate)`.
- An invoice is **Current** if `daysOverdue = 0` (due date is today or in the future).
- Draft and cancelled invoices are excluded from AR aging.

### Customer Statement: entry ordering

- Entries are sorted by `date` ascending so the running balance accumulates forward in time.
- When two entries share the same date, invoices appear before expenses.
- The opening balance is always `0.00` for a fresh date range (no carry-forward in v1).

### Revenue Forecast: contract contribution

- Only contracts with `status = 'active'` contribute to the forecast.
- Retainer contracts with no `expires_at` are projected for the full 6-month window.
- T&M contracts are flagged as active engagements but are not assigned a monetary forecast value.
- Fixed-price contracts contribute `total_amount − amount_paid` distributed evenly across the remaining months if `expires_at` is known, or placed in the first forecast month if not.

### Customer Profitability: inclusion

- Only customers with ≥ 1 paid invoice in the period appear.
- `marginPct = (profit / revenue) × 100`. If revenue is zero, the row is excluded.

### Tax Summary: inclusion

- Only invoices with `tax_rate > 0` and `tax_amount > 0` appear in the detail rows.
- All invoice statuses are included (draft, sent, paid, cancelled) so the accountant can see the full picture. Status is shown in the table for context.

---

## 4) FE Behavior

### 4a. Sidebar and navigation

- New sidebar entry: **Reports** with a chart-bar icon.
- The Reports page opens on a report selector — a vertical list on the left (or a top row of cards on mobile) showing all 9 reports grouped by audience.
- Selecting a report replaces the right-hand content panel with the report controls, chart, and table.
- The URL should reflect the active report: `/reports/pl`, `/reports/ar-aging`, etc. (deferred to v2 if routing is not already in place; acceptable to use in-component state for v1).

### 4b. Report controls (per report)

Each report shows controls at the top of the panel:

| Control | Reports |
|---|---|
| Period selector (Monthly / Yearly / Range) | P&L, Revenue Breakdown, Customer Statement, Tax Summary, Expense Analysis, Customer Profitability |
| Customer picker (dropdown) | Customer Statement, Project Status (optional filter) |
| Date range pickers (`from` / `to`) | Range mode and Customer Statement |
| No filter | AR Aging, Revenue Forecast |

### 4c. Chart / Table toggle

Each report panel has a tab bar immediately below the controls:

- **Chart** tab — renders the report-specific chart(s) described in section 2
- **Table** tab — renders the structured data table

Default tab is **Chart** for all reports. The user's tab choice is remembered per-report in component state (not persisted across sessions).

### 4d. Export

Every report has an **Export CSV** button in the top-right of the panel. Clicking it:
1. Converts the current table data to CSV in the browser (no server round-trip).
2. Downloads as `report-name-YYYY-MM-DD.csv`.

### 4e. Print

Tax Summary and Customer Statement have a **Print** button that calls `window.print()`. A `@media print` stylesheet hides the sidebar, controls, and buttons, leaving only the report content.

### 4f. Send to Customer (Customer Statement + Project Status)

A **Send to Customer** button appears on Customer Statement and Project Status Report when a single customer is selected. Behaviour mirrors the Invoice overview email button:
1. Builds a styled HTML version of the report (inline styles only).
2. Copies it to the clipboard as `text/html`.
3. Opens Gmail compose with `to` = customer's primary contact email and `su` = the report title.
4. Button label changes to **Paste in Gmail (⌘V)** for 4 seconds.

### 4g. Loading and error states

- Each report shows a skeleton (pulse placeholder) while data is loading.
- Error state shows an inline rose banner with a **Retry** button.
- Empty state (no data for the selected period) shows a neutral illustration and a message describing why (e.g. "No paid invoices in this period" for P&L).

### 4h. Chart specifications

| Report | Primary chart type | Secondary chart |
|---|---|---|
| P&L Statement | ComposedChart (Revenue + Expenses bars, Profit line) | Profit Margin % line on right Y-axis |
| Revenue Breakdown | Stacked bar (revenue vs expenses per customer) | Pie — expenses by category |
| Customer Statement | Area chart — running balance over time | None |
| AR Aging | Stacked bar by aging bucket | Horizontal bar per customer |
| Tax Summary | Bar — tax collected per month (12-month trend) | Pie by tax rate |
| Expense Analysis | Pie — by category | Bar — top vendors · Line — monthly trend |
| Customer Profitability | Horizontal bar — profit per customer | Scatter — revenue vs profit |
| Revenue Forecast | Stacked bar — confirmed vs projected | Summary stat cards |
| Project Status | Donut — task status counts | Horizontal progress bars per customer |

All charts use recharts. Color palette is consistent with the Billing module (`CHART_COLORS` array). Every chart has a custom tooltip.

### 4i. Report selector UI

The left-side report selector groups reports by audience with section headers:

```
─ Customer-facing ─────────────
  Customer Statement
  Project Status

─ Accountant / Tax ────────────
  P&L Statement
  Tax Summary
  AR Aging

─ Business Intelligence ───────
  Revenue & Expense Breakdown
  Customer Profitability
  Revenue Forecast
  Expense Analysis
```

Active report is highlighted with the indigo active style used in the main sidebar.

---

## 5) Acceptance Criteria

### API

- [ ] `GET /reports/pl` returns `summary`, `rows`, and `trend` for the selected period.
- [ ] `GET /reports/revenue-breakdown` returns `byCustomer` and `expensesByCategory`.
- [ ] `GET /reports/customer-statement/:id` returns chronological `entries` with a `runningBalance` on each.
- [ ] `GET /reports/ar-aging` returns buckets and an `invoices` array. Draft and cancelled invoices are excluded.
- [ ] `GET /reports/tax-summary` returns only invoices with `tax_amount > 0`.
- [ ] `GET /reports/expense-analysis` returns `byCategory`, `byCustomer`, `byVendor`, and a `trend`.
- [ ] `GET /reports/customer-profitability` returns only customers with ≥ 1 paid invoice and excludes zero-revenue customers.
- [ ] `GET /reports/forecast` returns `confirmed` (from sent invoices), `projected` (from active contracts), and a monthly `summary`.
- [ ] `GET /reports/project-status` returns a per-customer task breakdown and a global `summary`.
- [ ] All monetary values are returned as strings.
- [ ] Percentage values are returned as strings to 2 decimal places.
- [ ] All endpoints return `400` for invalid period params.

### Business behavior

- [ ] AR Aging `daysOverdue` is computed from today's date, not a fixed test date.
- [ ] Customer Statement running balance is monotonically updated per entry in date order.
- [ ] Revenue Forecast excludes T&M contracts from monetary projections.
- [ ] Customer Profitability excludes customers with zero paid-invoice revenue in the period.
- [ ] Tax Summary includes all invoice statuses; status is surfaced in the response.
- [ ] Retainer contracts with no `expires_at` are projected across the full 6-month window.

### Frontend

- [ ] The sidebar contains a **Reports** navigation item.
- [ ] Clicking Reports opens a report-selector panel with grouped sections.
- [ ] Each report has a Chart tab (default) and a Table tab.
- [ ] All charts render with correct data, custom tooltips, and the project colour palette.
- [ ] Period controls update the report when changed without a full page reload.
- [ ] **Export CSV** downloads a correctly formatted file with today's date in the filename.
- [ ] **Print** on Tax Summary and Customer Statement hides non-report UI elements.
- [ ] **Send to Customer** copies HTML to clipboard and opens Gmail compose with correct `to` and `su`.
- [ ] Loading skeletons appear while data is fetching.
- [ ] Empty state is shown with a descriptive message when no data matches the filter.
- [ ] AR Aging rows are color-coded by bucket.
- [ ] Customer Profitability rows are color-coded by margin tier (green / amber / rose).
- [ ] Revenue Forecast distinguishes confirmed (solid) vs projected (lighter/hatched) visually.
- [ ] Project Status inline progress bars reflect `percentComplete` accurately.

---
