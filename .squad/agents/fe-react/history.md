# FE React Developer history

## 2026-06-29: Agent created and added to roster.

## 2026-06-30: Full FE stack decisions established by Daniel Pritsker

### Tech stack

- **Framework**: React (Vite)
- **HTTP client**: Axios (via `fe/src/services/api.js` — a configured axios instance with `import.meta.env.VITE_API_BASE_URL`)
- **Data fetching / caching**: TanStack React Query (`@tanstack/react-query`) — `useMutation` for POST actions like login, `useQuery` for GET requests
- **i18n**: react-i18next + i18next — all user-visible strings must use `t('key')`, never hardcoded
- **Styling**: Tailwind CSS (utility classes). No CSS modules or CSS-in-JS.
- **Component library**: ChadCN-style component primitives (custom wrappers in `fe/src/components/chadcn/`). Every shared UI element (Button, Input, Form, FormField, Modal, etc.) must live there as a separate file and be used across the app.
- **Linting**: ESLint (config at `fe/.eslintrc.cjs`). Run: `npm run lint`
- **Formatting**: Prettier (config at `fe/.prettierrc`). Run: `npm run format`

### Mandatory conventions

1. **One component per file** — each React component in its own `.jsx` file, exported as default.
2. **Extract logic to hooks** — no business logic or API calls inside components. All mutations/queries live in `fe/src/hooks/` (e.g., `useLogin.js`, `useAuth.js`).
3. **ChadCN primitives for all UI** — buttons, inputs, forms, modals must use `fe/src/components/chadcn/` wrappers, never raw HTML elements with ad-hoc classes.
4. **Feature-first co-location** — folder hierarchy:
   ```
   fe/src/
     components/          # shared presentational components
       chadcn/            # ChadCN wrapper primitives (Button, Input, Form, FormField, ...)
     features/            # feature folders (components + hooks + tests colocated)
     hooks/               # shared hooks (useLogin, useAuth, useApi)
     services/            # axios instances, API clients
     i18n/                # i18next init + locales/{en}/translation.json
     pages/               # top-level page components (LoginPage, MainPanel, ...)
     App.jsx / main.jsx   # app bootstrap (providers, routing)
   ```
5. **No unused assets** — remove Vite/React placeholder assets (vite.svg, react.svg, hero.png).
6. **Lint + format before commit** — always run `npm run format && npm run lint` before committing.

### Existing ChadCN primitives (as of 2026-06-30)

- `fe/src/components/chadcn/Button.jsx` — styled button, spread all props, accepts `className` override
- `fe/src/components/chadcn/Input.jsx` — `React.forwardRef` input with focus ring styling
- `fe/src/components/chadcn/Form.jsx` — `<form>` wrapper with `space-y-4` spacing
- `fe/src/components/chadcn/FormField.jsx` — label + children + optional hint wrapper

### Existing hooks (as of 2026-06-30)

- `fe/src/hooks/useLogin.js` — `useMutation` calling `loginApi` from `fe/src/services/api.js`. On success stores JWT in `localStorage` under key `sivi_token`.

### Existing services (as of 2026-06-30)

- `fe/src/services/api.js` — axios instance with `baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'`. Exports `loginApi(credentials)` helper.

### Login modal UX (decision 2026-06-30)

- App opens with a `LoginModal` (full-screen backdrop, `role="dialog"`, `aria-modal="true"`) that blocks all background interaction.
- On successful login: modal closes, `MainPanel` renders.
- On token already in `localStorage` on load: skip modal, go straight to `MainPanel`.
- `App.jsx` manages `isAuthenticated` state and `showLogin` flag.
- Components involved: `fe/src/components/LoginModal.jsx`, `fe/src/components/LoginForm.jsx`, `fe/src/pages/MainPanel.jsx`, `fe/src/pages/LoginPage.jsx`.

### Backend integration

- Auth endpoint: `POST http://localhost:3000/login` body `{ username, password }` → returns `{ access_token: "<JWT>" }`
- Dev credentials: username `cv`, password `cv` (cleartext dev seed only)
- JWT stored in `localStorage` key `sivi_token`
- Postgres DB: `sivi_db`, user `sivi_user`, password `sivi_pass`, container `sivi_design_db_container`
- Backend env loaded from `be/.env` (not committed)

### Open tasks (as of 2026-06-30)

- [ ] Add focus trap (ESC-to-close, tab cycle) inside `LoginModal`
- [ ] Add unit tests for ChadCN primitives and `LoginForm`
- [ ] Wire i18next — wrap App with `I18nextProvider`, replace hardcoded strings with `t('key')`
- [ ] Add pre-commit hooks (husky + lint-staged) to enforce lint/format
- [ ] Extend ChadCN primitives: Card, Toast, Modal base, Badge
- [ ] Remove unused placeholder assets (react.svg, hero.png)
