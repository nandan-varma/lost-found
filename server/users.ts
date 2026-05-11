"use server";

import { and, eq, ilike, inArray, not, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import type { User } from "@/db/schema";
import { member, user } from "@/db/schema";
import { getSession } from "@/lib/get-session";
import { logger } from "@/lib/logger";
import { isOrgAdmin } from "./permissions";

type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;
type CurrentUserResult = SessionData & {
  currentUser: SessionData["user"] & { image: string | null };
};

export const getCurrentUser = async (): Promise<CurrentUserResult | null> => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    ...session,
    currentUser: {
      ...session.user,
      image: session.user.image ?? null,
    },
  };
};

export const getUsers = async (
  organizationId: string,
  userId?: string
): Promise<User[]> => {
  try {
    const admin = await isOrgAdmin(organizationId, userId);

    if (!admin) {
      return [];
    }

    const session = await getSession();
    const requesterDomain = session?.user.email.split("@")[1]?.toLowerCase();

    if (!requesterDomain) {
      return [];
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });

    const users = await db.query.user.findMany({
      where: and(
        not(
          inArray(
            user.id,
            members.map((m) => m.userId)
          )
        ),
        ilike(user.email, `%@${requesterDomain}`)
      ),
    });

    return users;
  } catch (error) {
    logger.error("getUsers failed", { error, organizationId });
    return [];
  }
};

export const searchUsers = async (
  organizationId: string,
  query: string,
  userId?: string
): Promise<User[]> => {
  try {
    const admin = await isOrgAdmin(organizationId, userId);

    if (!admin) {
      return [];
    }

    const session = await getSession();
    const requesterDomain = session?.user.email.split("@")[1]?.toLowerCase();

    if (!requesterDomain) {
      return [];
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });

    const memberUserIds = members.map((m) => m.userId);

    const searchQuery = query.slice(0, 100);

    const users = await db.query.user.findMany({
      where: and(
        or(
          ilike(user.email, `%${searchQuery}%`),
          ilike(user.name, `%${searchQuery}%`)
        ),
        ilike(user.email, `%@${requesterDomain}`)
      ),
      limit: 10,
    });

    return users.filter((u) => !memberUserIds.includes(u.id));
  } catch (error) {
    logger.error("searchUsers failed", { error, organizationId });
    return [];
  }
};
