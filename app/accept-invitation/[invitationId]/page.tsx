import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Building2, CheckCircle, LogIn, UserPlus, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import {
  invitation as invitationTable,
  member,
  organization,
  user,
} from "@/db/schema";
import { getSession } from "@/lib/get-session";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Accept invitation",
  robots: {
    index: false,
    follow: false,
  },
};

async function getInvitation(id: string) {
  const inv = await db
    .select()
    .from(invitationTable)
    .where(eq(invitationTable.id, id))
    .limit(1);
  return inv[0] || null;
}

async function getOrganization(id: string) {
  const orgs = await db
    .select()
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);
  return orgs[0] || null;
}

function isInvitationValid(invitation: {
  status: string;
  expiresAt: Date | string;
}) {
  if (invitation.status !== "pending") {
    return false;
  }

  return new Date(invitation.expiresAt) >= new Date();
}

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  const invitation = await getInvitation(invitationId);
  const org = invitation
    ? await getOrganization(invitation.organizationId)
    : null;

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <X className="mb-4 size-12 text-destructive" />
        <h1 className="mb-2 font-bold text-2xl">Invalid Invitation</h1>
        <p className="mb-6 text-center text-muted-foreground">
          This invitation link is not valid or has been removed.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  if (invitation.status !== "pending") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <CheckCircle className="mb-4 size-12 text-green-600" />
        <h1 className="mb-2 font-bold text-2xl">Already Accepted</h1>
        <p className="mb-6 text-center text-muted-foreground">
          This invitation has already been accepted.
        </p>
        <Button asChild>
          <Link href="/app">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const now = new Date();
  const expiresAt = new Date(invitation.expiresAt);
  if (expiresAt < now) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <X className="mb-4 size-12 text-destructive" />
        <h1 className="mb-2 font-bold text-2xl">Invitation Expired</h1>
        <p className="mb-6 text-center text-muted-foreground">
          This invitation link has expired. Please request a new invitation from
          your organization admin.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const session = await getSession();

  if (session?.user) {
    const currentEmail = session.user.email?.toLowerCase();
    const inviteEmail = invitation.email.toLowerCase();

    if (currentEmail !== inviteEmail) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <LogIn className="mb-4 size-12 text-yellow-600" />
          <h1 className="mb-2 font-bold text-2xl">Welcome!</h1>
          <p className="mb-4 text-center text-muted-foreground">
            You&apos;re logged in as <strong>{session.user.email}</strong>
          </p>
          <p className="mb-6 text-center text-muted-foreground">
            This invitation is for <strong>{invitation.email}</strong>. Sign in
            with that email to accept it.
          </p>
          <Button asChild>
            <Link href={`/login?invitation=${invitationId}`}>
              Switch Account
            </Link>
          </Button>
        </div>
      );
    }

    await acceptInvitationAsUser(invitationId);
  }

  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, invitation.email))
    .limit(1);

  if (!existingUser[0]) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <UserPlus className="mb-4 size-12 text-blue-600" />
        <h1 className="mb-2 font-bold text-2xl">Create Your Account</h1>
        <p className="mb-2 text-center text-muted-foreground">
          You&apos;ve been invited to join <strong>{org?.name}</strong>
        </p>
        <p className="mb-6 text-center text-muted-foreground">
          You need to create an account to accept this invitation. Sign up with{" "}
          <strong>{invitation.email}</strong>
        </p>
        <Button asChild>
          <Link href={`/login?invitation=${invitationId}`}>
            Sign Up / Login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Building2 className="size-7 text-primary" />
      </div>
      <h1 className="mb-2 font-bold text-2xl">Join {org?.name}</h1>
      <p className="mb-6 text-center text-muted-foreground">
        You&apos;ve been invited to join this organization.
      </p>
      <Button asChild>
        <Link href={`/login?invitation=${invitationId}`}>
          Sign In to Accept
        </Link>
      </Button>
    </div>
  );
}

async function acceptInvitationAsUser(invitationId: string) {
  "use server";

  logger.info("acceptInvitation: start", { invitationId });

  const session = await getSession();

  if (!(session?.user?.id && session.user.email)) {
    logger.warn("acceptInvitation: not authenticated", { invitationId });
    throw new Error("Not authenticated");
  }

  const invitationRecord = await db.query.invitation.findFirst({
    where: eq(invitationTable.id, invitationId),
  });

  if (!invitationRecord) {
    logger.warn("acceptInvitation: not found", { invitationId });
    throw new Error("Invitation not found");
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, invitationRecord.organizationId),
  });

  if (!org) {
    logger.error("acceptInvitation: org not found", {
      invitationId,
      organizationId: invitationRecord.organizationId,
    });
    throw new Error("Organization not found");
  }

  if (!isInvitationValid(invitationRecord)) {
    logger.warn("acceptInvitation: invalid or expired", { invitationId });
    throw new Error("Invalid or expired invitation");
  }

  if (
    invitationRecord.email.trim().toLowerCase() !==
    session.user.email.trim().toLowerCase()
  ) {
    logger.warn("acceptInvitation: email mismatch", {
      invitationId,
      invitationEmail: invitationRecord.email,
      sessionEmail: session.user.email,
    });
    throw new Error("Invitation email does not match current account");
  }

  const role =
    invitationRecord.role === "admin" || invitationRecord.role === "owner"
      ? invitationRecord.role
      : "member";

  await db.transaction(async (tx) => {
    const existingMembership = await tx.query.member.findFirst({
      where: and(
        eq(member.organizationId, invitationRecord.organizationId),
        eq(member.userId, session.user.id)
      ),
    });

    if (existingMembership) {
      if (invitationRecord.status === "pending") {
        await tx
          .update(invitationTable)
          .set({ status: "accepted" })
          .where(
            and(
              eq(invitationTable.id, invitationId),
              eq(invitationTable.status, "pending")
            )
          );
      }
      logger.info("acceptInvitation: already member, updated status", {
        invitationId,
        userId: session.user.id,
        organizationId: invitationRecord.organizationId,
      });
      return;
    }

    const [updatedInvite] = await tx
      .update(invitationTable)
      .set({ status: "accepted" })
      .where(
        and(
          eq(invitationTable.id, invitationId),
          eq(invitationTable.status, "pending")
        )
      )
      .returning({ id: invitationTable.id });

    if (!updatedInvite) {
      logger.warn(
        "acceptInvitation: race condition, invite already processed",
        {
          invitationId,
        }
      );
      throw new Error("Invalid or expired invitation");
    }

    await tx.insert(member).values({
      id: randomUUID(),
      organizationId: invitationRecord.organizationId,
      userId: session.user.id,
      role,
      createdAt: new Date(),
    });

    logger.info("acceptInvitation: success", {
      invitationId,
      userId: session.user.id,
      organizationId: invitationRecord.organizationId,
      organizationSlug: org.slug,
      role,
    });
  });

  redirect(`/app/${org.slug}`);
}
