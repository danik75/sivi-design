# Customer Form Redesign — Sections & Inline Contacts — PRD

Status: Draft
Owner: Daniel Pritsker
Created: 2026-07-11

## Overview

Restructure the create/edit **customer** form into clear sections — **Customer**,
**Company**, **Contacts** — and replace the contacts sub-grid + contact modal with
an **inline, cascade-add** contacts list. Add a customer **title**, a full
optional **Company** block, and give contacts **Name / Title / Phone / Email**
with a single **starred primary** contact.

## Current state (grounding)

- `customers`: `name` (required, unique), `company_name`, `company_number`,
  `address`. Edited in `CustomerModal` (name + company name/number + address +
  a **contacts table** with a separate `ContactModal` for add/edit).
- `contacts`: `first_name`, `last_name`, `email`, `phone`, `address`,
  `is_primary`. `@ArrayMinSize(1)` already requires ≥1 contact; the FE normalises
  to exactly one primary.

## Goals

1. **Customer section**: `Name` (existing, required) + **`Title`** (new, optional).
2. **Company section** (fully optional): **Name, Company Number, Telephone,
   Address, Email**.
3. **Contacts** flattened — no inner grid / contact modal; **cascade-add** inline
   contact rows.
4. **Contact fields**: **Name, Title, Phone, Email**, plus a **star = primary**.
5. A customer **must have ≥1 contact**; the **first is primary by default**; the
   **primary is unique** (starring one un-stars the others).

## Non-goals

- No change to the customer list/grid columns beyond what already shows.
- Keep the existing `contacts.first_name/last_name` columns for backward
  compatibility (legacy rows), but the new form uses a single `name`.
- No per-contact address in the new form (company address covers it).

## Data model

### `customers` (add three columns)

```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS title         TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_email TEXT;
```

`company_name`, `company_number`, `address` already exist and become the
**Company** section's Name / Company Number / Address.

### `contacts` (add two columns)

```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name  TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS title TEXT;
```

New contacts write `name`/`title`. Reads return a display **`name`** that falls
back to the legacy `first_name`/`last_name` when `name` is null:
`COALESCE(NULLIF(trim(name),''), NULLIF(trim(concat_ws(' ', first_name, last_name)),''))`.

All new columns are nullable; idempotent entries added to `be/src/migrations.ts`.

## API

- `CreateContactDto` gains `name?`, `title?` (both `@IsOptional @IsString`);
  keeps `email` (`@IsEmail`), `phone`, `isPrimary`. `first_name/last_name` stay
  optional for compatibility but the new client sends `name`.
- `CreateCustomerDto` gains `title?` (`@IsOptional @IsString @MaxLength(120)`),
  `companyPhone?` (`@IsString`), `companyEmail?` (`@IsOptional @IsEmail`).
- Repository: select/insert/update the new customer columns; contact insert uses
  `name`/`title`; contact read returns the coalesced `name` + `title`. Customer
  search also matches `contacts.name`.
- `@ArrayMinSize(1)` continues to enforce **≥1 contact**.

## Frontend — `CustomerModal`

Widen the dialog and lay it out in three labelled sections:

### Customer
- **Name** (required) · **Title** (optional) — two columns.

### Company (optional)
- **Company Name** · **Company Number** · **Telephone** · **Email** ·
  **Address**. All optional; collapsible/plain section with a muted "optional"
  hint.

### Contacts (cascade-add, inline)
- A stacked list of contact rows; each row: a **star** (primary) toggle,
  **Name**, **Title**, **Phone**, **Email**, and a **remove** (×) button.
- **Add contact** appends a blank row (cascade). Starting state = one row,
  starred.
- Starring a row makes it the sole primary (unique). Removing the primary
  promotes the first remaining row.
- Validation: at least one contact with details; inline error otherwise. The
  `ContactModal` and the contacts table are removed.

`normalizeCustomerPayload` carries `title`, `companyPhone`, `companyEmail`, and
per-contact `name`/`title`; it filters empty contacts and guarantees exactly one
primary.

## Acceptance criteria

- Creating/editing a customer persists **title**, **company** telephone/email
  (plus the existing company name/number/address), and round-trips on reopen.
- Contacts are edited **inline**; **Add contact** adds a row; **×** removes one
  (never below the required minimum handling).
- Exactly **one** contact is starred as primary; starring another moves it;
  removing the primary re-assigns to the first row.
- Saving with **no usable contact** shows the "at least one contact" error and
  the BE rejects it (`ArrayMinSize`).
- Legacy contacts (first/last name, no `name`) still display a name.

## Backlog items

- **BE-1**: migrations + schema (`customers.title/company_phone/company_email`,
  `contacts.name/title`).
- **BE-2**: DTO + repository (new columns, coalesced contact name, search).
- **FE-1**: `constants` — `createEmptyContact` (name/title/phone/email),
  `normalizeCustomerPayload` (title/companyPhone/companyEmail + contact
  name/title), labels.
- **FE-2**: `CustomerModal` — three sections + inline cascade-add contacts;
  remove the contacts table and `ContactModal` usage; widen the dialog.
- **QA**: create/edit round-trip, primary uniqueness, add/remove contacts, ≥1
  contact enforcement, legacy contact display.

## Open questions

1. Keep or drop the legacy `first_name/last_name` columns long-term?
   (Recommendation: keep for now, coalesce on read; drop in a later cleanup.)
2. Should the **Company** section be visually **collapsible** (hidden until
   expanded) since it's fully optional? (Recommendation: show it inline with an
   "optional" hint; collapsible is a nice-to-have.)
