# Lost & Found

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Prod build (includes typecheck) |
| `pnpm check` | Lint + format check (Ultracite/Biome) |
| `pnpm fix` | Auto-fix lint + format |

No test framework or CI. Pre-commit hook runs `ultracite fix` on staged files (Husky).

## Paths

`@/*` = project root (no `src/`). All server actions in `server/` (not `app/`).

## DB (Drizzle + Neon PostgreSQL)

- `db/schema.ts` — 9 tables, exported as `schema` object
- `db/drizzle.ts` — DB client, loads `.env` explicitly via dotenv
- `drizzle.config.ts` — Kit config, also loads `.env` explicitly (needed for CLI outside Next.js)
- `pnpm dlx drizzle-kit generate` — create migration from schema changes
- `pnpm dlx drizzle-kit migrate` — apply migrations
- `pnpm dlx drizzle-kit push` — push schema directly (dev only)

## Auth (Better Auth v1.6.9)

- Server config: `lib/auth.ts` — Microsoft Entra SSO, organizations plugin, Resend email
- Client: `lib/auth-client.ts`
- Middleware: `proxy.ts` (not `middleware.ts`) — protects `/dashboard/*`
- Auth handler: `app/api/auth/[...all]/route.ts`
- Roles: `owner`, `admin`, `member` defined in `lib/auth/permissions.ts`
- Auto-join: users auto-join org when email domain matches org domain (via `databaseHooks.user.create.after`)
- Feature flag: `FEATURE_FLAG_CREATE_ORGANIZATION` must be `"true"` to allow org creation

## Server Actions

All in `server/`. Convention: return `{ success: true/false, data?, error? }`.  
Session checks use `auth.api.getSession({ headers: await headers() })` in each action.

## Forms

Complex forms: `react-hook-form` + `@hookform/resolvers/zod` + shadcn `<Form>` wrapper.  
Simple forms: native `<form>` + `useState`.  
No global state management (no Zustand/Redux). Data flow: server component fetch → props → client mutations via server action → `router.refresh()`.

## Files Not to Edit

`components/ui/` — shadcn registry (56 files). Re-generate with `pnpm dlx shadcn@latest add <component>`.

## Files Excluded from Lint

`public/`, `components/ui/`, `hooks/use-mobile.ts`, `lib/utils.ts` (configured in `biome.jsonc`).

## Env

Template at `env.example`. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, R2 config, Microsoft Entra credentials, Resend API key.

## Image Storage

Cloudflare R2 via `@aws-sdk/client-s3` (`lib/r2.ts`). Uploaded as FormData to server actions. 50MB body limit in `next.config.ts`.
