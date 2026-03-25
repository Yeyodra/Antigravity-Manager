# src/ — React 19 Frontend

## OVERVIEW
Management dashboard and configuration UI. Runs in Tauri (desktop) and browser (Docker/headless) using the same codebase.

## STRUCTURE
```
src/
├── pages/              # Top-level route components (Dashboard, Accounts, ApiProxy, etc.)
├── components/
│   ├── accounts/       # Account table, grid view, OAuth dialog, details
│   ├── common/         # Shared UI (modals, toasts, auth guard, mini view)
│   ├── dashboard/      # Quota monitoring widgets
│   ├── debug/          # Debug console log viewer
│   ├── layout/         # App shell (sidebar, Layout.tsx)
│   ├── navbar/         # Top navigation bar (responsive, language switcher)
│   ├── proxy/          # Proxy monitor, model mapping UI
│   ├── security/       # IP blacklist/whitelist management
│   └── settings/       # Settings panels (general, proxy pool, advanced)
├── stores/             # Zustand global state
├── services/           # Backend API abstraction layer
├── locales/            # i18n JSON files (12+ languages)
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Helpers (request bridge, formatting)
├── config/             # Model config metadata (icons, labels)
└── assets/             # Static images/SVGs
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new page | `pages/` + route in `App.tsx` | Add navbar entry in `components/navbar/` |
| Add Zustand store | `stores/` | Pattern: `create()` with actions, no middleware |
| Call Rust backend | `services/` → uses `utils/request.ts` | Auto-detects Tauri vs HTTP mode |
| Add translation | ALL files in `locales/` | Must add key to every language |
| Add reusable component | `components/common/` | Keep feature-specific in their domain dir |

## CONVENTIONS
- **Environment bridge**: `utils/request.ts` detects `__TAURI_INTERNALS__` → routes to `invoke()` or HTTP `fetch()`. Every Tauri command needs a mapping in `COMMAND_MAPPING` for web mode.
- **State flow**: Service → Store → Component. Backend pushes via Tauri events (`accounts://refreshed`, `tray://account-switched`).
- **Styling**: Tailwind CSS + DaisyUI. Dark theme uses Slate palette (`base-100: #0f172a`). Icons from `lucide-react`.
- **i18n**: `react-i18next`. Arabic triggers RTL layout switch in `App.tsx`. Never hardcode user-facing strings.
- **Large pages**: `ApiProxy.tsx` (2826 lines), `Settings.tsx` (1587 lines), `Accounts.tsx` (1241 lines) — these are orchestrator pages with inline modals.
- **No frontend tests**: No vitest/jest configured. Quality gate is `tsc` + `vite build`.

## ANTI-PATTERNS
- Never use `window.crypto.randomUUID()` directly — fails in HTTP (non-secure) contexts. Use the fallback UUID generator.
- `localStorage` for persistent UI prefs only (e.g., `showAllQuotas`). Sensitive data → Rust backend.
- `AdminAuthGuard` in `App.tsx` enforces auth in web mode — do not bypass.
