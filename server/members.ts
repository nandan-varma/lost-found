"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, type Role, user } from "@/db/schema";
import { isOrgAdmin } from "./permissions";

export const inviteMember = async (
  organizationId: string,
  email: string,
  role: Role = "member"
) => {
  try {
    const session = await import("@/lib/get-session").then((m) =>
      m.getSession()
    );

    if (!session?.user?.id) {
      throw new Error("You must be logged in to invite members");
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id),
        inArray(member.role, ["admin", "owner"])
      ),
    });

    if (!membership) {
      throw new Error(
        "You are not allowed to invite users to this organization"
      );
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      const existingMember = await db.query.member.findFirst({
        where: and(
          eq(member.organizationId, organizationId),
          eq(member.userId, existingUser.id)
        ),
      });

      if (existingMember) {
        throw new Error("User is already a member of this organization");
      }

      await db.insert(member).values({
        id: randomUUID(),
        organizationId,
        userId: existingUser.id,
        role,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: `${existingUser.name || email} added as member`,
      };
    }

    return {
      success: false,
      error:
        "User not found. They must sign up first or use a domain that matches this organization.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite member",
    };
  }
};

export const removeMember = async (memberId: string) => {
  try {
    const memberRecord = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    });

    if (!memberRecord) {
      return {
        success: false,
        error: "Member not found.",
      };
    }

    const admin = await isOrgAdmin(memberRecord.organizationId);

    if (!admin) {
      return {
        success: false,
        error: "You are not authorized to remove members.",
      };
    }

    await db.delete(member).where(eq(member.id, memberId));

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "Failed to remove member.",
    };
  }
};

export const getOrganizationMembers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: {
        user: true,
      },
    });

    return members;
  } catch {
    throw new Error("Failed to fetch organization members.");
  }
};
