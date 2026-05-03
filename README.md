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

Supabase / Vercel setup

1. Create a Supabase project.
2. Copy the Postgres connection string from Supabase.
3. In Vercel project settings, add one of these connection sources:
   - DATABASE_URL=your_supabase_postgres_connection_string
   - or SUPABASE_POOLER_URL=your_supabase_session_pooler_connection_string
   - optionally set SUPABASE_PREFER_POOLER=true to prefer the pooler when both are present
   - DATABASE_DIALECT=postgres
   - DB_AUTO_BOOTSTRAP=false
4. From a machine with access to the same env vars, run:

npm run db:push
npm run db:seed   # only if the database is brand new / empty

Notes:
- DATABASE_URL should be a server-only connection string, not a public anon key.
- For WSL, prefer the Supabase pooler URL if the direct host is IPv6-only or unreachable.
- SUPABASE_PREFER_POOLER=true makes the app and drizzle config prefer SUPABASE_POOLER_URL/SUPABASE_POOLER_CONNECTION_STRING before direct Supabase URLs.
- For hosted Postgres, SSL defaults to required.
- The app uses postgres-js with prepared statements disabled, which is safer for serverless/pooling setups.

Environment variables

Required for local SQLite:
- DATABASE_DIALECT=sqlite
- DATABASE_PATH=./data/protocols.db

Required for Supabase Postgres:
- DATABASE_DIALECT=postgres
- DATABASE_URL=postgres connection string from Supabase

Optional:
- DB_AUTO_BOOTSTRAP=true|false
- POSTGRES_SSL=require|disable
- POSTGRES_MAX_CONNECTIONS=1
- SUPABASE_PREFER_POOLER=true|false
- SUPABASE_POOLER_URL=postgres connection string from Supabase session pooler
- SUPABASE_POOLER_CONNECTION_STRING=alternate name for the pooler URL
- SUPABASE_DIRECT_URL=optional direct Supabase host fallback

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
