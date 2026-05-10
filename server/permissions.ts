"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { item, member } from "@/db/schema";
import { auth } from "@/lib/auth";

export const isOrgAdmin = async (
  organizationId: string,
  userId?: string
): Promise<boolean> => {
  try {
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return false;
      }

      resolvedUserId = session.user.id;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, resolvedUserId),
        inArray(member.role, ["admin", "owner"])
      ),
    });

    return !!membership;
  } catch {
    return false;
  }
};

export const isOrgMember = async (
  organizationId: string,
  userId?: string
): Promise<boolean> => {
  try {
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return false;
      }

      resolvedUserId = session.user.id;
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
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return false;
      }

      resolvedUserId = session.user.id;
    }

    let resolvedItemRecord = itemRecord;

    if (!resolvedItemRecord) {
      resolvedItemRecord = await db.query.item.findFirst({
        where: eq(item.id, itemId),
      });
    }

    if (!resolvedItemRecord) {
      return false;
    }

    if (resolvedItemRecord.userId === resolvedUserId) {
      return true;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, resolvedItemRecord.organizationId),
        eq(member.userId, resolvedUserId),
        inArray(member.role, ["admin", "owner"])
      ),
    });

    return !!membership;
  } catch {
    return false;
  }
};
