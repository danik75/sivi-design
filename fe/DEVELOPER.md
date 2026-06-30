FE Developer Guidelines — sivi-design

Goal
----
Provide guidance for frontend development conventions for this project. Follow these rules for new work and refactors.

Key decisions
-------------
- Data fetching: use Axios as the HTTP client and TanStack React Query for caching, background refresh, and retries.
  - axios: for request/response interceptors (auth header injection), error mapping
  - @tanstack/react-query: for queries/mutations, caching, and devtool support

- Internationalization: use i18next + react-i18next for translations. All user-visible strings must come from translation keys.

- Project structure and components:
  - One component per file. Keep components small and focused (presentational vs container pattern).
  - Suggested directory hierarchy:
    - fe/src/
      - components/        # shared, pure components (Button, Input, Form)
      - features/          # feature folders, each with components, hooks, styles, tests
      - hooks/             # shared React hooks (useAuth, useApi)
      - services/          # axios instances, API clients
      - i18n/              # i18next init and translation resources
      - pages/             # top-level pages (LoginPage, Dashboard)
      - App.jsx / main.jsx # app bootstrap (routing, providers)
  - Each feature should export an index.js that composes the feature's public components.
  - Keep styles colocated (module.css or CSS-in-JS) and import into the component file.

- Assets: Remove example Vite/React placeholder assets (vite.svg, react.svg, hero.png) from the repo. Replace with production assets as needed. Do not keep unused assets.

- Translation and text workflow:
  - Add translation JSON files under fe/src/i18n/locales/{en,fr,...}/translation.json
  - Wrap App with I18nextProvider and use the useTranslation hook in components.
  - Do not hardcode user-visible strings. Use t('key.path') and include fallback entries.

- API / Auth integration:
  - Create a services/api.js that exports a configured axios instance.
  - Use React Query's QueryClientProvider at App root and create hooks in features (e.g., useLogin mutation) that call axios via the service.

- Testing:
  - Write unit tests for components and hooks with Jest + React Testing Library.
  - Integration / E2E tests should run against a running backend (use docker-compose for local dev).

Recommended npm packages (install in fe/):

  npm install axios @tanstack/react-query i18next react-i18next

Example usage sketch
--------------------
// fe/src/services/api.js
import axios from 'axios'

const api = axios.create({ baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3000' })
export default api

// fe/src/hooks/useLogin.js
import { useMutation } from '@tanstack/react-query'
import api from '../services/api'

export const useLogin = () => useMutation((creds) => api.post('/login', creds))

Migration notes
---------------
- Before merging large refactors: run a sweep to remove unused assets and create a migration PR that moves components into feature folders.
- Add codeowners / review process for UI changes.

Conventions summary
-------------------
- One component per file, exported as default.
- Keep presentational components in components/ and feature-specific ones in features/{feature}/
- Use React Query for data fetching, axios for HTTP, and i18next for translations.

If anything is unclear, ask for a brief example PR and the FE maintainer will provide a starter commit.

## Team Decisions (2026-06-30)

The team agreed the FE React agent and developers should follow these decisions for all new and refactor work:

- Enforce linting and formatting on all frontend code: ESLint + Prettier. Run lint and format in pre-commit or CI.
- One component per file: every React component lives in its own file and is exported as default. Keep tests/styles colocated with the component when practical.
- Extract all side-effect and logic into hooks under fe/src/hooks/ (e.g., useLogin, useAuth, useApi). Components should be presentational and delegate to hooks.
- Adopt ChadCN as the component design system for shared UI primitives (buttons, inputs, modals, cards). Create fe/src/components/chadcn/ wrappers that normalize usage.
- Keep files organized with a feature-first hierarchy: features/{feature}/components, hooks, styles, tests; shared primitives in components/ and chadcn/; services (api clients) in services/.
- Modal/login UX: login should be a modal popup that overlays and blocks interaction with the background until successful login.

These decisions are recorded as team directives and should be referenced by FE maintainers and any onboarding documentation.

