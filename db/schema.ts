import { randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  id: text("id").primaryKey(),
  image: text("image"),
  name: text("name").notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    activeOrganizationId: text("active_organization_id"),
    createdAt: timestamp("created_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    ipAddress: text("ip_address"),
    token: text("token").notNull().unique(),
    updatedAt: timestamp("updated_at").notNull(),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at").notNull(),
    id: text("id").primaryKey(),
    idToken: text("id_token"),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    updatedAt: timestamp("updated_at").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    createdAt: timestamp("created_at").$defaultFn(
      () => /* @__PURE__ */ new Date()
    ),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(
      () => /* @__PURE__ */ new Date()
    ),
    value: text("value").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const organization = pgTable("organization", {
  createdAt: timestamp("created_at").notNull(),
  domain: text("domain").unique(),
  id: text("id").primaryKey(),
  logo: text("logo"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const organizationRelations = relations(organization, ({ many }) => ({
  items: many(item),
  members: many(member),
}));

export type Organization = typeof organization.$inferSelect;

export const role = pgEnum("role", ["member", "admin", "owner"]);

export type Role = (typeof role.enumValues)[number];

export const itemStatus = pgEnum("item_status", [
  "lost",
  "found",
  "claimed",
  "closed",
]);

export type ItemStatus = (typeof itemStatus.enumValues)[number];

export const item = pgTable(
  "item",
  {
    createdAt: timestamp("created_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    description: text("description").notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => /* @__PURE__ */ randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    status: itemStatus("status").default("lost").notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("item_organizationId_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("item_userId_idx").on(table.userId),
    index("item_createdAt_idx").on(table.createdAt),
  ]
);

export const itemRelations = relations(item, ({ one, many }) => ({
  claim: one(claim),
  images: many(itemImage),
  organization: one(organization, {
    fields: [item.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [item.userId],
    references: [user.id],
  }),
}));

export type Item = typeof item.$inferSelect;

export const itemImage = pgTable(
  "item_image",
  {
    createdAt: timestamp("created_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => /* @__PURE__ */ randomUUID()),
    itemId: text("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    url: text("url").notNull(),
  },
  (table) => [index("item_image_itemId_idx").on(table.itemId)]
);

export const itemImageRelations = relations(itemImage, ({ one }) => ({
  item: one(item, {
    fields: [itemImage.itemId],
    references: [item.id],
  }),
}));

export type ItemImage = typeof itemImage.$inferSelect;

export const claim = pgTable("claim", {
  claimantEmail: text("claimant_email").notNull(),
  claimantName: text("claimant_name").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => /* @__PURE__ */ randomUUID()),
  itemId: text("item_id")
    .notNull()
    .unique()
    .references(() => item.id, { onDelete: "cascade" }),
  message: text("message"),
});

export const claimRelations = relations(claim, ({ one }) => ({
  item: one(item, {
    fields: [claim.itemId],
    references: [item.id],
  }),
}));

export type Claim = typeof claim.$inferSelect;

export const member = pgTable(
  "member",
  {
    createdAt: timestamp("created_at").notNull(),
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: role("role").default("member").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
    uniqueIndex("member_organizationId_userId_unique").on(
      table.organizationId,
      table.userId
    ),
  ]
);

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export type Member = typeof member.$inferSelect & {
  user?: typeof user.$inferSelect;
};

export type User = typeof user.$inferSelect;

export const invitation = pgTable(
  "invitation",
  {
    createdAt: timestamp("created_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    email: text("email").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role"),
    status: text("status").default("pending").notNull(),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ]
);

export const schema = {
  account,
  claim,
  claimRelations,
  invitation,
  item,
  itemImage,
  itemImageRelations,
  itemRelations,
  member,
  memberRelations,
  organization,
  organizationRelations,
  session,
  user,
  verification,
};
