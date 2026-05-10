"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { item, member } from "@/db/schema";
import { auth } from "@/lib/auth";

export const isOrgAdmin = async (organizationId: string): Promise<boolean> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return false;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id),
        inArray(member.role, ["admin", "owner"])
      ),
    });

    return !!membership;
  } catch {
    return false;
  }
};

export const isOrgMember = async (organizationId: string): Promise<boolean> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return false;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id)
      ),
    });

    return !!membership;
  } catch {
    return false;
  }
};

export const isItemOwnerOrAdmin = async (itemId: string): Promise<boolean> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return false;
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
    });

    if (!itemRecord) {
      return false;
    }

    if (itemRecord.userId === session.user.id) {
      return true;
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, itemRecord.organizationId),
        eq(member.userId, session.user.id),
        inArray(member.role, ["admin", "owner"])
      ),
    });

    return !!membership;
  } catch {
    return false;
  }
};
