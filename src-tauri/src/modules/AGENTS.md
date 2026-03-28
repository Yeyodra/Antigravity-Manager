# modules/ — Core Business Logic

## OVERVIEW
Backend modules for account management, OAuth, device fingerprinting, process control, and scheduled tasks. Not part of the proxy server — these are called by Tauri commands and the scheduler.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Account CRUD | `account.rs` (1738 lines) | Atomic write: temp file → `fs::rename` (POSIX) / `MoveFileExW` (Windows) |
| OAuth flow | `oauth.rs` + `oauth_server.rs` | Local HTTP server for callback; supports manual code paste |
| Quota fetching | `quota.rs` | Calls Google's `fetchAvailableModels` with project ID injection |
| Device fingerprint | `device.rs` | Per-account fingerprint binding to reduce ban risk |
| Process management | `process.rs` (1142 lines) | Heavy `#[cfg(target_os)]` — Windows/macOS/Linux each have unique kill logic |
| CLI detection | `version.rs` | Scans PATH + APPDATA + NVM_HOME + .volta/bin for installed CLIs |
| Token stats | `token_stats.rs` | SQLite persistence, local timezone via `'localtime'` |
| Security DB | `security_db.rs` | IP blacklist/whitelist + access logs in SQLite |
| Background tasks | `scheduler.rs` | Periodic quota refresh, auto-warmup (currently disabled) |
| Update checker | `update_checker.rs` | GitHub API → Raw → jsDelivr 3-level fallback |
| Cache cleanup | `cache.rs` | Translation cache, log fingerprints |

## CONVENTIONS
- **Account storage**: Individual JSON files at `~/.antigravity_fork_tools/[uuid].json`. Index in `accounts.json`.
- **Unsafe code**: `account.rs:628` uses `unsafe { MoveFileExW }` for atomic renames on Windows — required, do not replace with safe alternative (it doesn't exist for cross-partition moves).
- **Platform branching**: `process.rs` and `version.rs` use extensive `#[cfg]` blocks. Test on all 3 platforms.
- **Error handling**: Uses `anyhow::Result` throughout. Tauri commands return `Result<T, String>` (Tauri IPC constraint).

## ANTI-PATTERNS
- Never write account files directly — always use `save_account()` which does atomic temp+rename
- Never assume CLI binaries are in PATH — scan known install locations
- Quota refresh must inject `{"project": project_id}` in payload — omitting it returns stale 100% values
