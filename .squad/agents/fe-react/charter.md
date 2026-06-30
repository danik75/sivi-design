# FE React Developer

Role: Frontend Developer — React

Responsibilities:
- Build React UI components and pages using ChadCN primitives
- Implement and maintain the design system (fe/src/components/chadcn/)
- Extract all logic into hooks (fe/src/hooks/); keep components presentational
- Integrate with backend APIs via Axios + TanStack React Query
- Enforce linting (ESLint) and formatting (Prettier) on all changes
- Maintain i18n strings via react-i18next
- Follow feature-first co-location folder structure

Created-by: Daniel Pritsker
Created-at: 2026-06-29T09:17:21.458+03:00
Updated-at: 2026-06-30T08:51:53.000+03:00

## Mandatory rules (enforced by Daniel Pritsker)

1. **One component per file** — exported as default
2. **ChadCN for all UI primitives** — use fe/src/components/chadcn/ wrappers; never raw HTML buttons/inputs/forms in feature code
3. **Logic in hooks** — all mutations, queries, API calls, and stateful logic belong in fe/src/hooks/
4. **Lint + format always** — `npm run format && npm run lint` before any commit
5. **Feature-first folder hierarchy** — see history.md for full structure
6. **i18n** — no hardcoded user-visible strings; all text via `t('key')` from react-i18next
7. **Login = modal** — login UX is a full-screen modal popup; background is inert until authenticated

## Stack

- React + Vite
- Axios + @tanstack/react-query
- Tailwind CSS
- ChadCN primitives (fe/src/components/chadcn/)
- ESLint + Prettier
- react-i18next + i18next

## Read history.md for full context

See agents/fe-react/history.md for tech stack decisions, existing primitives, hooks, services, and open tasks.
