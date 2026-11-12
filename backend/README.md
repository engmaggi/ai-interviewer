# Orbit — Backend (Auth & User Management)

Next.js (App Router) + TypeScript + Supabase (Postgres, Auth, RLS) + Prisma + Zod, organised as a modular monolith.

| Read this | When |
|---|---|
| [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) | You are setting up your machine / Supabase for the first time |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | You want to understand how it works, the API, or add a feature |

## Quick start (after the one-time setup)

```bash
npm install            # also generates the Prisma client
npm run db:migrate     # applies SQL migrations to your Supabase database
npm run db:verify      # checks tables + security rules
npm run dev            # http://localhost:3000  (try /api/health)
```

## API documentation (Swagger)

With `npm run dev` running, open **<http://localhost:3000/api/docs>** for every endpoint, its success response and all its error responses. The raw OpenAPI file is at `/api/openapi.json`. See `docs/ARCHITECTURE.md`, section 9.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / run |
| `npm run typecheck` | TypeScript check, no output files |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply new SQL migrations (`prisma migrate deploy`) |
| `npm run db:status` | Show which migrations are applied |
| `npm run db:generate` | Regenerate the typed Prisma client (after editing `schema.prisma`) |
| `npm run db:verify` | Sanity-check the database and its security rules |
| `npm run admin:bootstrap` | Create / promote the first administrator |

**Never** run `prisma migrate dev`, `prisma db push` or `prisma db pull` in this project — see the Architecture doc, section "Database migrations".
