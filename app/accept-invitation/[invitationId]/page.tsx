import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Building2, CheckCircle, LogIn, UserPlus, X } from "lucide-react";
import { headers } from "next/headers";
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
import { auth } from "@/lib/auth";

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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
            This invitation is for <strong>{invitation.email}</strong>. Would
            you still like to accept it?
          </p>
          <form
            action={async () => {
              "use server";
              await acceptInvitationAsUser(
                invitationId,
                session.user?.id ?? ""
              );
            }}
          >
            <Button type="submit">Accept as Current User</Button>
          </form>
        </div>
      );
    }

    await acceptInvitationAsUser(invitationId, session.user.id);
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

async function acceptInvitationAsUser(invitationId: string, userId: string) {
  "use server";

  const invs = await db
    .select()
    .from(invitationTable)
    .where(eq(invitationTable.id, invitationId));
  const inv = invs[0];

  if (!inv || inv.status !== "pending") {
    throw new Error("Invalid or expired invitation");
  }

  const orgs = await db
    .select()
    .from(organization)
    .where(eq(organization.id, inv.organizationId));
  const org = orgs[0];

  await db.transaction(async (tx) => {
    const existingMembership = await tx.query.member.findFirst({
      where: and(
        eq(member.organizationId, inv.organizationId),
        eq(member.userId, userId)
      ),
    });

    if (!existingMembership) {
      await tx.insert(member).values({
        id: randomUUID(),
        organizationId: inv.organizationId,
        userId,
        role: (inv.role as "member" | "admin" | "owner") ?? "member",
        createdAt: new Date(),
      });
    }

    await tx
      .update(invitationTable)
      .set({ status: "accepted" })
      .where(
        and(
          eq(invitationTable.id, invitationId),
          eq(invitationTable.status, "pending")
        )
      );
  });

  redirect(`/app/${org?.slug}`);
}
