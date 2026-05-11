"use server";

import { eq, ilike, inArray, not, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { member, user } from "@/db/schema";
import { getSession } from "@/lib/get-session";
import { isOrgAdmin } from "./permissions";

export const getCurrentUser = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return {
    ...session,
    currentUser: {
      ...session.user,
      image: session.user.image ?? null,
    },
  };
};

export const getUsers = async (organizationId: string, userId?: string) => {
  try {
    const admin = await isOrgAdmin(organizationId, userId);

    if (!admin) {
      return [];
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });

    const users = await db.query.user.findMany({
      where: not(
        inArray(
          user.id,
          members.map((m) => m.userId)
        )
      ),
    });

    return users;
  } catch {
    return [];
  }
};

export const searchUsers = async (
  organizationId: string,
  query: string,
  userId?: string
) => {
  try {
    const admin = await isOrgAdmin(organizationId, userId);

    if (!admin) {
      return [];
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });

    const memberUserIds = members.map((m) => m.userId);

    const users = await db.query.user.findMany({
      where: or(
        ilike(user.email, `%${query}%`),
        ilike(user.name, `%${query}%`)
      ),
      limit: 10,
    });

    return users.filter((u) => !memberUserIds.includes(u.id));
  } catch {
    return [];
  }
};
