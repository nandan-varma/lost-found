"use server";

import { eq, inArray, not } from "drizzle-orm";
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
