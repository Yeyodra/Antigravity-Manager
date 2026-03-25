# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-25
**Commit:** c265eff
**Branch:** main (v4.1.30)

## OVERVIEW
Antigravity Tools — Tauri v2 desktop app that acts as a local AI API gateway. React 19 frontend for management UI + Rust/Axum backend that proxies OpenAI/Claude/Gemini protocols to Google's internal APIs with multi-account rotation, quota protection, and protocol translation.

## STRUCTURE
```
./
├── src/                  # React 19 frontend (Vite + Tailwind + Zustand)
├── src-tauri/            # Tauri v2 shell + Rust backend
│   ├── src/
│   │   ├── commands/     # Tauri IPC bridge (frontend↔backend)
│   │   ├── models/       # Data types shared across modules
│   │   ├── modules/      # Core business logic (accounts, OAuth, scheduler)
│   │   ├── proxy/        # Axum HTTP server — the "engine" (handlers, mappers, middleware)
│   │   └── utils/        # Platform-specific helpers (Windows/macOS/Linux)
│   └── resources/        # Static assets bundled into binary
├── docker/               # Headless Docker deployment (no GUI)
├── deploy/               # Arch Linux installer scripts
├── Casks/                # Homebrew Cask for macOS/Linux
├── scripts/              # DMG packaging, macOS fix scripts
├── web_site/             # GitHub Pages static site
└── docs/                 # Documentation and test plans
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new AI protocol | `src-tauri/src/proxy/handlers/` + `mappers/` | Create handler + mapper pair |
| Add Tauri command | `src-tauri/src/commands/` + register in `lib.rs` `generate_handler!` | Also map in `src/utils/request.ts` for web mode |
| Add frontend page | `src/pages/` + add route in `App.tsx` | Add nav item in `src/components/navbar/` |
| Add translation | `src/locales/*.json` (12 languages) | Keys must exist in ALL language files |
| Modify account logic | `src-tauri/src/modules/account.rs` | Uses atomic file writes (temp → rename) |
| Modify proxy routing | `src-tauri/src/proxy/token_manager.rs` | P2C algorithm, health scoring, sticky sessions |
| Modify model mapping | `src-tauri/src/proxy/common/model_mapping.rs` | Supports wildcard (*) patterns |
| Add Docker env var | `docker/Dockerfile` + `src-tauri/src/proxy/server.rs` | Prefix with `ABV_` |

## KEY DATA FLOWS
```
Client Request → Axum (port 8045)
  → Middleware (IP filter → Auth → Monitor)
  → Handler (openai.rs / claude.rs / gemini.rs)
    → TokenManager selects account (P2C + sticky session)
    → Mapper converts protocol → Google v1internal format
    → UpstreamClient (rquest with JA3 Chrome fingerprint)
  → Response mapped back → SSE stream or JSON → Client
```

## CONVENTIONS
- **No linter configs**: No .eslintrc, .prettierrc, rustfmt.toml — relies on defaults
- **Dual-mode frontend**: Same React code runs in Tauri (invoke) AND browser (HTTP fetch) — see `src/utils/request.ts`
- **Headless mode**: `--headless` flag bypasses Tauri UI, runs Axum server only (Docker)
- **i18n**: 12+ languages mandatory — never add user-facing strings without translation keys
- **State persistence**: Zustand stores for UI state; Rust saves config to `gui_config.json` and accounts to individual `[uuid].json` files
- **Atomic file writes**: Account files use temp-file + rename pattern to prevent corruption

## ANTI-PATTERNS (THIS PROJECT)
- `src-tauri/src/main.rs:1` — `DO NOT REMOVE!!` the `#![cfg_attr(windows)]` attribute — it prevents console window on Windows
- `src/components/settings/ProxyPoolSettings.tsx:65` — `DO NOT trigger heavy onChange which saves to disk`
- `src-tauri/src/proxy/middleware/monitor.rs:53` — `IMPORTANT: Extract from Request headers, not Response headers`
- **DEPRECATED modules**: `proxy/mappers/model_limits.rs` (→ use `model_specs`), `proxy/mappers/signature_store.rs` (→ use `SignatureCache`)
- **Unsafe blocks**: `lib.rs:79` (macOS file descriptor limit), `modules/account.rs:628` (Win32 `MoveFileExW`) — both intentional, do not remove
- **TypeScript `as any`**: Exists in `request.ts` (Tauri internals check), `ApiProxy.tsx` (config updates), `Settings.tsx` (@ts-ignore) — minimize but some are unavoidable

## GOD FILES (COMPLEXITY HOTSPOTS)
| File | Lines | Risk |
|------|-------|------|
| `proxy/server.rs` | 3497 | Mixes routing + state + admin APIs |
| `proxy/token_manager.rs` | 3473 | Scheduling + health + rate limiting |
| `proxy/mappers/claude/request.rs` | 3043 | Deep JSON transform nesting |
| `pages/ApiProxy.tsx` | 2826 | Largest frontend component |
| `proxy/handlers/openai.rs` | 2447 | Retry loops + streaming |

## COMMANDS
```bash
npm run dev              # Vite dev server (frontend only, port 1420)
npm run tauri dev        # Full desktop app (compiles Rust on first run)
npm run build            # TypeScript check + Vite production build
npm run tauri build      # Build distributable (MSI/DMG/AppImage)
cargo test               # Run Rust tests (proxy logic, security, quota)
# No frontend test framework configured
```

## NOTES
- **First `tauri dev` takes 5-10 min** (Rust compilation). Subsequent runs are fast.
- **Port 8045** is the proxy server port. Vite dev is on 1420 with proxy to 8045 for `/api/`.
- **`rquest` vs `reqwest`**: Project uses BOTH — `rquest` for JA3 fingerprinted requests, `reqwest` for standard HTTP.
- **Window starts hidden**: `visible: false` in tauri.conf.json, frontend calls `show_main_window` after load to avoid black flash.
- **Platform code**: Extensive `#[cfg(target_os)]` in `modules/process.rs`, `modules/version.rs`, `utils/command.rs`.
- **CI**: GitHub Actions runs `cargo fmt`, `clippy`, and cross-platform Tauri builds on every PR.
- **Release**: Tag `v*` triggers multi-platform builds + Docker push + auto-updater JSON generation.
