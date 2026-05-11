"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { Resend } from "resend";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import { db } from "@/db/drizzle";
import { invitation, member, organization, type Role, user } from "@/db/schema";
import { auth } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const inviteMember = async (
  organizationId: string,
  email: string,
  role: Role = "member"
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
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

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    const invId = randomUUID();
    await db.insert(invitation).values({
      id: invId,
      email,
      organizationId,
      role,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      inviterId: session.user.id,
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/accept-invitation/${invId}`;

    await resend.emails.send({
      from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
      to: email,
      subject: `You've been invited to join ${org?.name} on Lost and Found`,
      react: OrganizationInvitationEmail({
        email,
        invitedByUsername: session.user.name || "Someone",
        invitedByEmail: session.user.email || "",
        teamName: org?.name || "the organization",
        inviteLink,
      }),
    });

    return {
      success: true,
      message: `Invitation sent to ${email}`,
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in.",
      };
    }

    const memberRecord = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    });

    if (!memberRecord) {
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
