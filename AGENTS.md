# AGENTS.md

## Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm check` | Lint via ultracite (Biome) |
| `pnpm fix` | Auto-format + lint fix |
| `pnpm drizzle-kit generate` | Generate migration from schema changes |
| `pnpm drizzle-kit push` | Push schema directly (dev only) |
| `pnpm drizzle-kit migrate` | Apply pending migrations |

Pre-commit hook runs `pnpm check` — must pass before commit.

## Architecture

- **Auth**: Better Auth at `lib/auth.ts`. API route at `app/api/auth/[...all]/route.ts` (catch-all). Client at `lib/auth-client.ts`.
- **DB**: Drizzle ORM + Neon serverless PostgreSQL. Schema in `db/schema.ts`. Connection in `db/drizzle.ts` (loads `.env` via dotenv).
- **Server actions**: In `server/` dir. Pattern: `"use server"`, return `{ success, message }`, authenticate via `auth.api.getSession({ headers: await headers() })`.
- **Forms**: react-hook-form + zod + @hookform/resolvers. Components in `components/forms/`.
- **Email**: Resend. Requires `RESEND_API_KEY`, `EMAIL_SENDER_NAME`, `EMAIL_SENDER_ADDRESS`.
- **Permissions**: Defined in `lib/auth/permissions.ts` — `createAccessControl` with `project` resource. Three roles: member, admin, owner.
- **Env vars**: Listed in `env.example`. All required at runtime.

## Non-obvious details

- `requireEmailVerification: true` — new users must verify email before signing in.
- `authClient.baseURL` is hardcoded to `http://localhost:3000` in `lib/auth-client.ts:8` — update for production.
- Dynamic route params use `Promise<>` (Next.js 16): `type Params = Promise<{ slug: string }>`.
- Tailwind CSS v4 — no config file. CSS config via `@import "tailwindcss"` in `app/globals.css`.
- shadcn/ui New York style. Components in `components/ui/` are excluded from linting (see `biome.jsonc`).
- `@/` path alias maps to `./` root.
- VS Code uses Biome as formatter for JS/TS/JSON/CSS on save (see `.vscode/settings.json`).
- Organizations plugin auto-attaches `activeOrganizationId` on session create via `databaseHooks.session.create.before`.

## Initial commit

| Step | Action |
|------|--------|
| 1 | Review `.gitignore` — ensure `.env` is ignored but `.env.example` is not (default `.env*` is too broad) |
| 2 | `git add -A` |
| 3 | `git commit -m "Initial commit: set up project with auth, db, email, and ui components"` |

Best practices:
- Commit `.env.example` (template), never `.env` (secrets).
- `next-env.d.ts` is auto-generated; add to `.gitignore` so it doesn't drift from `tsconfig.json`.
- Use lowercase conventional commit messages (`feat:`, `fix:`, `chore:`, etc.).
- Verify pre-commit hook (`pnpm check`) passes before commit — the hook runs Biome lint on staged files.
- Keep the initial commit focused: lockfile (`pnpm-lock.yaml`), config files, source code, migrations, public assets. Omit generated/build artifacts.
