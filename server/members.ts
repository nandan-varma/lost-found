"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, type Role } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isOrgAdmin } from "./permissions";

export const addMember = async (
  organizationId: string,
  userId: string,
  role: Role
) => {
  try {
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });
  } catch {
    throw new Error("Failed to add member.");
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
