# Business Proposals Feature — PRD

Owner: pm (Product Manager)
Date: 2026-07-02

---

## Overview

Add a new **Business Proposals** item to the main sidebar. The screen will present a grid of generated proposals, with customer context, generation status, and quick access to proposal content.

Proposal creation is assistant-driven:

1. User starts a new proposal and enters the business requirement.
2. Chatbot asks follow-up questions:
   - pricing model / contract model
   - estimated implementation hours
   - target hourly rate
   - payment distribution terms
   - required proposal language
3. Chatbot submits all captured data as an **asynchronous** request.
4. Backend starts an **agentic generation flow** that enriches context from internal data (previous contracts, tasks, billing).
5. A business proposal agent generates the proposal in English.
6. System translates the proposal to Hebrew.
7. Both versions are saved as styled HTML in the database.

Users can open a proposal from the grid and view both English and Hebrew versions.

---

## 1) Scope (v1)

### In scope

- Sidebar navigation item: **Business Proposals**
- Proposals grid (filterable by customer)
- New proposal creation via chatbot intake
- Async orchestration for generation
- Context enrichment from historical system data
- Proposal generation in English
- Hebrew translation
- Persisting both HTML versions
- Read/view proposal details from grid

### Out of scope

- Manual WYSIWYG editing of generated proposal HTML
- Multi-language expansion beyond English + Hebrew
- Approval workflows / versioning / e-signature
- Billing or invoicing automation from proposals

---

## 2) Terminology

### Pricing model options (professional terms)

| Enum value | UI label | Meaning |
|---|---|---|
| `fixed_fee` | Fixed Fee | One total project price |
| `time_and_materials` | Time & Materials | Billing per hour worked |
| `capped_hours_bundle` | Capped Hours Bundle | Pre-purchased block of hours and total amount |
| `monthly_retainer` | Monthly Retainer | Monthly fee for fixed hours per month |

---

## 3) Data Model

### 3.1 Business proposals table

```sql
CREATE TYPE proposal_status AS ENUM (
  'queued',
  'in_progress',
  'completed',
  'failed'
);

CREATE TYPE proposal_language AS ENUM ('en', 'he');

CREATE TYPE pricing_model AS ENUM (
  'fixed_fee',
  'time_and_materials',
  'capped_hours_bundle',
  'monthly_retainer'
);

CREATE TABLE IF NOT EXISTS business_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  business_requirement text NOT NULL,
  pricing_model pricing_model NOT NULL,
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
```

### 3.2 Field rules

| Field | Required | Notes |
|---|---|---|
| `customer_id` | Yes | Proposal belongs to one customer |
| `business_requirement` | Yes | Free text entered by user |
| `pricing_model` | Yes | One of the 4 professional pricing models |
| `estimated_hours` | Conditional | Required for hourly/hour-bundle/retainer scenarios |
| `hourly_rate` | Conditional | Required for hourly and retainer scenarios |
| `payment_distribution` | Yes | Structured free text until v2 schema formalization |
| `requested_language` | Yes | Language requested in chatbot flow |
| `status` | System | Async lifecycle state |
| `english_html` | System | Generated styled HTML |
| `hebrew_html` | System | Generated styled HTML translation |

---

## 4) API Design

Base path: `/business-proposals`

| Method | Path | Description |
|---|---|---|
| GET | `/business-proposals` | List proposals (filterable) |
| GET | `/business-proposals/:id` | Get full proposal details + HTML content |
| POST | `/business-proposals` | Create proposal request (chatbot payload) and enqueue async generation |

### 4.1 `POST /business-proposals`

#### Request (from chatbot final payload)

```json
{
  "customerId": "uuid",
  "businessRequirement": "Build customer self-service portal with SLA tracking...",
  "pricingModel": "time_and_materials",
  "estimatedHours": "220",
  "hourlyRate": "350",
  "currency": "NIS",
  "paymentDistribution": "30% upfront, 40% at milestone 2, 30% on delivery",
  "requestedLanguage": "en"
}
```

#### Response

- `202 Accepted` (async started)

```json
{
  "id": "uuid",
  "status": "queued",
  "createdAt": "2026-07-02T09:25:38.334Z"
}
```

### 4.2 `GET /business-proposals`

Query params:

