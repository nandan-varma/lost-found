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
      email: normalizedEmail,
      organizationId,
      role,
    });

    if (!allowedRoles.includes(role)) {
      logger.warn("inviteMember: invalid role", { role });
      return {
        error: "Invalid role for invitation",
        success: false,
      };
    }

    const session = await getSession();

    if (!session?.user) {
      logger.warn("inviteMember: not authenticated");
      return {
        error: "You must be logged in to invite members",
        success: false,
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
        error: "You are not allowed to invite users to this organization",
        success: false,
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
          email: normalizedEmail,
          existingUserId: existingUser.id,
          organizationId,
        });
        return {
          error: "User is already a member of this organization",
          success: false,
        };
      }

      await db.insert(member).values({
        createdAt: new Date(),
        id: randomUUID(),
        organizationId,
        role,
        userId: existingUser.id,
      });

      logger.info("inviteMember: direct add success", {
        organizationId,
        role,
        userId: existingUser.id,
      });

      return {
        data: `${existingUser.name || normalizedEmail} added as member`,
        success: true,
      };
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    const invId = randomUUID();
    await db.insert(invitation).values({
      email: normalizedEmail,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      id: invId,
      inviterId: session.user.id,
      organizationId,
      role,
      status: "pending",
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${invId}`;

    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
      react: OrganizationInvitationEmail({
        email: normalizedEmail,
        invitedByEmail: session.user.email || "",
        invitedByUsername: session.user.name || "Someone",
        inviteLink,
        teamName: org?.name || "the organization",
      }),
      subject: `You've been invited to join ${org?.name} on Lost and Found`,
      to: [normalizedEmail],
    });

    if (error) {
      logger.error("inviteMember: email send failed", {
        error,
        invitationId: invId,
        to: normalizedEmail,
      });
      return {
        error: "Failed to send invitation email",
        success: false,
      };
    }

    logger.info("inviteMember: success", {
      emailId: data?.id,
      invitationId: invId,
      role,
      to: normalizedEmail,
    });

    return {
      data: `Invitation sent to ${normalizedEmail}`,
      success: true,
    };
  } catch (error) {
    logger.error("inviteMember: failed", { email, error, organizationId });
    return {
      error: "Failed to invite member",
      success: false,
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
        error: "You must be logged in.",
        success: false,
      };
    }

    const memberRecord = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    });

    if (!memberRecord) {
      logger.info("removeMember: member not found", { memberId });
      return {
        error: "Member not found.",
        success: false,
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
        error: "You are not authorized to remove members.",
        success: false,
      };
    }

    if (memberRecord.role === "owner" && membership.role !== "owner") {
      logger.warn("removeMember: admin cannot remove owner", {
        memberId,
        userId: session.user.id,
      });
      return {
        error: "Only an owner can remove another owner.",
        success: false,
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
          error: "Cannot remove the last owner of the organization.",
          success: false,
        };
      }
    }

    await db.delete(member).where(eq(member.id, memberId));

    logger.info("removeMember: success", {
      memberId,
      organizationId: memberRecord.organizationId,
      removedRole: memberRecord.role,
      removedUserId: memberRecord.userId,
    });

    return {
      data: null,
      success: true,
    };
  } catch (error) {
    logger.error("removeMember: failed", { error, memberId });
    return {
      error: "Failed to remove member.",
      success: false,
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
      memberCount: members.length,
      organizationId,
    });

    return members;
  } catch (error) {
    logger.error("getOrganizationMembers: failed", { error, organizationId });
    throw new Error("Failed to fetch organization members.", { cause: error });
  }
};
