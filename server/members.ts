"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { Resend } from "resend";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import { db } from "@/db/drizzle";
import type { Member, User } from "@/db/schema";
import { invitation, member, organization, type Role, user } from "@/db/schema";
import type { ActionResult } from "@/lib/action-response";
import { getEnv } from "@/lib/env";
import { getSession } from "@/lib/get-session";
import { logger } from "@/lib/logger";
import { isOrgAdmin } from "./permissions";

const resend = new Resend(getEnv("RESEND_API_KEY"));

export const inviteMember = async (
  organizationId: string,
  email: string,
  role: Role = "member"
): Promise<ActionResult<string>> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const allowedRoles: Role[] = ["member", "admin"];

    logger.info("inviteMember: start", {
      organizationId,
      email: normalizedEmail,
      role,
    });

    if (!allowedRoles.includes(role)) {
      logger.warn("inviteMember: invalid role", { role });
      return {
        success: false,
        error: "Invalid role for invitation",
      };
    }

    const session = await getSession();

    if (!session?.user) {
      logger.warn("inviteMember: not authenticated");
      return {
        success: false,
        error: "You must be logged in to invite members",
      };
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id),
        inArray(member.role, ["admin", "owner"])
      ),
    });

    if (!membership) {
      logger.warn("inviteMember: not authorized", {
        organizationId,
        userId: session.user.id,
      });
      return {
        success: false,
        error: "You are not allowed to invite users to this organization",
      };
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });

    if (existingUser) {
      const existingMember = await db.query.member.findFirst({
        where: and(
          eq(member.organizationId, organizationId),
          eq(member.userId, existingUser.id)
        ),
      });

      if (existingMember) {
        logger.info("inviteMember: already a member", {
          organizationId,
          email: normalizedEmail,
          existingUserId: existingUser.id,
        });
        return {
          success: false,
          error: "User is already a member of this organization",
        };
      }

      await db.insert(member).values({
        id: randomUUID(),
        organizationId,
        userId: existingUser.id,
        role,
        createdAt: new Date(),
      });

      logger.info("inviteMember: direct add success", {
        organizationId,
        userId: existingUser.id,
        role,
      });

      return {
        success: true,
        data: `${existingUser.name || normalizedEmail} added as member`,
      };
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    const invId = randomUUID();
    await db.insert(invitation).values({
      id: invId,
      email: normalizedEmail,
      organizationId,
      role,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      inviterId: session.user.id,
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${invId}`;

    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
      to: [normalizedEmail],
      subject: `You've been invited to join ${org?.name} on Lost and Found`,
      react: OrganizationInvitationEmail({
        email: normalizedEmail,
        invitedByUsername: session.user.name || "Someone",
        invitedByEmail: session.user.email || "",
        teamName: org?.name || "the organization",
        inviteLink,
      }),
    });

    if (error) {
      logger.error("inviteMember: email send failed", {
        error,
        to: normalizedEmail,
        invitationId: invId,
      });
      return {
        success: false,
        error: "Failed to send invitation email",
      };
    }

    logger.info("inviteMember: success", {
      invitationId: invId,
      emailId: data?.id,
      to: normalizedEmail,
      role,
    });

    return {
      success: true,
      data: `Invitation sent to ${normalizedEmail}`,
    };
  } catch (error) {
    logger.error("inviteMember: failed", { error, organizationId, email });
    return {
      success: false,
      error: "Failed to invite member",
    };
  }
};

export const removeMember = async (
  memberId: string
): Promise<ActionResult<null>> => {
  try {
    const session = await getSession();

    if (!session?.user) {
      logger.warn("removeMember: not authenticated", { memberId });
      return {
        success: false,
        error: "You must be logged in.",
      };
    }

    const memberRecord = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    });

    if (!memberRecord) {
      logger.info("removeMember: member not found", { memberId });
      return {
        success: false,
        error: "Member not found.",
      };
    }

    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, memberRecord.organizationId),
        eq(member.userId, session.user.id),
        inArray(member.role, ["admin", "owner"])
      ),
    });

    if (!membership) {
      logger.warn("removeMember: not authorized", {
        memberId,
        userId: session.user.id,
      });
      return {
        success: false,
        error: "You are not authorized to remove members.",
      };
    }

    if (memberRecord.role === "owner" && membership.role !== "owner") {
      logger.warn("removeMember: admin cannot remove owner", {
        memberId,
        userId: session.user.id,
      });
      return {
        success: false,
        error: "Only an owner can remove another owner.",
      };
    }

    if (memberRecord.role === "owner") {
      const owners = await db.query.member.findMany({
        where: and(
          eq(member.organizationId, memberRecord.organizationId),
          eq(member.role, "owner")
        ),
      });

      if (owners.length <= 1) {
        logger.warn("removeMember: cannot remove last owner", {
          memberId,
          organizationId: memberRecord.organizationId,
        });
        return {
          success: false,
          error: "Cannot remove the last owner of the organization.",
        };
      }
    }

    await db.delete(member).where(eq(member.id, memberId));

    logger.info("removeMember: success", {
      memberId,
      removedUserId: memberRecord.userId,
      organizationId: memberRecord.organizationId,
      removedRole: memberRecord.role,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("removeMember: failed", { error, memberId });
    return {
      success: false,
      error: "Failed to remove member.",
    };
  }
};

export const getOrganizationMembers = async (
  organizationId: string,
  userId?: string
): Promise<Array<Member & { user: User }>> => {
  try {
    const isAdmin = await isOrgAdmin(organizationId, userId);

    if (!isAdmin) {
      logger.info("getOrganizationMembers: not authorized", {
        organizationId,
        userId,
      });
      return [];
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: {
        user: true,
      },
    });

    logger.info("getOrganizationMembers: success", {
      organizationId,
      memberCount: members.length,
    });

    return members;
  } catch (error) {
    logger.error("getOrganizationMembers: failed", { error, organizationId });
    throw new Error("Failed to fetch organization members.");
  }
};
