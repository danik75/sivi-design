# Customer Management Enhancements — PRD

Status: Draft
Owner: Daniel Pritsker
Created: 2026-07-05

## Overview

Extend customer records with a few commonly-needed fields and make contacts
first-class (named) entries. Also surface the customer's **company name** on
invoices and in the invoice customer picker.

## Current state (grounding)

- `customers`: `id`, `name`, `company_number` (optional), timestamps.
- `contacts`: `id`, `customer_id`, `email`, `phone`, `address`, `is_primary`,
  `created_at`. Contacts are managed inline in the Customer modal via a small
  grid + a `ContactModal` (email / phone / address).
- BE `create-customer.dto.ts`: `name`, `companyNumber`, `contacts[]`
  (`email`, `phone`, `address`, `isPrimary`); `@ArrayMinSize(1)` on contacts.
- Invoice detail already returns/show `customerCompanyNumber`. The invoice
  customer picker (`InvoiceModal`) lists customers by `name` only.

## Goals

1. **Company name** — optional `customers.company_name` (distinct from the
   existing `company_number`).
2. **Customer address** — optional `customers.address` (free text).
3. **Named contacts** — contacts gain `first_name` / `last_name`, editable in the
   `ContactModal` and shown as a **Name** column in the contacts grid.
4. **Company name on invoices** — when set, the customer's company name appears
   in invoice details, and in the **customer search/picker** on the invoice form.

## Non-goals

- No change to the existing `company_number` behaviour (kept as-is).
- Address stays free text (no structured street/city/zip fields).
- Contact names are optional (a contact is still valid with just email/phone).

## Data model

### `customers` (add two optional columns)

```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
```

### `contacts` (add two optional columns)

```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT;
```

All four are nullable; existing rows keep `NULL`. Add matching idempotent entries
to `be/src/migrations.ts` so hosted DBs get them on boot.

## API

### Customers

- `CreateContactDto` gains `firstName?`, `lastName?` (both `@IsOptional @IsString`).
- `CreateCustomerDto` gains `companyName?` (`@IsOptional @IsString @MaxLength(160)`)
  and `address?` (`@IsOptional @IsString`).
- `CustomerRepository`:
  - `findAll` / `findOne` select `c.company_name AS "companyName"`,
    `c.address AS "address"`, and include `first_name`/`last_name` in the
    `json_build_object` for contacts (as `firstName`/`lastName`).
  - `create` inserts `company_name`, `address`; contact insert adds
    `first_name`, `last_name`.
  - `update` handles `companyName`, `address` (like `companyNumber`); contact
    re-insert includes the names.

### Invoices

- Invoice read queries add `c.company_name AS "customerCompanyName"` (next to the
  existing `customerCompanyNumber`).
- `InvoiceListRow`/detail types gain `customerCompanyName`.

## Frontend

### Customer modal

- New **Company Name** field (optional) beside/after Name.
- New **Address** field (optional, textarea/text) at the customer level.
- Contacts grid: add a **Name** column showing `First Last` (falls back to `—`).
- `ContactModal`: add **First name** / **Last name** inputs (optional).
- `normalizeCustomerPayload` carries `companyName`, `address`, and per-contact
  `firstName`/`lastName`.

### Customer grid

- Optionally show company name under/next to the customer name (nice-to-have;
  the grid already shows `company_number`). Not required.

### Invoices

- **Customer picker** (`InvoiceModal` Dropdown): option label becomes
  `name — companyName` when a company name exists, else just `name`, so users can
  find a customer by company.
- **Invoice details** (`InvoiceOverview`, screen + printable): show the company
  name when present (near the customer name), like the company number.

## DB Migration

`db/schema.sql` updated for a fresh DB, plus `be/src/migrations.ts`:

```ts
{ name: 'customers.company_name', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT` },
{ name: 'customers.address',      sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT` },
{ name: 'contacts.first_name',    sql: `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT` },
{ name: 'contacts.last_name',     sql: `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT` },
```

## Acceptance criteria

- Creating/editing a customer persists **company name** and **address**; both
  optional; reopening shows them.
- A contact can have **first/last name**; the contacts grid shows a **Name**
  column; names round-trip through save.
- The invoice **customer picker** shows the company name alongside the customer
  name when present, and remains selectable/searchable.
- Invoice **details** show the company name when the customer has one.
- Existing customers/contacts (without the new fields) continue to work.

## Backlog items

- **BE-1**: schema + migrations for the four columns.
- **BE-2**: customer DTO + repository (company name, address, contact names).
- **BE-3**: invoice queries/types return `customerCompanyName`.
- **FE-1**: customer modal — company name + address fields.
- **FE-2**: contact modal + contacts grid — first/last name.
- **FE-3**: invoice customer picker label + invoice details company name.
- **QA**: round-trip all fields; verify empty/legacy records.
