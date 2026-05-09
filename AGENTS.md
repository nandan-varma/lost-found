# AGENTS.md - Lost & Found

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Dev server (Turbopack, Next.js 16) |
| `pnpm build` | Production build |
| `pnpm check` | Lint + format check via Ultracite (Biome) |
| `pnpm fix` | Auto-fix lint + format |
| `pnpm dlx drizzle-kit generate` | Generate SQL migration from schema changes |
| `pnpm dlx drizzle-kit push` | Push schema directly to DB (dev only) |
| `pnpm dlx drizzle-kit migrate` | Apply pending migrations |
| `pnpm dlx ultracite fix` | Runs in pre-commit hook on staged files |

No test suite, test command, or CI exists. Pre-commit hook only runs `ultracite fix` on staged files.

## Paths & Aliases

- `@/*` maps to project root (not `src/`)
- shadcn/ui components: `@/components/ui/`
- Server actions: `server/` (not `app/`)

## Lint/Format (Ultracite)

- Uses `ultracite` CLI wrapping Biome 2.4.14
- Config extends `ultracite/biome/core`, `ultracite/biome/next`, `ultracite/biome/react`
- Excluded from checks: `public/`, `components/ui/`, `hooks/use-mobile.ts`, `lib/utils.ts`

Do NOT modify files in `components/ui/` by hand — they are shadcn registry components (56 files). Re-generate with `pnpm dlx shadcn@latest add <component>`.

## Auth

- **Better Auth** v1.6.9 with organizations plugin, email/password, RBAC
- Auth handler at `app/api/auth/[...all]/route.ts`
- Dashboard routes protected by `proxy.ts` (auth middleware, not `middleware.ts`)
- Auth config: `lib/auth.ts` (server), `lib/auth-client.ts` (client)
- Permissions/roles defined in `lib/auth/permissions.ts`
- Users auto-join orgs when their email domain matches org domain

## Database

- PostgreSQL via Neon serverless + Drizzle ORM
- Schema: `db/schema.ts` (9 tables), exports as `schema` object
- Migrations in `migrations/` (3 migrations so far)
- Both `drizzle.config.ts` and `db/drizzle.ts` explicitly load `.env` via `dotenv.config()`
- Drizzle Kit commands need `.env` present with `DATABASE_URL`

## File Storage

- Cloudflare R2 (S3-compatible) via `@aws-sdk/client-s3`
- R2 client in `lib/r2.ts`
- Images are uploaded as FormData to server actions (not API routes)
- Server action body size limit: 50mb (in `next.config.ts`)
- Public images URL: `https://lost-and-found-images.nandanvarma.com`

## Tech Stack

- Next.js 16 + App Router + Turbopack
- React 19, TypeScript 6 (strict), Tailwind CSS v4, shadcn/ui (new-york, stone)
- `react-hook-form` + `zod` for forms
- Resend + React Email for transactional emails
- Lucide icons, Recharts 3.8.1 for charts
