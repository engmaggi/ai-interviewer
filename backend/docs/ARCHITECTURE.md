# Orbit Backend — Architecture & Design Guide

**Phase 1: Authentication & User Management**
Audience: the whole team, including people new to Next.js and TypeScript.
Companion document: `SETUP_GUIDE.md` (how to install and run everything).

---

## 1. What this phase delivers

| Capability | Where |
|---|---|
| Register (email + password + profile info), email confirmation | `POST /api/auth/register`, `GET /auth/confirm` |
| Login, logout, automatic session refresh | `POST /api/auth/login`, `POST /api/auth/logout`, `src/proxy.ts` |
| Forgot password / reset password | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Read and edit my profile (name, developer role, target seniority, years of experience) | `GET`/`PATCH /api/me` |
| List developer roles (for the registration dropdown) | `GET /api/developer-roles` |
| Role-based access: `user` vs `admin` | guards in `src/lib/auth/guards.ts` + database policies |
| Admin: list users, promote/demote, delete a user | `/api/admin/users...` |
| Bot protection (Cloudflare Turnstile) | enforced by Supabase Auth on register, login, forgot-password |
| Audit trail of admin actions | `audit_logs` table |
| Database security (RLS, column privileges, triggers) | `prisma/migrations/.../migration.sql` |

**Not in this phase** (by design — see section 14): the frontend pages, tests, rate limiting beyond Supabase's built-ins, practice/assessment/voice/evaluation modules.

### Assumptions I made (please confirm or change)

1. **Target seniority values** are `junior`, `mid`, `senior` (the requirements document never defines them). Adding one later is a one-line migration.
2. **Email confirmation is required** before first login.
3. **`years_of_experience`** is a whole number from 0 to 60, required at registration.
4. **No MFA for admins** yet. The `audit_logs` table is included now (the requirements doc planned it for Sprint 2) because admin actions need a trail from day one.
5. **Admins cannot change or delete themselves** (this also makes it impossible to end up with zero admins by accident).
6. **Developer roles are managed by SQL** (`INSERT INTO developer_roles ...`) or the Supabase dashboard, not by an API yet.
7. All developer roles can register, but the MVP in the requirements document only *assesses* frontend developers. The `developer_role` is stored now so later modules can use it.

---

## 2. Crash course: the concepts you need

You know JavaScript and Node. This is everything new in this project, explained in JS terms.

### 2.1 TypeScript in five minutes

TypeScript is JavaScript plus *types*, checked **before** the code runs. The types are erased at build time — what runs is plain JS.

```ts
// JS:  function greet(name) { return "Hi " + name }
function greet(name: string): string {        // `name` must be a string, returns a string
  return "Hi " + name;
}

interface User { id: string; email: string | null }   // a "shape" of an object; `| null` means "or null"
const u: User = { id: "1", email: null };

const maybe: string | undefined = undefined;          // union types
maybe?.toUpperCase();                                  // optional chaining, same as modern JS

async function load(): Promise<User> { ... }           // Promise<User> = "resolves to a User"
```

Useful things you will meet here:

* `import { x } from "@/lib/errors"` — `@/` is an alias for the `src/` folder (configured in `tsconfig.json`).
* `z.infer<typeof schema>` — gets the TypeScript type *from* a Zod schema, so we define a shape once.
* `as const`, `satisfies`, generics `<T>` — you can ignore these until you are comfortable; just copy existing patterns.
* If your editor shows a red underline, it is the type checker. `npm run typecheck` runs the same check in the terminal.

### 2.2 Next.js App Router in five minutes

Next.js is a framework that gives us the web server, routing and build tooling in one project.

* **Routing by folders.** A file at `src/app/api/me/route.ts` that exports `GET`/`PATCH` functions *is* the endpoint `GET/PATCH /api/me`. No Express `app.get(...)` calls.
* **Route handler** = one of those exported functions. It receives a `Request` and returns a `Response`.
* **Dynamic segments**: the folder `src/app/api/admin/users/[id]/route.ts` matches `/api/admin/users/123`; `id` arrives in `params`.
* **Server vs client code.** Next.js can run code on the server *or* in the browser. Everything in this repo's backend is server-only. A file that starts with `import "server-only"` makes the build **fail** if browser code ever imports it — this is how we guarantee secrets never leak.
* **`src/proxy.ts`** (called `middleware.ts` before Next.js 16) runs before every request. We use it only to keep the login session fresh.
* **Environment variables** live in `.env.local`. Variables starting with `NEXT_PUBLIC_` are sent to the browser, **everything else stays on the server**. Never put a secret in a `NEXT_PUBLIC_` variable.

### 2.3 The other building blocks

