# Lost and Found — Implementation Plan

## Overview

Transform the Better Auth starter into a scoped Lost & Found application for organizations (educational institutions). Users within an organization can post lost/found items with title, description, and photos. Images stored in Cloudflare R2.

---

## Phase 0: Dependencies & Configuration

### 0.1 Install packages
- `pnpm add @aws-sdk/client-s3` — S3-compatible R2 client
- ID generation uses `import { randomUUID } from "node:crypto"` (explicit import for compatibility across Node.js versions) — no extra dependency needed

### 0.2 Verify .env has R2 vars
- [ ] `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_REGION`

---

## Phase 1: R2 Utility (`lib/r2.ts`)

Create an S3 client configured for Cloudflare R2. Server-only module.

### 1.1 Create S3 client
- [ ] Add `import "server-only"` at the top to prevent accidental client-side import
- [ ] Initialize `S3Client` with:
  - `region`: `"auto"`
  - `endpoint`: from env
  - `credentials`: access key ID + secret access key
  - `forcePathStyle: true` (R2 requires this)
- [ ] Export the client instance

### 1.2 Upload function
- [ ] `async uploadFile(file: File, folder: string): Promise<{ url: string; key: string }>`
- [ ] Validate file is an image (check MIME type starts with `image/`)
- [ ] Validate file size ≤ 10 MB
- [ ] Generate key: `items/<uuid>-<sanitized-filename>`
- [ ] Use `PutObjectCommand` with content-type; skip ACL (R2 doesn't support public-read ACL — use public bucket or presigned URLs)
- [ ] Return public URL + key

### 1.3 Delete function
- [ ] `async deleteFile(key: string): Promise<void>`
- [ ] Use `DeleteObjectCommand`

---

## Phase 2: Database Schema (`db/schema.ts`)

### 2.1 Add item status enum
- [ ] `export const itemStatus = pgEnum("item_status", ["lost", "found", "claimed", "closed"])`
- [ ] Export `type ItemStatus`

### 2.2 Add `item` table
- [ ] `id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID())`
- [ ] `organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" })`
- [ ] `userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })`
- [ ] `title: text("title").notNull()`
- [ ] `description: text("description").notNull()`
- [ ] `status: itemStatus("status").default("lost").notNull()`
- [ ] `createdAt` with `$defaultFn(() => /* @__PURE__ */ new Date())`
- [ ] `updatedAt` with `$defaultFn(() => /* @__PURE__ */ new Date())` — note: only set on insert. `updateItemStatus` and `claimItem` must manually set `updatedAt` since Drizzle has no `onUpdate` hook.

### 2.3 Add `itemImage` table
- [ ] `id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID())`
- [ ] `itemId: text("item_id").notNull().references(() => item.id, { onDelete: "cascade" })`
- [ ] `url: text("url").notNull()`
- [ ] `key: text("key").notNull()`
- [ ] `createdAt` with `$defaultFn(() => /* @__PURE__ */ new Date())`

### 2.4 Add `claim` table
Stores claimant contact info when someone claims a found item. Enables the poster to see who claimed it.

- [ ] `id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID())`
- [ ] `itemId: text("item_id").notNull().unique().references(() => item.id, { onDelete: "cascade" })`
- [ ] `claimantName: text("claimant_name").notNull()`
- [ ] `claimantEmail: text("claimant_email").notNull()`
- [ ] `message: text("message")`
- [ ] `createdAt` with `$defaultFn(() => /* @__PURE__ */ new Date())`

### 2.5 Add relations
- [ ] `itemRelations`: organization (one), user (one), images (many), claim (one)
- [ ] `itemImageRelations`: item (one)
- [ ] `claimRelations`: item (one)
- [ ] Update existing `organizationRelations` to add `items: many(item)` (needed for bidirectional queries)
- [ ] Export `type Item`, `type ItemImage`, `type Claim`

### 2.6 Update schema export
- [ ] Add `item`, `itemImage`, `claim`, `itemRelations`, `itemImageRelations`, `claimRelations` to the `schema` object

### 2.7 Generate migration
- [ ] `pnpm drizzle-kit generate`
- [ ] Apply with `pnpm drizzle-kit push` (dev)

---

## Phase 3: Permissions (`lib/auth/permissions.ts`)

### 3.1 Add `item` resource to permission statement
Keep existing `project` resource unchanged (still used by starter scaffolding). Add `item` alongside it.

```ts
const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
  item: ["create", "read", "update", "delete", "claim"],
} as const;
```

### 3.2 Assign to roles
- **member**: `item: ["create", "read", "claim"]` (keep existing `project: ["create"]`)
- **admin**: `item: ["create", "read", "update", "delete", "claim"]` (keep existing `project: ["create", "update"]`)
- **owner**: all item permissions (keep existing `project` + `organization` permissions)

---

## Phase 4: Server Actions

### 4.1 `server/items.ts` (new file)
- [ ] `getItems(organizationId: string, status?: ItemStatus)` — fetch items scoped to org, with images, ordered by newest first. Must verify caller is org member.
- [ ] `getItem(itemId: string)` — fetch single item with images + poster info + claim info (if viewer is poster/admin). Must verify caller is org member.
- [ ] `createItem(formData: FormData)` — extract `title`, `description`, `status` and images from FormData. Validate with Zod (parse serialized fields), enforce max 5 images server-side, upload images to R2, insert item + images in a transaction. Must be org member. Images must be passed via FormData (`formData.getAll("images")`) since server actions can't receive `File` objects as direct JS arguments.
- [ ] `updateItemStatus(itemId: string, status: ItemStatus)` — validate caller is poster or admin. Used for "Mark as Closed". NOT used for claiming (see `claimItem` below).
- [ ] `claimItem(itemId: string, data: { claimantName, claimantEmail, message? })` — validate item is "found" and caller is not poster. Insert claim record + change status to "claimed". Must be org member.
- [ ] `deleteItem(itemId: string)` — delete item + its R2 images + claim + DB records. Only poster or admin.

### 4.2 `server/permissions.ts` (existing — enhance)
- [ ] **Fix existing `isAdmin()` return type inconsistency**: it returns `boolean | { success: false, error }`. Refactor to consistently return `{ success: boolean, error?: string }` or always return `boolean`.
- [ ] Add `isOrgMember(orgId: string): Promise<boolean>` helper — query `member` table directly via Drizzle (check `session.user.id` has a member row for the org)
- [ ] Add `isItemOwnerOrAdmin(itemId: string): Promise<boolean>` helper — check session user is the item's `userId` or has admin role in the item's org

---

## Phase 5: Validation (`lib/validations.ts`)

### 5.1 Shared Zod schemas
- [ ] `createItemSchema`: title (min 3, max 100), description (min 10, max 2000), status (enum lost/found)
- [ ] `claimItemSchema`: claimantName (min 2, max 100), claimantEmail (email), message (optional, max 500)
- [ ] File validation: max 5 images, each max 10MB, image/* only

---

## Phase 6: UI Components

### 6.1 `components/items/status-badge.tsx`
- [ ] Server component rendering colored badge: Lost (red/destructive), Found (green/success), Claimed (blue/primary), Closed (gray/secondary)
- [ ] Uses `cva` or simple className mapping

### 6.2 `components/items/item-card.tsx`
- [ ] Server component: card with first image thumbnail, title, status badge, relative time ago, poster name
- [ ] Links to item detail page

### 6.3 `components/items/item-list.tsx`
- [ ] Server component: grid of item-cards with empty state
- [ ] Filter tabs: All / Lost / Found (status query param)

### 6.4 `components/items/item-detail.tsx`
- [ ] Server component: image gallery (first image large, rest as thumbnails), title, description, status badge, poster info, date
- [ ] Conditional: show "Claim This Item" button if status is "found" and viewer is not poster
- [ ] Show "Mark as Closed" button if viewer is poster or admin and item is not already closed
- [ ] If viewer is poster/admin and status is "claimed": show claimant info (name, email, message, date)
- [ ] If item is claimed: show "Claimed by <name> on <date>" notice

### 6.5 `components/items/image-gallery.tsx`
- [ ] Client component: click thumbnails to switch main image, optional lightbox

### 6.6 `components/items/claim-form.tsx`
- [ ] Client component: form with name, email, message fields
- [ ] Calls `claimItem` server action on submit
- [ ] Shows success toast + refreshes / redirects to item detail

### 6.7 `components/forms/post-item-form.tsx`
- [ ] Client component: react-hook-form + Zod resolver
- [ ] Fields: title (input), description (textarea), status (toggle/pill: Lost / Found), images (file input with drag-drop, preview thumbnails, max 5)
- [ ] Submit: calls `createItem` server action, on success redirect to item detail
- [ ] Loading state with spinner
- [ ] Error state per-field and toast

---

## Phase 7: Pages & Routes

### 7.1 Landing page (`app/page.tsx`)
- [ ] Rebrand: change title, description, image to Lost and Found branding
- [ ] Keep existing auth buttons and theme switcher

### 7.2 Org dashboard — Items tab (`app/dashboard/organization/[slug]/page.tsx`)
- [ ] Replace existing direct children with `<ItemList>` component (items are the default tab)
- [ ] Read `?status=lost|found` query param for filter

### 7.3 Org layout (`app/dashboard/organization/[slug]/layout.tsx`)
- [ ] NEW file: shared layout for all org sub-pages (server component)
- [ ] Org name header at top
- [ ] Create a client sub-component `components/items/org-nav.tsx` for tab navigation (Items | Post Item | Members) — `usePathname()` requires client component
- [ ] Active tab styling via `usePathname()` in the client sub-component
- [ ] Default tab ("Items") renders the item list from `page.tsx`

### 7.4 Post item page (`app/dashboard/organization/[slug]/post/page.tsx`)
- [ ] Renders `<PostItemForm>`
- [ ] Redirects to `/dashboard/organization/[slug]` if user is not an org member

### 7.5 Item detail page (`app/dashboard/organization/[slug]/items/[itemId]/page.tsx`)
- [ ] Renders `<ItemDetail>`
- [ ] 404 if item not found or not in this org

### 7.6 Members page (`app/dashboard/organization/[slug]/members/page.tsx`)
- [ ] Move `<MembersTable>` + `<AllUsers>` from `[slug]/page.tsx` here (entire member management UI)
- [ ] Admin-only access check (members can view, only admin/owner can invite/remove)
- [ ] `[slug]/page.tsx` no longer renders member management

### 7.7 Update middleware (`middleware.ts`)
- [ ] **Fix** `middleware.ts` matcher from `["/dashboard"]` to `["/dashboard/:path*"]` — the current config only matches the exact `/dashboard` path, leaving `/dashboard/organization/[slug]/...` unprotected.

---

## Phase 8: Environment

### 8.1 Update `env.example`
- [ ] Already has R2 fields.
- [ ] Add `NEXT_PUBLIC_APP_URL` — already required by `lib/auth.ts` for invitation email links, but missing from `env.example`.

### 8.2 `.gitignore` — verification only
- [ ] Confirm `.env` and `.env*.local` are ignored (already correct — no `.env*` catch-all)
- [ ] Confirm `.env.example` is NOT ignored (already correct)

---

## Phase 9: Lint & Verify

- [ ] `pnpm check` passes with no errors
- [ ] `pnpm build` succeeds

---

## File Inventory (New & Modified)

### New files
```
lib/r2.ts
lib/validations.ts
server/items.ts
components/items/status-badge.tsx
components/items/item-card.tsx
components/items/item-list.tsx
components/items/item-detail.tsx
components/items/image-gallery.tsx
components/items/claim-form.tsx
components/items/org-nav.tsx
components/forms/post-item-form.tsx
app/dashboard/organization/[slug]/layout.tsx
app/dashboard/organization/[slug]/post/page.tsx
app/dashboard/organization/[slug]/items/[itemId]/page.tsx
app/dashboard/organization/[slug]/members/page.tsx
```

### Modified files
```
db/schema.ts
lib/auth/permissions.ts
server/permissions.ts
app/page.tsx
app/dashboard/organization/[slug]/page.tsx
.env.example
```

---

## User Flows Summary

### Post a Lost/Found Item
`/login` → `/dashboard` → select org → `/dashboard/org/[slug]/post` → fill form, upload images → submit → `/dashboard/org/[slug]/items/[itemId]`

### Browse Items
`/dashboard/org/[slug]` → filter Lost/Found/All → click item card → detail view

### Claim a Found Item
Browse to a Found item → "Claim This Item" button → fill contact form → submit → status changes to `claimed` → poster sees claimant info on detail page

### Close an Item
Visit own item or admin → "Mark as Closed" → status → `closed` → hidden from default filters

### View Claimant Info
Poster or admin visits their claimed item detail page → sees claimant name, email, message, and claim date
