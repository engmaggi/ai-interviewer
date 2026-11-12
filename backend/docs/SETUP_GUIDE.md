# Orbit Backend — Setup Guide (from zero, free)

**Who this is for:** anyone on the team, including people who have never used Next.js, TypeScript, Supabase or Prisma.
**What you will have at the end:** the Orbit authentication backend running on your computer, connected to your own free Supabase project, with a working register → confirm email → login → profile → admin flow.
**Time:** about 60–90 minutes the first time.
**Cost:** $0. Everything below uses free tiers (Supabase Free, Cloudflare free, GitHub free).

> **How to read this guide:** do the sections in order. Every command is meant to be copied exactly. A line that starts with `$` is typed in a terminal (don't type the `$`). Where the guide says *"you should see…"*, compare — if it differs, jump to section 13 (Troubleshooting).
>
> Supabase and Cloudflare occasionally rename buttons in their dashboards. If a name differs slightly from what is written here, look for the closest match; the *idea* of each step stays the same.

---

## 0. The big picture (2 minutes)

```
Your browser / frontend ──►  Next.js app (this repo, runs on your computer: http://localhost:3000)
                                   │
                  ┌────────────────┴─────────────────┐
                  ▼                                  ▼
          Supabase Auth                      Supabase Postgres database
   (passwords, login, emails,             (tables: profiles, developer_roles,
    captcha check, sessions)               audit_logs … with security rules)
```

Supabase is a hosted service (free tier). You do **not** install a database on your machine. This repo is the Next.js app in the middle.

### Checklist of what you'll create
- [ ] Node.js 22 installed
- [ ] The code on your computer, dependencies installed
- [ ] A free Supabase account + project
- [ ] A `.env.local` file with your keys (never shared, never committed)
- [ ] Database tables created from our migration
- [ ] Supabase Auth configured (URLs, email templates, captcha)
- [ ] A free Cloudflare account for Turnstile (captcha)
- [ ] The first admin account

---

## 1. Install the tools

### 1.1 Node.js 22 (the JavaScript runtime)
This project needs **Node 22 or newer**.

1. Go to <https://nodejs.org> and download the **LTS** version (must be 22.x or higher), or use a version manager such as `nvm` (macOS/Linux) or `nvm-windows`.
2. Open a **new** terminal (Windows: "PowerShell" or "Git Bash"; macOS: "Terminal") and check:

```bash
$ node -v
```
You should see `v22.something` (or higher). Also check:
```bash
$ npm -v
```
(Any number is fine. `npm` is Node's package manager, you already know it.)

### 1.2 Git
Download from <https://git-scm.com/downloads> and accept the defaults. Check: `git --version`.
On Windows this also installs **Git Bash**, a terminal in which all the commands in this guide work exactly as written. We recommend using it.

### 1.3 VS Code (recommended editor)
Download from <https://code.visualstudio.com>. Install these extensions (Extensions icon on the left → search → Install):
* **Prisma** (Prisma.prisma) — highlights `schema.prisma`
* **ESLint** (dbaeumer.vscode-eslint)
* **REST Client** (humao.rest-client) — lets you click "Send Request" on the `requests.http` file to test the API. No Postman needed.

> You do **not** need Docker for the main path in this guide. (Docker is only used in the optional section 12.)

---

## 2. Get the code and install it

Put the project folder somewhere simple (for example `C:\dev\orbit-backend` or `~/dev/orbit-backend`). If you received it as a zip, unzip it. If it's in a Git repository: `git clone <repo-url> orbit-backend`.

Open a terminal **inside the project folder** (in VS Code: *Terminal → New Terminal* after *File → Open Folder*), then:

```bash
$ npm install
```
This downloads the libraries into `node_modules/` and runs `prisma generate`, which creates the typed database client in `src/generated/prisma/`. You should see `✔ Generated Prisma Client` near the end and no red errors. (Warnings about "deprecated" packages are normal.)

Quick sanity check that TypeScript is happy:
```bash
$ npm run typecheck
```
No output = success.

---

## 3. Create your free Supabase project

1. Go to <https://supabase.com> → **Start your project** → sign up (GitHub login is easiest).
2. If asked, create an **organization** (name it e.g. "Orbit Team", plan **Free**).
3. Click **New project** and fill in:
   * **Name:** `orbit-dev`
   * **Database password:** click **Generate a password**, then **copy it into a password manager or a safe note right now**. You cannot view it again later (you can only reset it). Prefer letters and digits only — special characters (`@ : / # ?`) must be URL-encoded in connection strings and cause confusing errors.
   * **Region:** the one closest to most of your team (e.g. Frankfurt for Egypt/Europe).
   * **Plan:** Free.
4. Click **Create new project** and wait 1–3 minutes until the dashboard loads.

> **Team tip.** The simplest team setup is **one shared `orbit-dev` project** owned by one person who then invites teammates (*Organization settings → Team → Invite*). Invited members are also the only people the free built-in email service will send to (see section 7.4). Each developer still runs the app on their own computer with their own `.env.local`.
>
> **Free-tier note.** Free projects are paused after a period of inactivity (currently about one week). If the app suddenly can't connect, open the dashboard and click **Restore project**.

---

## 4. Collect your keys and create `.env.local`

### 4.1 Create the file
In the project folder, copy the template:
```bash
$ cp .env.example .env.local
```
(Windows PowerShell: `copy .env.example .env.local`.) Open `.env.local` in VS Code. You will fill in the blanks below. **`.env.local` is git-ignored: never commit it, never paste it in chat, never email it.**

### 4.2 Project URL and API keys
In the Supabase dashboard open **Project Settings → API Keys** (the project URL is also visible there or under **Project Settings → Data API**, and in the **Connect** dialog).

| Put this in `.env.local` | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, looks like `https://abcdefghijklmnop.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable key** — starts with `sb_publishable_` — safe for browsers |
| `SUPABASE_SECRET_KEY` | **Secret key** — starts with `sb_secret_` (create/reveal it on the same page) — **server only, treat like a password** |

> The secret key can read and change *everything*, bypassing all security rules. It is used only by server code. If it is ever committed, pasted publicly, or shown in a screenshot, go back to the API Keys page and delete/regenerate it immediately.

### 4.3 Database connection strings
1. Click **Connect** at the top of the dashboard.
2. Choose the **Connection String** tab (type: URI) and the method **Session pooler**.
3. Copy the string. It looks like:
   `postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
4. Replace `[YOUR-PASSWORD]` (including the square brackets) with the database password from section 3.
5. Paste the **same** string into **both** `DATABASE_URL` and `DIRECT_URL`.

Why the *Session pooler* (port **5432**)? The "direct connection" string only works over IPv6, which many home/office networks don't have. The session pooler works everywhere (IPv4 + IPv6) and supports everything Prisma migrations need. Keep the username as `postgres.<project-ref>` — the app needs the main `postgres` user.

Do **not** append `?sslmode=…` or `?pgbouncer=true`; the code handles encryption itself.

### 4.4 App URL
Leave `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

### 4.5 Your finished file
```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:YourDbPassword@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.abcdefghijklmnop:YourDbPassword@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```
No quotes, no spaces around `=`, no trailing spaces.

---

## 5. Create the database tables

### 5.1 Run the migration
```bash
$ npm run db:migrate
```
You should see something like:
```
1 migration found in prisma/migrations
Applying migration `20261103000000_auth_and_profiles`
All migrations have been successfully applied.
```
This executed `prisma/migrations/20261103000000_auth_and_profiles/migration.sql`, which created the tables, enums, triggers, and security rules.

### 5.2 Verify it
```bash
$ npm run db:verify
```
You should see eleven green `✔` lines and `All checks passed.` These check the connection, that the tables exist, that Row Level Security is on, and that — acting as a normal user — the database refuses to let you change `account_type`. **If any check shows `✘`, stop and see section 13.**

### 5.3 Look at it (optional but recommended)
In the Supabase dashboard open **Table Editor**. You should see `profiles`, `developer_roles` (9 rows) and `audit_logs`. Notice the little **RLS enabled** badges. Open **Authentication → Users**: it is empty for now. That's the table behind `auth.users`.

---

## 6. Start the app (first smoke test)

```bash
$ npm run dev
```
Wait for `Ready`. Then open <http://localhost:3000/api/health> in your browser. You should see:
```json
{"data":{"status":"ok"}}
```
That proves the app can talk to your database. Also try <http://localhost:3000/api/developer-roles> — you should see a JSON list of roles.

Leave this terminal running (stop it any time with `Ctrl + C`). Open a **second** terminal for other commands.

---

## 7. Configure Supabase Authentication

All of this is in the Supabase dashboard under **Authentication**.

### 7.1 URL configuration
**Authentication → URL Configuration:**
* **Site URL:** `http://localhost:3000`
* **Redirect URLs:** add `http://localhost:3000/**`

(When you deploy, add your production URL here too and change the Site URL.) Our email templates build their links from the Site URL, so it must be correct.

### 7.2 Require email confirmation
**Authentication → Sign In / Providers → Email** (older dashboards: *Providers → Email*):
* **Enable Email provider:** on
* **Confirm email:** **on** (the default — keep it)
* Minimum password length: set **8** (our API enforces 8–72 with a letter and a number)

### 7.3 Email templates (important — without this, links won't log you in)
Supabase's default email links don't work with server-side Next.js apps. We replace them with links to our `/auth/confirm` route.

**Authentication → Email Templates** (newer dashboards: *Authentication → Emails → Templates*):

1. Open **Confirm signup**. Replace the whole body with the contents of `docs/email-templates/confirm-signup.html`. The essential line is:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/">Confirm my email</a>
   ```
2. Open **Reset password**. Replace the body with `docs/email-templates/reset-password.html`. Essential line:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset my password</a>
   ```
3. Save each one.

### 7.4 Who can receive emails (free tier limits — read this!)
Supabase's **built-in** email service is for testing only:
* It sends **only to email addresses of members of your Supabase organization.** Sending to anyone else fails with *"Email address not authorized."*
* It is limited to about **2 emails per hour** (this can change without notice).

For development, that means: register your test accounts with email addresses that belong to people invited to your Supabase organization (**Organization settings → Team → Invite**), and if you hit the hourly limit, wait an hour (or set up custom SMTP, below). Each invited person can also test with their own address.

**Before any pilot with real users**, set up custom SMTP (free tiers exist at Brevo, Resend, and others): **Authentication → Emails → SMTP Settings** (or *Project Settings → Authentication*), enable **Custom SMTP**, and enter the host, port, username, password and sender address your email provider gives you.

---

## 8. Set up the captcha (Cloudflare Turnstile)

Turnstile is Cloudflare's free bot check. Supabase verifies the captcha for us on register, login and forgot-password. **Our API requires a `captchaToken` field on those three requests.**

You have two options. Use **Option A to get going**, **Option B before you build the real UI**.

### Option A — Cloudflare test keys (no account needed, perfect for API testing)
Cloudflare publishes keys that always pass:

| What | Value |
|---|---|
| Test **secret** key (paste into Supabase) | `1x0000000000000000000000000000000AA` |
| Test **site** key (used by a frontend widget) | `1x00000000000000000000AA` |
| Token to send as `captchaToken` when calling the API by hand | `XXXX.DUMMY.TOKEN.XXXX` |

In the Supabase dashboard go to **Authentication → Attack Protection** (newer dashboards: **Settings → Authentication → Bot and Abuse Protection**):
1. Turn **Enable CAPTCHA protection** on.
2. Provider: **Cloudflare Turnstile**.
3. Paste the test secret `1x0000000000000000000000000000000AA` → **Save**.

> ⚠️ With the *test* secret, **anything** passes, so this protects nothing. It is for development only. Never leave it on a production project.

### Option B — a real Turnstile widget
1. Create a free account at <https://dash.cloudflare.com/sign-up> (no domain required for Turnstile).
2. In the left menu open **Turnstile → Add widget** (or *Add site*).
3. **Widget name:** `orbit-dev`. **Hostnames:** add `localhost` (later also your real domain). **Widget mode:** *Managed*. Create.
4. Copy the **Site Key** (public — the frontend uses it) and the **Secret Key** (private).
5. In Supabase (same page as Option A), paste the real **Secret Key** and Save.
6. Give the **Site Key** to the frontend developer, who renders the widget and sends the token it produces as `captchaToken`. Tokens are single-use and expire after a few minutes.

Switching between A and B is just replacing the secret in Supabase.

---

## 9. End-to-end test of authentication

We'll test the real flow: register → confirm email → login → profile → edit → blocked privilege escalation → logout → forgot/reset password.

**Make sure `npm run dev` is still running** in the first terminal.

### 9.0 Choose a testing tool
* **VS Code REST Client (easiest, works everywhere):** open `requests.http`, click **Send Request** above any block. Cookies are remembered between requests automatically. In section 9.x below, "send *Register*" means "click Send Request on the `### Register` block" (edit the email first!).
* **curl** (macOS, Linux, Windows Git Bash): shown below with a *cookie jar* file `jar.txt`, so the session persists between commands.

Use the **same address you can read mail on and that Supabase accepts** (section 7.4). Replace `YOU@example.com` below.

### 9.1 Register
```bash
$ curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"YOU@example.com","password":"Passw0rdPassw0rd","displayName":"Test User","developerRole":"frontend_developer","targetSeniority":"mid","yearsOfExperience":3,"captchaToken":"XXXX.DUMMY.TOKEN.XXXX"}'
```
Expected: `HTTP/1.1 202` and `{"data":{"message":"Check your email to confirm your account."}}`.

Then in the Supabase dashboard: **Table Editor → profiles** — a row for this user exists with `account_type = user`. The database trigger created it. 🎉

Try the mistakes too (they should fail, which is the point):
* Same request with `"accountType":"admin"` added → **400** `VALIDATION_ERROR` ("Unrecognized key").
* `"developerRole":"wizard"` → **400** `INVALID_DEVELOPER_ROLE`.
* Missing `captchaToken` → **400** `VALIDATION_ERROR`.

### 9.2 Confirm the email
Open the email, click **Confirm my email**. Your browser opens `http://localhost:3000/` (the placeholder page). In **Authentication → Users** the user now shows as confirmed.
*If the email never arrives:* section 7.4 and section 13.

### 9.3 Login (before confirming it would give 403 `EMAIL_NOT_CONFIRMED`)
```bash
$ curl -i -c jar.txt -b jar.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOU@example.com","password":"Passw0rdPassw0rd","captchaToken":"XXXX.DUMMY.TOKEN.XXXX"}'
```
Expected: `200`, `Set-Cookie: sb-…-auth-token…` headers, and a JSON profile. Wrong password → **401** `INVALID_CREDENTIALS`.

### 9.4 Read and edit your profile
```bash
$ curl -s -b jar.txt -c jar.txt http://localhost:3000/api/me

$ curl -s -b jar.txt -c jar.txt -X PATCH http://localhost:3000/api/me \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test User Renamed","developerRole":"full_stack_developer","targetSeniority":"senior","yearsOfExperience":5}'
```
Without the cookie jar: `curl -s http://localhost:3000/api/me` → **401** `UNAUTHENTICATED`.

### 9.5 Prove users cannot promote themselves
```bash
$ curl -s -b jar.txt -X PATCH http://localhost:3000/api/me \
  -H "Content-Type: application/json" -d '{"accountType":"admin"}'
```
Expected **400** (`Unrecognized key: "accountType"`). Then try the admin endpoint as a normal user:
```bash
$ curl -s -b jar.txt http://localhost:3000/api/admin/users
```
Expected **403** `ADMIN_REQUIRED`.

### 9.6 Logout
```bash
$ curl -i -b jar.txt -c jar.txt -X POST http://localhost:3000/api/auth/logout
$ curl -s -b jar.txt http://localhost:3000/api/me
```
First: `204`. Second: **401**.

### 9.7 Forgot password and reset
1. Request the email:
   ```bash
   $ curl -i -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"YOU@example.com","captchaToken":"XXXX.DUMMY.TOKEN.XXXX"}'
   ```
   Expected `202` (it returns `202` even for an unknown email, on purpose).
2. Open the email and click **Reset my password**. Your browser opens `http://localhost:3000/reset-password`, a plain **placeholder page** with one password field (the frontend team will replace it with the real design). The link also signed your **browser** in with a short-lived *recovery session*; that is why the page needs no email or token.
3. Type a new password such as `NewPassw0rd123` and click **Update password**. Expected message: `Your password has been updated.` (If you instead see an error such as "The reset link is invalid or has expired", request a new email.)
   *(Optional: this is exactly what the page does behind the scenes — it sends `POST /api/auth/reset-password` with `{ "password": "…" }`. You cannot do it from curl because the recovery session lives in the browser's cookies, not in curl's jar.)*
4. Log in again (9.3) with the new password to confirm. Using an old/used link shows `/?auth_error=invalid_or_expired_link`.

If all of 9.1–9.7 behave as described, **authentication works end to end.**

---

## 10. Create the first admin and test admin features

Nobody can make themselves an admin through the API. The first admin is created by a script that only someone holding the server secrets can run.

### 10.1 Bootstrap
Choose an email and a strong password for the admin (it can be a brand-new address — the script confirms it automatically — or the account you registered in section 9, in which case it is simply promoted):
```bash
# macOS / Linux / Git Bash
$ ADMIN_BOOTSTRAP_EMAIL="admin@example.com" ADMIN_BOOTSTRAP_PASSWORD="Chang3-this-Strong-passw0rd" npm run admin:bootstrap
```
PowerShell:
```powershell
> $env:ADMIN_BOOTSTRAP_EMAIL="admin@example.com"; $env:ADMIN_BOOTSTRAP_PASSWORD="Chang3-this-Strong-passw0rd"; npm run admin:bootstrap
```
Expected: `✔ admin@example.com is now an administrator.` Check **Table Editor → profiles** (`account_type = admin`) and **audit_logs** (`admin_bootstrapped`). Don't save this password in any file.

### 10.2 Test the admin endpoints
Log in as the admin (new cookie jar `admin-jar.txt`), then:
```bash
$ curl -s -c admin-jar.txt -b admin-jar.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Chang3-this-Strong-passw0rd","captchaToken":"XXXX.DUMMY.TOKEN.XXXX"}'

# List users (copy a user's "id" from the result)
$ curl -s -b admin-jar.txt "http://localhost:3000/api/admin/users?search=test"

# Promote a user (replace USER_ID)
$ curl -s -b admin-jar.txt -X PATCH http://localhost:3000/api/admin/users/USER_ID/account-type \
  -H "Content-Type: application/json" -d '{"accountType":"admin"}'

# Demote again
$ curl -s -b admin-jar.txt -X PATCH http://localhost:3000/api/admin/users/USER_ID/account-type \
  -H "Content-Type: application/json" -d '{"accountType":"user"}'

# Try to change yourself -> 409 CANNOT_MODIFY_SELF  (use the admin's own id)
# Delete a test user (replace USER_ID) -> 204
$ curl -i -b admin-jar.txt -X DELETE http://localhost:3000/api/admin/users/USER_ID
```
After these, **Table Editor → audit_logs** shows `account_type_changed` and `user_deleted` rows, and the deleted user is gone from both **Authentication → Users** and `profiles`.

### 10.3 Clean up
Delete the jar files (`jar.txt`, `admin-jar.txt`) — they contain live session tokens. They are in the project folder, so be careful not to commit them (`git status` before committing).

---

## 11. Working as a team

### 11.1 Daily commands
```bash
$ git pull
$ npm install        # if package.json changed
$ npm run db:migrate # if someone added a migration
$ npm run dev
```

### 11.2 Secrets
* Share keys only through a **password manager** or a secure vault — never chat, email, or Git.
* Every person has their own `.env.local`. The `.env.example` file (committed) documents the variable *names* only.
* `ADMIN_BOOTSTRAP_*` variables are only for the one-time script; don't keep them in `.env.local`.

### 11.3 Changing the database
Read `docs/ARCHITECTURE.md`, section 11. In short: new folder in `prisma/migrations/`, write the SQL, mirror it in `prisma/schema.prisma`, `npm run db:migrate`, `npm run db:generate`. **Never** run `prisma migrate dev`, `prisma db push` or `prisma db pull`. Never edit an already-applied migration.

### 11.4 Before opening a pull request
```bash
$ npm run typecheck && npm run lint && npm run build
```
All three must pass.

### 11.5 Code orientation
Start with the `README.md`, then `docs/ARCHITECTURE.md` sections 6 (structure) and 7 (a full request walkthrough).

### 11.6 Deploying later (heads-up, not needed now)
Vercel (free hobby tier) works: import the repo, add the same variables (production values), set `NEXT_PUBLIC_APP_URL` to the real URL, update Supabase **URL Configuration**, add the domain to the Turnstile widget, use a **real** Turnstile secret, and set up custom SMTP. For serverless hosting consider the Supabase *Transaction pooler* (port 6543) for `DATABASE_URL`, and test it first.

---

## 12. Optional (advanced): run Supabase locally with Docker

Skip this unless you want an offline, disposable database for experiments. You need Docker Desktop running.
```bash
$ npx supabase init
$ npx supabase start        # first run downloads several images and takes a few minutes
```
It prints local URLs and keys. Use them in a *separate* env file or by temporarily editing `.env.local`:
* `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
* publishable / secret keys: the values printed by `supabase start` (labelled *Publishable* / *Secret*, or *anon* / *service_role* on older CLI versions)
* `DATABASE_URL` and `DIRECT_URL`: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Then `npm run db:migrate` and `npm run db:verify` work the same. Local emails are caught by the **Inbucket/Mailpit** web page at <http://127.0.0.1:54324> — no email limits. Local captcha is off by default (any non-empty `captchaToken` works), and the confirm/reset email templates must be customised through `supabase/config.toml` (`[auth.email.template.*]`). Stop with `npx supabase stop`.

---

## 13. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| `npm install` fails or `node -v` is below 22 | Install Node 22+ (section 1.1), open a **new** terminal, delete `node_modules`, retry |
| `Invalid … environment variables: - NEXT_PUBLIC_SUPABASE_URL …` | `.env.local` missing, misnamed (must be exactly `.env.local`, in the project root), or a value is empty. Restart `npm run dev` after editing it |
| `P1001: Can't reach database server` | You used the *Direct connection* string on an IPv4 network, or the project is paused. Use the **Session pooler** string (section 4.3); check the dashboard for "Restore project" |
| `P1000` / `password authentication failed` | Wrong DB password, or special characters not URL-encoded (`@`→`%40`, `#`→`%23`, `/`→`%2F`, `:`→`%3A`). Easiest: reset the DB password to letters+digits (**Project Settings → Database → Reset database password**) and update `.env.local`. Also check the username is `postgres.<project-ref>` |
| `Tenant or user not found` | The pooler username/region is wrong. Re-copy the string from **Connect → Session pooler** |
| `self-signed certificate in certificate chain` | Don't add `sslmode=` to the URL; make sure you're on the latest code. If it persists, set `DATABASE_SSL_CA` to the CA certificate from **Project Settings → Database → SSL** |
| `npm run db:migrate` fails to *connect or download* (not a SQL error) | Prisma downloads a small helper program on first use, so you need normal internet access (company proxies/VPNs can block `binaries.prisma.sh`). **Fallback:** open the Supabase **SQL Editor**, paste the whole contents of `prisma/migrations/20261103000000_auth_and_profiles/migration.sql`, click **Run**, then tell Prisma it was applied: `npx prisma migrate resolve --applied 20261103000000_auth_and_profiles` |
| `npm run db:migrate` says migration failed / "already exists" | A previous run was partial or someone edited the migration. Ask a teammate before touching anything; in a throwaway dev project you may delete the tables and the `_prisma_migrations` table in the SQL editor and re-run |
| `db:verify` fails on "the app can switch to the 'authenticated' role" | Rare. In the Supabase **SQL Editor** run `GRANT authenticated, anon TO postgres;` then re-run `npm run db:verify` |
| `db:verify` fails elsewhere | The migration didn't fully apply. Run `npm run db:status`. Don't continue until all checks pass |
| Register: `Email address not authorized` / 502 | Free built-in email only sends to organization members (section 7.4). Use a member's email or configure custom SMTP |
| Register/forgot: 429 `RATE_LIMITED` | Hourly email limit hit. Wait, or use custom SMTP |
| Register: 500 "Database error saving new user" | The signup trigger rejected the metadata or the migration isn't applied. Run `npm run db:verify` |
| `CAPTCHA_FAILED` | Supabase has captcha enabled but the token is wrong. With the **test** secret use exactly `XXXX.DUMMY.TOKEN.XXXX`; with a real secret you need a fresh token from a real widget (single use) |
| Login: 403 `EMAIL_NOT_CONFIRMED` | Click the email link first |
| The email link goes to `/?auth_error=invalid_or_expired_link` | Link was already used (some mail apps pre-open links!), expired, or the template isn't the one from section 7.3. Request a new email |
| Email link opens a Supabase page or `localhost:3000` shows the wrong path | Site URL / email template not configured (sections 7.1 and 7.3) |
| 403 `BAD_ORIGIN` | `NEXT_PUBLIC_APP_URL` doesn't exactly match the address in your browser (e.g. you opened `127.0.0.1:3000` or port `3001`). Make them identical and restart |
| `/api/me` returns 401 right after login with curl | You didn't use the cookie jar on **both** requests (`-c jar.txt -b jar.txt`) |
| Port 3000 already in use | Another app uses it: stop it, or `npm run dev -- -p 3001` and update `NEXT_PUBLIC_APP_URL`, Supabase URLs and Turnstile hostnames |
| TypeScript error mentioning `@/generated/prisma/client` | Run `npm run db:generate` |
| Windows: "is not recognized" for `ADMIN_BOOTSTRAP_EMAIL=...` | Use Git Bash or the PowerShell form in section 10.1 |

Still stuck? Copy the **exact** error text (hide any keys/passwords) into the team channel with what you were doing.

---

## 14. Security checklist (everyone)

- [ ] `.env.local` is never committed (run `git status` before every commit)
- [ ] The `sb_secret_…` key and DB password exist only in `.env.local` and the team vault
- [ ] No `NEXT_PUBLIC_` variable contains a secret
- [ ] Turnstile **test** secret is only on development projects
- [ ] Jar files (`jar.txt`) deleted after testing
- [ ] The bootstrap admin uses a strong, unique password
- [ ] Production uses custom SMTP, a real Turnstile secret, and a separate Supabase project from development

*(Optional hardening later: because this app never uses Supabase's auto-generated REST "Data API", you can switch it off under **Project Settings → Data API**. The Row Level Security rules already protect it either way, so only do this after everything works.)*
