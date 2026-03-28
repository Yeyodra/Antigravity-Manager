# proxy/ — Axum Proxy Server (The Engine)

## OVERVIEW
Self-contained Axum HTTP server (port 8046) that translates OpenAI/Claude/Gemini API protocols to Google's internal `v1internal` API format with multi-account rotation, quota protection, and context compression.

## STRUCTURE
```
proxy/
├── server.rs              # Axum server lifecycle, route registration, AppState (3.5k lines — god file)
├── token_manager.rs       # Account selection: P2C algorithm, sticky sessions, health scoring (3.5k lines)
├── config.rs              # ProxyConfig serialization/deserialization
├── rate_limit.rs          # Per-account per-model rate limit tracking
├── signature_cache.rs     # Session-scoped thinking signature cache (3-layer: tool → family → session)
├── context_manager.rs     # 3-layer progressive context compression (L1: tool trim, L2: thinking compress, L3: XML summary)
├── estimation_calibrator.rs # Dynamic token count calibration (EMA-based)
├── cli_sync.rs            # Claude/Gemini/Codex CLI config synchronization
├── opencode_sync.rs       # OpenCode CLI config generation
├── handlers/
│   ├── openai.rs          # /v1/chat/completions, /v1/responses, /v1/images/*
│   ├── claude.rs          # /v1/messages (Anthropic protocol)
│   ├── gemini.rs          # /v1beta/models (Google native)
│   └── common.rs          # Shared retry/backoff logic
├── mappers/
│   ├── claude/
│   │   ├── request.rs     # Claude→Gemini request transform (3k lines — deep nesting)
│   │   ├── streaming.rs   # Claude SSE stream conversion
│   │   └── thinking_recovery.rs  # Fix broken thinking blocks in history
│   ├── openai/
│   │   ├── request.rs     # OpenAI→Gemini request transform
│   │   └── streaming.rs   # OpenAI SSE stream conversion
│   ├── gemini/
│   │   └── wrapper.rs     # Gemini native request wrapping
│   ├── common_utils.rs    # Shared transform helpers
│   ├── model_mapping.rs   # Wildcard model ID routing
│   └── model_specs.rs     # Dynamic model specs (max tokens, capabilities)
├── common/
│   ├── json_schema.rs     # Recursive JSON Schema cleaning for Gemini (whitelist filter, 1.6k lines)
│   ├── client_adapters/   # Per-client compatibility patches (OpenCode, etc.)
│   └── tool_adapters/     # Per-tool schema cleaners (Pencil, etc.)
├── middleware/
│   ├── auth.rs            # API key + UserToken authentication
│   ├── ip_filter.rs       # IP blacklist/whitelist with CIDR support
│   ├── monitor.rs         # Request logging to SQLite
│   └── cors.rs            # CORS headers
├── providers/             # External AI provider fallback config
├── upstream/              # UpstreamClient with rquest (JA3 fingerprint)
├── audio/                 # Audio transcription handler
└── tests/                 # Rust integration tests (quota, retry, security)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new protocol | `handlers/` + `mappers/` | Create handler, mapper pair. Register route in `server.rs` |
| Fix 400/429 errors | `mappers/*/request.rs` | Usually protocol mismatch or missing field |
| Fix thinking/signature | `signature_cache.rs` + `mappers/claude/thinking_recovery.rs` | 3-layer cache: Session → Tool → Global |
| Modify account selection | `token_manager.rs` `get_token()` | P2C + tier sort + health score |
| Clean JSON schemas | `common/json_schema.rs` | Whitelist-based: only Gemini-safe fields survive |
| Add model specs | `mappers/model_specs.rs` (or `model_specs.json`) | Dynamic > static > global fallback |
| Add middleware | `middleware/` | Register in `server.rs` router build |

## CRITICAL PATTERNS
- **Endpoint fallback**: Requests try `Sandbox → Daily → Prod` on 429/5xx errors
- **Account rotation**: On 429/401/403 → retry with next account, bypassing 60s sticky lock
- **Context compression**: Auto-triggers at 60%/75%/90% context pressure (L1→L2→L3)
- **Thinking signatures**: MUST preserve `thoughtSignature` across turns. Cache invalidates on message rewind. Sentinel value `skip_thought_signature_validator` used for first calls.
- **JSON Schema cleaning**: Gemini rejects `propertyNames`, `const`, `anyOf`, `oneOf`, `if/then/else`, `pattern` (as validator), `format`, `minLength`, `maxLength`. These get stripped or migrated to `description`.
- **Auto-stream conversion**: Non-streaming requests internally converted to streaming → aggregated → returned as JSON. Reduces 429 rate.

## ANTI-PATTERNS
- Never set `maxOutputTokens` above model limit — use `model_specs.rs` 3-layer lookup
- Never inject `thinkingLevel` for Gemini models — only `thinkingBudget` (v1internal constraint)
- Never mix `googleSearch` + `functionDeclarations` on Gemini 1.5 (ok on 2.0+/3.0)
- `model_limits.rs` is DEPRECATED → use `model_specs`
- `signature_store.rs` is DEPRECATED → use `SignatureCache`
