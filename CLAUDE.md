# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FitFunDog (repo name `pawphysio`) is a React + Vite PWA for veterinary physiotherapy practices, backed by Supabase (DB, Auth, Storage, Edge Functions) and deployed to Vercel. It is multi-tenant: the same codebase and deployment serve two practices ("Fit Fun Dog" / FFD and "Animal Balance Center" / ABC), distinguished at runtime by hostname/env var and separated in the database by `practice_id` + Row Level Security.

**Read the `fitfundog` skill before making any change here** (App.jsx edits, Supabase queries/RLS, new patients, user management, deploy, color system, admin area). It contains the authoritative, up-to-date project reference (tenant IDs, schema, RLS policies, known bugs, versioning rules, deploy workflow) that supersedes anything summarized below if they ever diverge.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run lint      # eslint .
npm run preview   # preview a production build locally
```

There is no test suite/runner configured in this repo.

Before checking in a new/edited version of `src/App.jsx`, validate syntax with `@babel/parser` (JSX plugin) — Vite/Rolldown's parser is stricter than Babel's and will fail differently.

## Architecture

### Single-file app

Almost the entire application lives in `src/App.jsx` (3600+ lines). `App()` (defined at the bottom, `export default function App()`) is one large component holding nearly all state (`useState`) for every screen/view. Everything else in the file — helper components (`PatientCard`, `PatientHistory`, `VideoUploadField`, `SearchInput`, `CustomSelect`, `Icon`, `FilterDropdown`, `MultiSelect`, `InfoCard`, `ARow`, `LoginScreen`, `PasswordResetScreen`, etc.) — is declared **outside** `App()` at module scope, because IIFE patterns inside `App()`'s JSX cannot host their own `useState`. Any new stateful sub-component must follow the same pattern and receive `practice` (and whatever else it needs) as props rather than reading module-level color variables implicitly stale.

Navigation is a single `view` state (`"owner" | "profile" | "therapist" | "admin" | "info"`) switched by tab clicks (wrapped in `startTransition`), not a router — there is no client-side routing library.

`src/supabase.js` exports a single shared `supabase` client built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (`.env`, also duplicated as literals in the `fitfundog` skill for reference). `src/main.jsx` mounts `<App/>` into `index.html`.

### Multi-tenancy

- `PRACTICE_SLUG` is derived from `window.location.hostname` (falls back to `VITE_PRACTICE_SLUG` env var, set per Vercel project/preview) — `"animalbalance"` if the hostname contains that string, else `"fitfundog"`.
- Every tenant-scoped table carries a `practice_id` FK to `practice_settings`, and Postgres RLS (not app code) is what actually enforces the tenant boundary. `isAdmin` is derived once at load time by comparing the logged-in user's id to `practice_settings.admin_user_id` and stored in `useState` — never computed inline (there's a known timing bug class around this).
- The practice's brand color (`practice_settings.color_brand`) is the single source of truth for the UI palette: `deriveColors()`/`applyColors()` compute a full HSL-derived palette (dark/mid/light/pale/accent/navBg/border/muted/disabled) into module-level `let` color variables consumed throughout the JSX. Don't hardcode colors — derive from these.

### Backend (Supabase)

- No SQL migration files are tracked in this repo (`supabase/` only holds Edge Functions + local CLI cache under `.temp/`); schema and RLS changes are applied live against the hosted project (ref in the `fitfundog` skill) and documented there, not via `supabase/migrations`.
- Edge Functions live under `supabase/functions/<name>/index.ts`: `create-user` (server-side user creation, avoids the client-side `signUp` session-clobbering bug), `delete-user`, `send-reminders` (push notification cron target), `squarespace-webhook`.
- Mutations that must bypass RLS or need elevated/atomic semantics go through Postgres RPC functions (`SECURITY DEFINER`), e.g. `insert_patient_for_practice`, rather than direct `supabase.from(...).insert(...)` — see the `fitfundog` skill for why (RLS blocks direct inserts in some auth-session states).

### PWA / push

`public/sw.js` is the service worker (registered from `App.jsx` on load) and must always show a notification on every push event, even with an undecryptable/missing payload, or iOS silently revokes push permission. Push payloads are encrypted server-side with `aes128gcm` only.

## Versioning convention (App.jsx releases)

The app's release identity is a version string, not just source diffs:
- Filename/`APP_VERSION` format: `App-JJJJ-MM-TT-NNN` (today's real date + zero-padded, ever-increasing 3-digit suffix), and the in-code `APP_VERSION` constant must match exactly.
- Always take the date from the actual current system date and the next suffix from the last known suffix + 1 — never infer either from an uploaded file's name, which reflects the *previous* release.