| Param | Type | Notes |
|---|---|---|
| `customerId` | uuid | Optional customer filter |
| `status` | queued\|in_progress\|completed\|failed\|all | Default `all` |

Grid response includes:

- `id`
- `customerId`
- `customerName`
- `pricingModel`
- `status`
- `createdAt`
- `completedAt`

### 4.3 `GET /business-proposals/:id`

Returns all metadata + generated content:

```json
{
  "id": "uuid",
  "customerId": "uuid",
  "customerName": "Acme Corp",
  "businessRequirement": "...",
  "pricingModel": "time_and_materials",
  "estimatedHours": "220.00",
  "hourlyRate": "350.00",
  "currency": "NIS",
  "paymentDistribution": "30/40/30 milestones",
  "requestedLanguage": "en",
  "status": "completed",
  "englishHtml": "<html>...</html>",
  "hebrewHtml": "<html dir='rtl' lang='he'>...</html>",
  "createdAt": "2026-07-02T09:25:38.334Z",
  "completedAt": "2026-07-02T09:26:12.102Z"
}
```

---

## 5) Chatbot Intake UX

### 5.1 Interaction sequence

1. User selects customer.
2. User enters business requirement.
3. Chatbot asks follow-up questions:
   - What pricing model should this proposal use?
   - How many hours are estimated?
   - What hourly rate should be used?
   - How should payments be distributed?
   - Which language is required for the proposal output?
4. Chatbot validates required fields and confirms summary.
5. Chatbot submits async request and informs user proposal is generating.

### 5.2 Validation

- `businessRequirement`: required, min length threshold
- `pricingModel`: required enum
- numeric values (`estimatedHours`, `hourlyRate`): positive
- `paymentDistribution`: required
- `requestedLanguage`: required (`en` / `he`)

---

## 6) Backend Agentic Flow

### 6.1 Orchestration steps

1. API persists proposal row as `queued`.
2. Background worker picks job and marks `in_progress`.
3. Orchestrator fetches historical context:
   - previous contracts for customer
   - customer tasks/work history
   - billing and profitability indicators
4. Compose generation prompt with:
   - chatbot intake payload
   - internal historical context
   - formatting/output constraints (HTML, business tone, sections)
5. Business proposal agent generates English proposal HTML.
6. Translation step generates Hebrew HTML (RTL-compatible).
7. Persist both HTML versions and set status `completed`.
8. On failure, set status `failed` and store diagnostic message.

### 6.2 Non-functional requirements

- Async processing must not block request thread.
- Job retries with capped attempts.
- Idempotent processing by proposal `id`.
- Trace logs for each stage.
- Timeouts per model/tool step.

---

## 7) Frontend Behavior

### 7.1 Sidebar

- Add **Business Proposals** item in main sidebar.

### 7.2 Grid view

Columns:

- Customer
- Pricing Model
- Status
- Created At
- Completed At
- Actions (`View`)

Filters:

- Customer
- Status (`All`, `Queued`, `In Progress`, `Completed`, `Failed`)

### 7.3 Detail view

From grid row click / View action:

- Show proposal metadata
- Show two tabs/panels:
  - English proposal (render saved HTML)
  - Hebrew proposal (render saved HTML, RTL layout)

If generation is still running:

- show progress state / polling refresh.

If failed:

- show failure state with retry action (v1 optional).

---

## 8) Security and Content Safety

- Sanitize generated HTML before rendering in FE.
- Store raw generated HTML as output artifact; render via controlled component.
- Prevent script/style injection vectors in display layer.
- Log model inputs/outputs in auditable, access-controlled traces (redact sensitive tokens).

---

## 9) Acceptance Criteria

- [ ] Sidebar includes **Business Proposals**.
- [ ] User can start proposal via chatbot, providing business requirement and follow-up answers.
- [ ] Submission returns `202 Accepted` and proposal enters async queue.
- [ ] Backend flow enriches with contracts/tasks/billing context before generation.
- [ ] Agent generates proposal in English HTML.
- [ ] System generates Hebrew translation HTML.
- [ ] Both English and Hebrew HTML are persisted on same proposal record.
- [ ] Grid lists proposals and supports filtering by customer.
- [ ] User can open a proposal from grid and view both language versions.
- [ ] Failed jobs are visible in grid with failed status.

---