| Tool | What it is | Why we use it |
|---|---|---|
| **Supabase** | A hosted Postgres database + an Auth service (+ more) | Free tier, handles passwords/sessions/emails so we don't write (and get wrong) that security code |
| **Supabase Auth** | Stores users in the `auth.users` table, hashes passwords, issues JWT tokens, sends emails | We never see or store passwords |
| **JWT (access token)** | A signed ticket proving "this is user X", valid ~1 hour, stored in an HttpOnly cookie | Our server verifies the signature to know who is calling |
| **Prisma** | An ORM: write `prisma.profile.findUnique(...)` instead of SQL; generates TypeScript types from `schema.prisma` | Type-safe queries, good tooling, familiar to many |
| **Zod** | A validation library: describe the allowed shape of input, get errors + TypeScript types | Never trust request data; validate at the edge |
| **RLS (Row Level Security)** | A Postgres feature: rules like "a user may only see rows where `id = their id`", enforced *inside the database* | A bug in our code cannot leak other users' data |
| **Cloudflare Turnstile** | A free, privacy-friendly "are you a bot?" check | Required by the project brief |

---

## 3. Key design decisions

| # | Decision | Why | Alternative rejected |
|---|---|---|---|
| 1 | **Prisma** as ORM (your choice) | Great typing and tooling; works with Supabase | Drizzle: more SQL-native and RLS-aware, but you chose Prisma |
| 2 | **SQL migrations written by hand**, applied with `prisma migrate deploy` | Prisma cannot express triggers, RLS policies, column privileges or foreign keys into Supabase's `auth` schema. Hand-written SQL is exact and reviewable | `prisma migrate dev` would try to "fix" what it cannot model and needs a shadow database that lacks Supabase's `auth` schema |
| 3 | **`profiles` table, 1:1 with `auth.users`**, created by a database trigger | Credentials stay in Supabase (we never store passwords); app data in our table; the trigger makes user + profile creation atomic — no half-created accounts | Writing the profile from app code after sign-up (can fail in between); putting everything in `auth.users` metadata (not queryable, user-editable) |
| 4 | **`account_type` = PostgreSQL ENUM** (`user`, `admin`) | Tiny, closed set that code branches on; security-critical, so strict typing helps | Free text + CHECK |
| 5 | **`developer_role` = lookup table** (`developer_roles`) with FK | New options = one `INSERT`, no deploy; can retire an option without breaking old rows; has a label and sort order; can feed the registration dropdown from the API | PG ENUM: adding is a migration, removing/renaming is effectively impossible, no metadata |
| 6 | **Admin status is read from the database** on every admin request | Revocation is immediate. | Putting `role: admin` in the JWT: stale until the token expires (up to 1h) after a demotion |
| 7 | **User-scoped DB access through `withUserContext`** | Prisma normally connects as the database owner and *bypasses* RLS. This helper switches the transaction to the `authenticated` role with the user's id, so RLS and column privileges **actually apply** to profile reads/writes | Plain Prisma everywhere (RLS would exist but never be exercised: a false sense of safety) |
| 8 | **Captcha enforced by Supabase**, not by our route code | The Supabase publishable key is public; anyone can call Supabase Auth directly and skip our API. Supabase-level CAPTCHA protects that path too | Verifying Turnstile only in our routes (bypassable) |
| 9 | **Cookie sessions via `@supabase/ssr`** | The recommended approach for Next.js; HTTP-only cookies are not readable by JavaScript (XSS-safe); refresh handled in `proxy.ts` | Storing tokens in `localStorage` |
| 10 | **Modular monolith** (`src/modules/*`) | One deployable app (as the requirements doc specifies) with clear boundaries so modules can be extracted later | Microservices (explicitly excluded) |

---

## 4. Database design

### 4.1 Review of the original ERD

The ERD you sent has `auth.users 1:1 users(id, display_name, created_at, updated_at)` and then problem/submission/interview tables.

