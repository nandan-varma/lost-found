"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { item, member } from "@/db/schema";
import { admin, member as memberRole, owner } from "@/lib/auth/permissions";
import { getSession } from "@/lib/get-session";

const roleMap = { member: memberRole, admin, owner } as const;

function hasPermission(
  role: string,
  resource: string,
  action: string
): boolean {
  const roleObj = roleMap[role as keyof typeof roleMap];
  if (!roleObj) {
    return false;
  }
  return roleObj.authorize({ [resource]: [action] }).success;
}

async function resolveUserId(userId?: string) {
  if (userId) {
    return userId;
  }

  const session = await getSession();
  return session?.user.id ?? null;
}

export const isOrgAdmin = async (
  organizationId: string,
  userId?: string
): Promise<boolean> => {
  try {
    const resolvedUserId = await resolveUserId(userId);
    if (!resolvedUserId) {
      return false;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, resolvedUserId)
      ),
    });

    if (!membership) {
      return false;
    }
    return hasPermission(membership.role, "item", "update");
  } catch {
    return false;
  }
};

export const isOrgMember = async (
  organizationId: string,
  userId?: string
): Promise<boolean> => {
  try {
    const resolvedUserId = await resolveUserId(userId);
    if (!resolvedUserId) {
      return false;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, resolvedUserId)
      ),
    });

    return !!membership;
  } catch {
    return false;
  }
};

export const isItemOwnerOrAdmin = async (
  itemId: string,
  userId?: string,
  itemRecord?: typeof item.$inferSelect
): Promise<boolean> => {
  try {
    const resolvedUserId = await resolveUserId(userId);
    if (!resolvedUserId) {
      return false;
    }

    const resolvedItemRecord =
      itemRecord ??
      (await db.query.item.findFirst({
        where: eq(item.id, itemId),
      }));

    if (!resolvedItemRecord) {
      return false;
    }

    if (resolvedItemRecord.userId === resolvedUserId) {
      return true;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, resolvedItemRecord.organizationId),
        eq(member.userId, resolvedUserId)
      ),
    });

    if (!membership) {
      return false;
    }
    return hasPermission(membership.role, "item", "update");
  } catch {
    return false;
  }
};
