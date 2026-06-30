# PRD — Main Panel & Customer Management

**Owner:** Daniel Pritsker  
**Date:** 2026-06-30  
**Status:** Draft  
**Branch:** feature/prd-main-panel

---

## 1. Overview

Extend the post-login main panel to host three core business modules via a sidebar/nav. The first deliverable is the **Customer Management** module — a full CRUD grid for managing customers and their contacts. Task Management and Billing are scoped in this PRD but will be implemented in separate feature branches.

---

## 2. Navigation — Main Panel

After a successful login the user sees the main panel with a left sidebar (or top nav on mobile) listing three modules:

| # | Module | Route | Status |
|---|--------|-------|--------|
| 1 | Customer Management | `/customers` | **In scope** |
| 2 | Task Management | `/tasks` | Placeholder (future) |
| 3 | Billing | `/billing` | Placeholder (future) |

- Active module is highlighted in the sidebar.
- Sidebar is collapsible on smaller viewports.
- User menu (avatar + logout) remains top-right across all modules.

---

## 3. Customer Management — Feature Spec

### 3.1 Customer Data Model

```
Customer {
  id           UUID (generated server-side)
  name         TEXT — unique, non-empty, trimmed
  contacts[]   Contact[]
  createdAt    TIMESTAMP
  updatedAt    TIMESTAMP
}

Contact {
  id        UUID (generated)
  email     TEXT (optional, validated format)
  phone     TEXT (optional)
  address   TEXT (optional)
  isPrimary BOOLEAN (first contact defaults to true)
}
```

**Validation rules:**
- `name` — required, unique across all customers, max 120 chars.
- At least 0 contacts allowed (empty is valid); if a contact is added, at least email OR phone must be provided.
- Email format validated (`RFC 5322` pattern).
- Phone: free-form text (10–20 chars).

### 3.2 Customer List View (`/customers`)

**Grid / table:**
- Columns: Name, Primary Email, Primary Phone, # Contacts, Actions
- Sortable by: Name (default A–Z), Created date
- Search bar (real-time filter by name or contact email/phone)
- Pagination or infinite scroll (default 25 per page)
- Empty state: illustration + "No customers yet — add your first one" CTA

**Actions per row:**
- Edit (pencil icon) → opens Edit Customer modal/drawer
- Delete (trash icon) → confirmation dialog before deletion

**Page-level actions:**
- "+ Add Customer" button → opens Create Customer modal

### 3.3 Create / Edit Customer Modal

A modal (ChadCN-styled, same pattern as LoginModal) with two sections:

**Section 1 — Customer info**
- Name field (required, unique validated on blur/submit)

**Section 2 — Contacts**
- List of contact cards (collapsible)
- "+ Add Contact" button adds an empty contact row
- Each contact has: Email, Phone, Address (all optional, but email/phone required if contact row present)
- Trash icon per contact to remove it
- First contact row is marked "Primary"

**Footer:**
- Cancel | Save buttons
- Save is disabled while name is empty or form is invalid
- On save: show success toast and close modal; on error: show inline error

### 3.4 Delete Customer

- Clicking the trash icon shows a confirmation dialog:  
  `"Delete [Customer Name]? This will remove the customer and all their contacts. This cannot be undone."`
- Confirm → DELETE request → success toast → row removed from grid
- Cancel → no action

### 3.5 Search

- Search input at the top of the grid
- Filters rows in real-time (debounced 300 ms) by: name, email, phone
- Matches are highlighted in the grid rows
- "Clear" × button resets the filter

---

## 4. API Endpoints (BE contract)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/customers` | List all customers (supports `?search=`, `?page=`, `?limit=`) |
| POST | `/customers` | Create a new customer |
| GET | `/customers/:id` | Get a single customer with contacts |
| PUT | `/customers/:id` | Update customer name + contacts |
| DELETE | `/customers/:id` | Delete customer and contacts |

**Request body — POST/PUT `/customers`:**
```json
{
  "name": "Acme Corp",
  "contacts": [
    { "email": "alice@acme.com", "phone": "+1-555-0100", "address": "1 Main St", "isPrimary": true }
  ]
}
```

**Response — GET `/customers`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "contacts": [ { "id": "uuid", "email": "...", "phone": "...", "isPrimary": true } ],
      "createdAt": "2026-06-30T..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 25
}
```

---

## 5. DB Schema (Postgres)

```sql
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_has_info CHECK (email IS NOT NULL OR phone IS NOT NULL OR address IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);
```

---

## 6. FE Architecture

Following `fe/DEVELOPER.md` conventions:

```
fe/src/
  features/
    customers/
      components/
        CustomerGrid.jsx        # data table with search + pagination
        CustomerRow.jsx         # single row with actions
        CustomerModal.jsx       # create/edit modal
        CustomerDeleteDialog.jsx# confirmation dialog
        ContactCard.jsx         # single contact row in the modal
      hooks/
        useCustomers.js         # useQuery: list/search customers
        useCustomer.js          # useQuery: single customer
        useCreateCustomer.js    # useMutation: POST /customers
        useUpdateCustomer.js    # useMutation: PUT /customers/:id
        useDeleteCustomer.js    # useMutation: DELETE /customers/:id
      services/
        customersApi.js         # axios calls
      index.jsx                 # feature entry point
  pages/
    CustomersPage.jsx           # top-level page, mounted at /customers
```

**ChadCN components to use/add:**
- `Table`, `TableRow`, `TableCell` — for the grid
- `Modal` (reuse pattern from LoginModal) — for create/edit
- `Dialog` — for delete confirmation
- `Toast` — for success/error notifications
- `Badge` — for contact count
- `SearchInput` — Input with clear button

---

## 7. Acceptance Criteria

- [ ] Main panel sidebar shows 3 module links; active state visible
- [ ] Clicking "Customer Management" loads `/customers` grid
- [ ] Grid shows all customers with name, primary email, phone, contact count
- [ ] Search filters grid in real-time (debounced), highlights matches
- [ ] "+ Add Customer" opens modal; saving creates customer; success toast shown
- [ ] Name uniqueness validated — duplicate names show inline error
- [ ] Edit opens modal pre-filled; saving updates customer; success toast shown
- [ ] Delete shows confirmation; confirming removes customer from grid
- [ ] Contacts can be added/removed inside the modal; first contact is "Primary"
- [ ] Contact email validated on submit
- [ ] Empty state shown when no customers or search has no results
- [ ] Responsive: grid scrolls horizontally on small screens; modal is full-screen on mobile
- [ ] Lint and format pass; all new components follow ChadCN + hooks conventions

---

## 8. Out of Scope (this PRD)

- Task Management module (separate PRD/branch)
- Billing module (separate PRD/branch)
- Customer import/export (CSV)
- Role-based access control per module
- Customer activity log / audit trail

---

## 9. Implementation Plan

| Step | Owner | Branch |
|------|-------|--------|
| DB migration (customers + contacts tables) | DBA | feature/customers-db |
| BE: NestJS CRUD endpoints + validation | BE (Nest) | feature/customers-be |
| FE: ChadCN Table, Toast, Dialog primitives | FE React | feature/customers-fe |
| FE: CustomerGrid + CustomerModal + hooks | FE React | feature/customers-fe |
| FE: Sidebar navigation in MainPanel | FE React | feature/customers-fe |
| Integration + acceptance tests | Automation QA | feature/customers-qa |

---

## 10. Follow-up questions / decisions needed

- Pagination style: classic pages vs infinite scroll?
- Should contacts support multiple addresses (e.g., billing vs shipping)?
- Should name uniqueness be case-insensitive?