| Finding | Action |
|---|---|
| Table named `users` next to Supabase's `auth.users` is confusing and ambiguous | Renamed to **`profiles`** (matches "candidate profiles" in the requirements doc) |
| No `account_type`, `developer_role`, target seniority or experience | Added (requirement of this phase + the doc's "target seniority") |
| `id` FK to `auth.users.id` is right, but delete behaviour wasn't defined | `ON DELETE CASCADE`: deleting the auth user removes the profile (needed for admin delete) |
| No way to record who did what | Added **`audit_logs`** (the requirements doc plans one) |
| Only `display_name` was nullable-unclear | `display_name` is `NOT NULL`, 2–80 characters |
| The rest of the ERD (problems, submissions, interview_sessions, turns, scores) is titled "AI Technical Interview & Job-Matching Platform — Sprint 1" and predates the final **Orbit** plan | **Left untouched** (out of scope) but flagged: it needs redrawing for practice/official separation, versioned rubrics, quiz answers and evidence. Also `problems.hidden_test_cases` / `solution_notes` sit in the same row as candidate-visible content — conflicts with "official content readable only by the server"; split it into separate tables or restrict columns |
| Future modules will reference users | They should reference **`profiles(id)`** (same value as `auth.users.id`) with `ON DELETE CASCADE` |

Things deliberately **not** stored in `profiles`: password (Supabase), email (lives in `auth.users`; duplicating it risks the two disagreeing).

### 4.2 Tables

```
auth.users  (managed by Supabase — never edit by hand)
   id uuid PK, email, encrypted password, email_confirmed_at, last_sign_in_at, raw_user_meta_data ...
      │ 1:1  (profiles.id = auth.users.id, ON DELETE CASCADE)
      ▼
profiles
   id                   uuid  PK  → auth.users(id)
   display_name         text  NOT NULL   CHECK 2..80 chars
   account_type         account_type NOT NULL DEFAULT 'user'     ('user' | 'admin')
   developer_role       text  NOT NULL  → developer_roles(code)
   target_seniority     target_seniority NOT NULL                ('junior' | 'mid' | 'senior')
   years_of_experience  smallint NOT NULL  CHECK 0..60
   created_at, updated_at  timestamptz  (updated_at maintained by a trigger)
   indexes: account_type, developer_role

developer_roles                         audit_logs
   code        text PK  (e.g. 'frontend_developer')    id uuid PK
   label       text     ('Frontend Developer')          actor_id uuid → profiles(id) ON DELETE SET NULL
   sort_order  int                                      action text  ('account_type_changed', 'user_deleted', ...)
   is_active   boolean                                  target_user_id uuid  (NO foreign key: log outlives the user)
   created_at                                           metadata jsonb, created_at
```

Seeded roles: Frontend, Backend, Full Stack, Mobile, DevOps, QA, Software Engineer, Data Engineer, Other.

**To add a developer role later** (no code deploy needed), run in the Supabase SQL editor:
```sql
INSERT INTO public.developer_roles (code, label, sort_order)
VALUES ('security_engineer', 'Security Engineer', 75);
```
To retire one: `UPDATE public.developer_roles SET is_active = false WHERE code = '...'` (existing users keep it; new sign-ups can't pick it).

`account_type` and `developer_role` are **separate columns with separate meaning**. Nothing in the code or policies ever derives admin rights from `developer_role`.

### 4.3 What the migration does, in order

1. Creates the enums `account_type`, `target_seniority`.
2. Creates and seeds `developer_roles`.
3. Creates `profiles` (constraints, FKs, indexes) and `audit_logs`.
4. Creates functions and triggers:
   * `set_updated_at` — keeps `updated_at` correct.
   * `handle_new_user` — fires when Supabase creates an auth user; inserts the profile from the sign-up metadata. **It never reads `account_type` from metadata** (metadata is user-controlled) — every new profile is a `user`. Missing metadata falls back to safe defaults, so users created from the Supabase dashboard also get a profile.
   * `protect_profile_privileged_columns` — if the connection role is `authenticated` or `anon`, changing `account_type` or `id` raises an error. Last line of defence.
   * `is_admin()` — used by policies; `SECURITY DEFINER` so reading `profiles` inside a policy on `profiles` doesn't recurse forever.
5. Sets **column-level privileges** and **RLS policies** (next section).
6. Locks down Prisma's own bookkeeping table from Supabase's public Data API.

---

## 5. Security model

Security is layered. An attacker (or one of our own bugs) must defeat *every* layer.

```
Request ─► [1 Origin check + Zod validation]
        ─► [2 Captcha + rate limits (Supabase Auth)]
        ─► [3 Guards: requireUser / requireAdmin]
        ─► [4 Service rules (can't edit yourself, role must exist ...)]
        ─► [5 Database: RLS policies + column privileges + triggers]
        ─► [6 Audit log]
```

### 5.1 RLS policies and privileges

| Table | Who | May do | How |
|---|---|---|---|
| `profiles` | signed-in user | `SELECT` own row | policy `profiles_select_own` (`id = auth.uid()`) |
| | signed-in user | `UPDATE` own row, **only** `display_name`, `developer_role`, `target_seniority`, `years_of_experience` | policy `profiles_update_own` + `GRANT UPDATE (col, ...)`; `account_type` is not in the grant |
| | admin | `SELECT` all rows | policy `profiles_select_admin` (`is_admin()`) |
| | anyone via client roles | `INSERT`/`DELETE` | no privilege and no policy → impossible (rows come from the trigger; deleted by cascade) |
| | anonymous | anything | no privilege |
| `developer_roles` | visitors (`anon`) | read **active** roles only | policy `developer_roles_select_anon` |
| | signed-in users | read **all** roles, including retired ones | policy `developer_roles_select_authenticated` — a profile that still points at a retired role must keep loading |
| | clients | write | no privilege (edit via SQL / dashboard) |
| `audit_logs` | admin | read | policy `audit_logs_select_admin` |
| | clients | write | no privilege; only our server writes |

**How admin changes work.** Changing someone's `account_type` is done by the *server* (connected as the database owner, after `requireAdmin()` passed), not via a policy that would let the client role write the column. That keeps `account_type` unwritable by *any* client-facing role, even for admins, which is a stronger guarantee. Admins get database-level *read* power through policies; *write* power exists only in our audited server code.

### 5.2 Why users can't promote themselves — four independent barriers

1. The registration schema has no `accountType`; `z.strictObject` **rejects** unknown fields with a 400.
2. The profile-update schema is also strict → `{ "accountType": "admin" }` to `PATCH /api/me` is a 400.
3. Even if app code were buggy, the database role `authenticated` has no `UPDATE` privilege on that column.
4. Even if someone granted it by mistake, the trigger `protect_profile_privileged_columns` raises an error. And the signup trigger ignores any `account_type` smuggled in sign-up metadata.

### 5.3 Admin provisioning

* **First admin**: you run `npm run admin:bootstrap` on your own machine (needs the secret key, so only someone with server credentials can do it). It creates the user (or finds an existing one), sets `account_type = 'admin'`, writes an audit entry. It is a script, not an HTTP endpoint — nothing on the internet can reach it.
* **More admins**: an existing admin calls `PATCH /api/admin/users/{id}/account-type`. Rules enforced: admin-only, cannot target yourself, audit entry written in the same transaction as the change.
* **Server validation of admin**: `requireAdmin()` (a) verifies the token signature, (b) asks Supabase Auth that the session is still valid, (c) reads `account_type` from the database. 401 if not logged in, 403 if logged in but not admin.

### 5.4 Other protections

| Threat | Mitigation |
|---|---|
| Bots creating accounts / guessing passwords | Turnstile CAPTCHA enforced by Supabase on sign-up, sign-in, password reset; Supabase's built-in rate limits |
| Finding out which emails are registered (enumeration) | Register and forgot-password always return the same success message; login says "Invalid email or password" for both unknown email and wrong password |
| CSRF (a malicious site making your browser call our API) | Cookies are `SameSite=Lax`, `HttpOnly`, and `Secure` in production (`src/lib/supabase/cookies.ts` hardens Supabase's defaults); extra check: if an `Origin` header is present on POST/PATCH/DELETE it must equal `NEXT_PUBLIC_APP_URL` (`BAD_ORIGIN` 403) |
| Open redirect via the email link (`?next=https://evil.com`) | `safeNextPath` accepts only paths on our own site |
| Leaking the secret key | Only read in `src/lib/supabase/admin.ts` which imports `server-only` (build fails if the browser tries to import it); never `NEXT_PUBLIC_`; `.env.local` is git-ignored |
| SQL injection | Prisma parameterises everything; the few raw queries use tagged templates (`Prisma.sql`/`$queryRaw`), never string concatenation; `LIKE` wildcards in search are escaped |
| Stack traces / internals in errors | Unknown errors are logged server-side and returned as a generic 500 |
| Stale sessions after password change | `reset-password` signs out all other devices |
| Weak/over-long passwords | 8–72 chars with a letter and a number (72 = bcrypt limit); Supabase also enforces its own minimum |
| Caching of private responses | `Cache-Control: no-store` on every API response |

---

## 6. Code structure

```
orbit-backend/
├─ prisma/
│  ├─ schema.prisma                 # typed model of the tables (mirror of the SQL)
│  └─ migrations/
│     └─ 20261103000000_auth_and_profiles/migration.sql   # SOURCE OF TRUTH for the DB
├─ prisma.config.ts                 # tells the Prisma CLI where things are
├─ scripts/
│  ├─ admin-bootstrap.ts            # create/promote the first admin
│  └─ verify-db.ts                  # checks tables + security behaviour
├─ docs/                            # this guide, setup guide, email templates
├─ requests.http                    # ready-made API calls for VS Code
└─ src/
   ├─ proxy.ts                      # (1) runs on every request: refreshes the login session
   ├─ app/                          # ROUTING LAYER — thin
   │  ├─ api/auth/{register,login,logout,forgot-password,reset-password}/route.ts
   │  ├─ api/me/route.ts
   │  ├─ api/developer-roles/route.ts
   │  ├─ api/health/route.ts
   │  ├─ api/docs/route.ts                              # Swagger UI page
   │  ├─ api/openapi.json/route.ts                      # OpenAPI 3.1 file
   │  ├─ api/admin/users/route.ts                         # list
   │  ├─ api/admin/users/[id]/route.ts                    # delete
   │  ├─ api/admin/users/[id]/account-type/route.ts       # promote / demote
   │  ├─ auth/confirm/route.ts      # target of the links in our emails
   │  └─ reset-password/page.tsx    # PLACEHOLDER page for the reset link (frontend replaces it)
   ├─ modules/                      # BUSINESS LOGIC — one folder per feature
   │  ├─ auth/            auth.schemas.ts · auth.service.ts · auth.errors.ts
   │  ├─ profiles/        profiles.schemas.ts · profiles.service.ts · profiles.repository.ts · profiles.types.ts
   │  ├─ developer-roles/ developer-roles.service.ts · developer-roles.repository.ts
   │  └─ admin/           admin.schemas.ts · admin-users.service.ts · admin-users.repository.ts · audit.repository.ts
   ├─ lib/                          # SHARED INFRASTRUCTURE
   │  ├─ env.ts                     # validated environment variables
   │  ├─ errors.ts                  # AppError and subclasses
   │  ├─ http/{handler.ts,responses.ts}   # route() wrapper, parseBody, ok()/errorResponse()
   │  ├─ auth/guards.ts             # requireUser(), requireAdmin()
   │  ├─ openapi/{spec.ts,enabled.ts}  # the Swagger / OpenAPI description of the API
   │  └─ supabase/{server.ts,admin.ts,browser.ts,proxy.ts}
   ├─ db/
   │  ├─ prisma.ts                  # the default (owner) client
   │  ├─ with-user-context.ts       # RLS-enforced transactions
   │  └─ create-prisma-client.ts    # shared with the scripts
   └─ generated/prisma/             # auto-generated by `prisma generate` — never edit, not committed
```

### 6.1 The layering rules (the most important section for contributors)

| Layer | Folder | Allowed to | Must NOT |
|---|---|---|---|
| **Route handler** | `app/**/route.ts` | read the request, validate with Zod, call a guard, call **one service**, return a response | contain business rules or call Prisma |
| **Service** | `modules/*/*.service.ts` | business rules, orchestration, call repositories and Supabase | know about HTTP (`Request`/`Response`), or write SQL |
| **Repository** | `modules/*/*.repository.ts` | talk to the database (Prisma) | contain business rules |
| **Schemas** | `modules/*/*.schemas.ts` | define input shapes with Zod | do I/O |
| **lib** | `lib/*` | shared utilities | import from `modules/*` (except guards, which need profile lookups) |

Think of it as: **route → service → repository → database**. Dependencies only point downward. Services throw typed errors (`NotFoundError`, `ForbiddenError`...); the `route()` wrapper turns them into JSON. That is why handlers contain no `try/catch`.

### 6.2 Browser-side vs server-side Supabase clients

| Client | File | Key it holds | Acts as | Subject to RLS? | Use |
|---|---|---|---|---|---|
| Browser | `lib/supabase/browser.ts` | publishable | the logged-in visitor | yes | Only if the frontend needs it (our UI talks to `/api/*`) |
| Server (user) | `lib/supabase/server.ts` | publishable + the user's cookies | the logged-in user | yes | Sign-up/in/out, session checks in route handlers |
| Server (admin) | `lib/supabase/admin.ts` | **secret** | nobody — full power | **no** | Create/delete users, only after `requireAdmin()` |
| Proxy | `lib/supabase/proxy.ts` | publishable | keeps cookies fresh | — | `src/proxy.ts` only |

### 6.3 Two Prisma access modes

* `prisma` (`db/prisma.ts`) — connects as the owner, **bypasses RLS**. Use for admin work, public lookup tables and guard checks.
* `withUserContext(userId, tx => ...)` (`db/with-user-context.ts`) — for anything done *on behalf of an ordinary user*. RLS applies. **Default to this for user data** in future modules (practice attempts, submissions, etc.); use plain `prisma` only when the server must act with authority (evaluation jobs, admin tools).

---

## 7. Request lifecycle walkthrough: `PATCH /api/me`

The user changes their display name and seniority. `{ "displayName": "Ali K", "targetSeniority": "senior" }`

1. **`src/proxy.ts`** runs first → `lib/supabase/proxy.ts` calls `getClaims()`. If the access token is about to expire, Supabase issues a new one and the cookies are rewritten.
2. **`app/api/me/route.ts`** — the `PATCH` export, wrapped by `route()` (`lib/http/handler.ts`). `route()` first checks the `Origin` header (CSRF).
3. `requireUser()` (`lib/auth/guards.ts`) verifies the token signature via Supabase → `{ id, email }`, or throws `UnauthorizedError` (→ 401).
4. `parseBody(req, updateProfileSchema)` parses JSON and validates with Zod (`profiles.schemas.ts`). Unknown keys or bad values → 400 with a per-field `details` list.
5. `profilesService.updateOwn(...)` (`profiles.service.ts`): if a new `developerRole` was sent, `developerRolesService.assertActive` confirms it exists → 400 `INVALID_DEVELOPER_ROLE` otherwise.
6. `profilesRepository.updateOwn(...)` calls `withUserContext(userId, tx => tx.profile.update(...))`. In the database: `set_config('request.jwt.claims', ...)`, `SET LOCAL ROLE authenticated`, then the `UPDATE` runs **under RLS**; the trigger bumps `updated_at`.
7. The service maps the row to a `ProfileDto` and the route returns `200 { "data": { ... } }`.
8. Any error thrown at any step is caught by `route()` and rendered by `errorResponse()` as `{ "error": { "code", "message", "details?" } }`.

---

## 8. Authentication flows

### 8.1 Registration + email confirmation
1. Frontend loads roles: `GET /api/developer-roles`, renders the Turnstile widget, user fills the form.
2. `POST /api/auth/register` with the form + `captchaToken`.
3. Zod validates → `developerRolesService.assertActive` → `supabase.auth.signUp({ ..., options: { captchaToken, data: {display_name, developer_role, ...} } })`.
4. Supabase verifies the captcha, creates the `auth.users` row; **the trigger `handle_new_user` creates the `profiles` row in the same transaction** with `account_type = 'user'`.
5. Supabase emails the confirmation link (our template): `…/auth/confirm?token_hash=…&type=email&next=/`.
6. We respond `202` with a neutral message (identical whether or not the email already existed).
7. User clicks the link → `GET /auth/confirm` exchanges the one-time `token_hash` for a session (`verifyOtp`), sets the cookies and redirects to `next` (validated). Invalid/expired → redirect to `/?auth_error=invalid_or_expired_link`.

### 8.2 Login, session, refresh, logout
* `POST /api/auth/login` → `signInWithPassword` (with captcha) → cookies are set → response is the user's profile. The tokens are in **HTTP-only cookies**; they are never in the JSON body.
* Every later request passes through `proxy.ts`, which refreshes the access token when needed — that *is* the "access-token refresh"; the frontend does nothing.
* `POST /api/auth/logout` → `signOut` → cookies cleared. Safe to call when already logged out.
* A deleted or expired session: guards answer 401 `UNAUTHENTICATED`; the frontend should redirect to login.

### 8.3 Forgot / reset password
1. `POST /api/auth/forgot-password { email, captchaToken }` → always `202`.
2. The email link (our template) goes to `/auth/confirm?token_hash=…&type=recovery&next=/reset-password`. The server verifies it, sets a short-lived **recovery session** cookie and redirects to the frontend route `/reset-password`. A bare-bones placeholder page for it ships in `src/app/reset-password/page.tsx` so the flow can be tested end to end; the frontend team replaces it.
3. The frontend page posts `POST /api/auth/reset-password { password }`. The server requires that session (else 401 `RESET_LINK_INVALID`), updates the password, signs out other devices.

### 8.4 Admin
`bootstrap script` → first admin. Then, logged in as an admin: list users, `PATCH …/account-type`, `DELETE …/{id}`. Delete removes the Auth user via the admin client; the profile disappears by `ON DELETE CASCADE`; an audit row is written.

---

## 9. API reference

**Interactive docs (Swagger).** Run `npm run dev` and open <http://localhost:3000/api/docs>. Every endpoint is listed with its request body, the success response and **every error response (one example per error code)**, and you can try calls from the page: call *login* first, then the protected endpoints work because the browser keeps the session cookie. The raw OpenAPI 3.1 file is at `/api/openapi.json` (import it into Postman or Insomnia). The docs are off in production unless `ENABLE_API_DOCS=true`. Request bodies are generated from the same Zod schemas the routes validate with; the responses are written by hand in `src/lib/openapi/spec.ts`, so **update that file whenever you add or change an endpoint**.

**Conventions.** Base URL `http://localhost:3000`. JSON in and out. Success: `{ "data": … }`. Error: `{ "error": { "code": "…", "message": "…", "details": [...] } }`. Authentication = the session cookie set at login (browsers send it automatically on same-origin `fetch`). All responses are `Cache-Control: no-store`.

`captchaToken` = the token produced by the Turnstile widget (in development, the string `XXXX.DUMMY.TOKEN.XXXX` when using Cloudflare's test keys).

### Public endpoints

#### `GET /api/health` → 200 `{ "data": { "status": "ok" } }`
Checks that the app can reach the database. 500 if it can't.

#### `GET /api/developer-roles` → 200
```json
{ "data": [ { "code": "frontend_developer", "label": "Frontend Developer" }, … ] }
```

#### `POST /api/auth/register` → 202
```json
// request
{ "email": "alice@example.com", "password": "Passw0rdPassw0rd", "displayName": "Alice Example",
  "developerRole": "frontend_developer", "targetSeniority": "mid", "yearsOfExperience": 3,
  "captchaToken": "…" }
// response
{ "data": { "message": "Check your email to confirm your account." } }
```
Errors: 400 `VALIDATION_ERROR` (fields in `details`; includes any unknown field such as `accountType`), 400 `INVALID_DEVELOPER_ROLE`, 400 `CAPTCHA_FAILED`, 400 `WEAK_PASSWORD`, 429 `RATE_LIMITED`.
Rules: email normalised to lowercase; password 8–72 chars with a letter and a number; displayName 2–80; `targetSeniority` ∈ `junior|mid|senior`; `yearsOfExperience` integer 0–60.
Note: for an already-registered email you get the same 202 (anti-enumeration).

#### `POST /api/auth/login` → 200
```json
// request: { "email": "…", "password": "…", "captchaToken": "…" }
// response (+ Set-Cookie headers)
{ "data": { "id": "uuid", "email": "alice@example.com", "displayName": "Alice Example",
            "accountType": "user", "developerRole": { "code": "frontend_developer", "label": "Frontend Developer" },
            "targetSeniority": "mid", "yearsOfExperience": 3,
            "createdAt": "…", "updatedAt": "…" } }
```
Errors: 401 `INVALID_CREDENTIALS`, 403 `EMAIL_NOT_CONFIRMED`, 403 `ACCOUNT_DISABLED`, 400 `CAPTCHA_FAILED`, 429 `RATE_LIMITED`.

#### `POST /api/auth/forgot-password` → 202
Request `{ "email", "captchaToken" }`. Always `{ "data": { "message": "If an account exists for this email, a reset link has been sent." } }`. Errors: 400 `CAPTCHA_FAILED`, 429.

### Needs a session

#### `POST /api/auth/logout` → 204 (no body)

#### `POST /api/auth/reset-password` → 200
Request `{ "password": "NewPassw0rd123" }`. Requires the recovery session from the email link. Errors: 401 `RESET_LINK_INVALID`, 400 `WEAK_PASSWORD` / `SAME_PASSWORD`.

#### `GET /api/me` → 200 — the profile object shown above. 401 `UNAUTHENTICATED`, 401 `ACCOUNT_NOT_FOUND`.

#### `PATCH /api/me` → 200 — updated profile
Any non-empty subset of `displayName`, `developerRole`, `targetSeniority`, `yearsOfExperience`. Anything else (e.g. `accountType`, `email`) → 400. Errors: 400 `VALIDATION_ERROR`, 400 `INVALID_DEVELOPER_ROLE`, 401.

### Admin only (401 if not logged in, **403 `ADMIN_REQUIRED`** if not an admin)

#### `GET /api/admin/users?page=1&pageSize=20&search=ali` → 200
```json
{ "data": { "items": [ { "id": "…", "email": "…", "displayName": "…", "accountType": "user",
   "developerRole": "frontend_developer", "targetSeniority": "mid", "yearsOfExperience": 3,
   "emailConfirmedAt": "…", "lastSignInAt": "…", "createdAt": "…" } ],
   "page": 1, "pageSize": 20, "total": 42 } }
```
`pageSize` max 100; `search` matches name or email (case-insensitive).

#### `PATCH /api/admin/users/{id}/account-type` → 200 `{ "data": { "id": "…", "accountType": "admin" } }`
Body `{ "accountType": "admin" | "user" }`. Errors: 404 `USER_NOT_FOUND`, 409 `CANNOT_MODIFY_SELF`, 400 (bad uuid / body).

#### `DELETE /api/admin/users/{id}` → 204
Errors: 404 `USER_NOT_FOUND`, 409 `CANNOT_MODIFY_SELF`, 502 `UPSTREAM_ERROR`.

### Browser route
`GET /auth/confirm?token_hash=…&type=email|recovery|signup|invite|email_change&next=/path` → 307 redirect (see 8.1). Not called by `fetch`; it is the link target in emails.

### Error code reference

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_JSON` | Body/query/params invalid (see `details`) |
| 400 | `INVALID_DEVELOPER_ROLE` | Unknown or inactive role code |
| 400 | `CAPTCHA_FAILED` | Missing/invalid Turnstile token |
| 400 | `WEAK_PASSWORD`, `SAME_PASSWORD` | Password rejected |
| 401 | `UNAUTHENTICATED`, `SESSION_INVALID`, `ACCOUNT_NOT_FOUND` | Not logged in / session invalid / account deleted |
| 401 | `INVALID_CREDENTIALS`, `RESET_LINK_INVALID` | Login failed / no valid recovery session |
| 403 | `ADMIN_REQUIRED`, `BAD_ORIGIN`, `EMAIL_NOT_CONFIRMED`, `ACCOUNT_DISABLED` | Not allowed |
| 404 | `USER_NOT_FOUND` | Target user missing |
| 409 | `CANNOT_MODIFY_SELF` | Admin targeted themselves |
| 429 | `RATE_LIMITED` | Too many requests (Supabase limits) |
| 500 | `INTERNAL_ERROR` | Unexpected; details only in server logs |
| 502 | `UPSTREAM_ERROR` | Supabase Auth failed |

---

## 10. Environment variables

| Variable | Secret? | Used by | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | no | origin check, redirects | Public URL of this app (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_SUPABASE_URL` | no | all Supabase clients | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | no | user-level clients | Public key; limited by RLS |
| `SUPABASE_SECRET_KEY` | **YES** | `lib/supabase/admin.ts`, bootstrap script | Full-power key (bypasses RLS) |
| `DATABASE_URL` | **YES** | Prisma at runtime | DB connection (session pooler, port 5432) |
| `DIRECT_URL` | **YES** | Prisma CLI / migrations | DB connection for migrations |
| `DATABASE_SSL_CA` | no | Prisma | Optional CA cert for full TLS verification |
| `ENABLE_API_DOCS` | no | `/api/docs`, `/api/openapi.json` | Set to `true` to serve the API docs in production (always on in development) |
| `ADMIN_BOOTSTRAP_*` | **YES** | bootstrap script only | First admin credentials; remove after use |

The app validates these at start of use (`src/lib/env.ts`) and prints a readable error naming the missing variable.

---

## 11. Database migrations: the rules

* The SQL in `prisma/migrations/<timestamp>_<name>/migration.sql` **is** the database. It is applied with `npm run db:migrate` (`prisma migrate deploy`), which records applied files in a `_prisma_migrations` table and only runs new ones.
* **Never** run `prisma migrate dev`, `prisma db push` or `prisma db pull`: they would try to diff against a database that contains things Prisma can't model and can propose destructive "fixes".
* **Never edit a migration that has been applied** (anywhere — teammates' databases too). Add a new migration instead.
* To change the schema: (1) create a folder `prisma/migrations/<YYYYMMDDHHMMSS>_<description>/` with a `migration.sql`; (2) edit `prisma/schema.prisma` to mirror it; (3) `npm run db:migrate`; (4) `npm run db:generate`; (5) `npm run typecheck`; (6) commit all of it together.
* New tables holding user data must: enable RLS, `REVOKE ALL` from `anon, authenticated` then `GRANT` only what is needed, add policies, and reference `profiles(id) ON DELETE CASCADE`. Supabase grants broad default access to new tables, so the `REVOKE` is not optional. Copy the pattern in the first migration.

---

## 12. How to add a new feature (recipe)

Example: a `GET /api/practice/challenges` endpoint for a future module.

1. `src/modules/practice/practice.schemas.ts` — Zod schemas for inputs.
2. `src/modules/practice/practice.repository.ts` — Prisma queries (`withUserContext` for user-owned rows).
3. `src/modules/practice/practice.service.ts` — rules; throw `AppError` subclasses.
4. `src/app/api/practice/challenges/route.ts`:
   ```ts
   import { requireUser } from "@/lib/auth/guards";
   import { ok } from "@/lib/http/responses";
   import { route } from "@/lib/http/handler";
   import { practiceService } from "@/modules/practice/practice.service";

   export const GET = route(async () => {
     const user = await requireUser();
     return ok(await practiceService.listChallenges(user.id));
   });
   ```
5. Add a migration (section 11) if you need tables.
6. Add the call to `requests.http`, and describe it in `src/lib/openapi/spec.ts` (path, request body, success response, every error it can return) so it shows up in Swagger.

Other modules should talk to `profiles` through `profilesService`, not by importing its repository.

---

## 13. Notes for the frontend team

* The API is same-origin, so `fetch("/api/me")` sends the cookies automatically. Do not store tokens yourself. For non-GET requests keep the default browser behaviour (it adds the `Origin` header).
* Render the Turnstile widget on register, login and forgot-password forms and send its token as `captchaToken`. The widget **site key** goes in your own `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; the **secret** lives only in the Supabase dashboard. Tokens are single-use: reset the widget after a failed attempt.
* Pages you must build: `/login`, `/register`, `/forgot-password`, `/reset-password` (shown after the emailed link; posts to `/api/auth/reset-password` — a working placeholder exists, restyle or replace it), and handle `/?auth_error=invalid_or_expired_link`.
* Treat any `401` from `/api/*` as "send the user to login".
* Show `details[].message` next to the matching `details[].path` for validation errors.
* Form-friendly rules: password 8–72 chars with a letter and a number; years 0–60.

---

## 14. Known limitations and what comes next

| Item | Status |
|---|---|
| Automated tests | Deferred at your request. Good first ones: Zod schemas (pure functions), `adminUsersService` rules, and integration tests that call the routes against a local Supabase — including "user cannot promote self" and "user cannot read another profile" |
| Rate limiting beyond Supabase's built-ins | Not implemented. The requirements doc plans Upstash Ratelimit for token minting/submissions in later sprints |
| MFA for admins, "current password required" for password change, email change, self-service account deletion | Not implemented |
| Admin API for developer roles / reading audit logs | Not implemented (RLS already lets admins read the log) |
| Supabase built-in email: 2 emails/hour, only to your team's addresses | Configure custom SMTP before real users/pilot (see Setup Guide) |
| Database TLS | Encrypted, but the certificate chain is verified only if `DATABASE_SSL_CA` is set |
| Production database connection | For serverless hosting (Vercel) consider the transaction pooler (port 6543); test it before relying on it |
| What was verified, and what was not | **Verified before delivery:** `npm run typecheck`, `npm run lint` and `npm run build` pass (14 routes). The SQL migration was applied to an in-process PostgreSQL with a stand-in Supabase `auth` schema, and 28 security checks passed: the signup trigger ignores a smuggled `account_type`, users see and edit only their own row, nobody can change `account_type` through a client role (column privilege **and**, separately, the trigger), anonymous users read nothing private, admin reads all, cascade deletes and audit-log survival. The built app was started and its validation, CSRF (`BAD_ORIGIN`), unauthenticated (401) and bad-link paths were exercised over HTTP. **Not verified (needs your real Supabase project):** live Supabase Auth calls (sign-up, emails, captcha, login) and `prisma migrate deploy` against Supabase. `SETUP_GUIDE.md` sections 5 and 9 are the end-to-end test that closes that gap |
