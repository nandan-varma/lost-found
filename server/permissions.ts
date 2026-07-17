"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { item, member } from "@/db/schema";
import { getSession } from "@/lib/get-session";
import { logger } from "@/lib/logger";

async function resolveUserId(userId?: string) {
  const session = await getSession();

  if (!session?.user.id) {
    return null;
  }

  if (userId && userId !== session.user.id) {
    return null;
  }

  return session.user.id;
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
    return membership.role === "admin" || membership.role === "owner";
  } catch (error) {
    logger.error("isOrgAdmin: failed", { error, organizationId, userId });
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
  } catch (error) {
    logger.error("isOrgMember: failed", { error, organizationId, userId });
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
    return membership.role === "admin" || membership.role === "owner";
  } catch (error) {
    logger.error("isItemOwnerOrAdmin: failed", { error, itemId, userId });
    return false;
  }
};
