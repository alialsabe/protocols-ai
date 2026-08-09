Stack Lab

Next.js 16 + TypeScript app with Drizzle ORM. Evidence-graded supplement reference, stack auditing, and bloodwork analysis.

Database modes

This repo now supports two runtime database paths:

1. SQLite for local development
2. Postgres for Vercel/Supabase deployment

The app auto-selects Postgres when DATABASE_URL is set, when DATABASE_DIALECT=postgres, or when a Supabase-specific URL is provided.
Otherwise it stays on the current local SQLite path.

Why this change

The previous setup assumed a writable local database file in production. That is not safe on Vercel serverless deployments. The app now has a Postgres-ready path suitable for Supabase while keeping SQLite for local dev.

Quick start

1. Install dependencies

npm install

2. Copy envs

cp .env.example .env.local

3. Run locally with SQLite

npm run dev

Optional local database maintenance:

npm run db:push
npm run db:seed   # bootstrap schema/data if the database is empty
npm run db:reset  # wipe and reseed from the canonical dataset

Neon / Vercel setup

The production database is Neon Postgres. (Supabase is still used for Auth only — login/signup/session — not for data.)

1. Create a Neon project and copy the pooled connection string.
2. In Vercel project settings, add:
   - DATABASE_URL=your_neon_pooled_connection_string
   - DATABASE_DIALECT=postgres
   - DB_AUTO_BOOTSTRAP=false
   - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (auth only)
3. From a machine with access to the same env vars, run:

npm run db:push
npm run db:seed   # only if the database is brand new / empty

Migrating data from Supabase to Neon (one-shot):

1. Put the Neon connection string in .env.local as NEON_DATABASE_URL=...
2. npx tsx scripts/migrate-to-neon.ts          # dry run, prints row counts
3. npx tsx scripts/migrate-to-neon.ts --write  # copies all public tables (FK-safe order, ON CONFLICT DO NOTHING)

Notes:
- DATABASE_URL should be a server-only connection string, not a public anon key.
- For hosted Postgres, SSL defaults to required.
- The app uses postgres-js with prepared statements disabled, which works with Neon's pooled connections and serverless driver model.

Environment variables

Required for local SQLite:
- DATABASE_DIALECT=sqlite
- DATABASE_PATH=./data/protocols.db

Required for Neon Postgres:
- DATABASE_DIALECT=postgres
- DATABASE_URL=postgres connection string from Neon

Required for auth (Supabase Auth, free tier):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

Optional:
- DB_AUTO_BOOTSTRAP=true|false
- POSTGRES_SSL=require|disable
- POSTGRES_MAX_CONNECTIONS=1
- NEON_DATABASE_URL=used by scripts/migrate-to-neon.ts as the migration target
- SUPABASE_POOLER_URL=legacy fallback connection URL (checked before DATABASE_URL)

Scripts

- npm run dev
- npm run build
- npm run lint
- npm run db:push
- npm run db:seed
- npm run db:reset

Behavior notes

- SQLite still auto-creates tables and seeds data when needed.
- `npm run build` is now non-destructive: it only applies schema changes and runs `next build`.
- `npm run db:seed` bootstraps an empty database without wiping existing data.
- `npm run db:reset` is the explicit destructive reseed path for local/dev use only.
- Admin fallback-queue APIs now work without SQLite-specific raw queries.

Deployment recommendation

Use GitHub -> Vercel deployment. Do not rely on a local SQLite file in production. Run `npm run db:push` during deployment and only use `npm run db:seed` when intentionally initializing a brand-new database.

Security note

Do not expose DATABASE_URL to the client. It must remain a server-only environment variable in Vercel.
