import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AllUsers from "@/components/all-users";
import { SetDomainForm } from "@/components/forms/set-domain-form";
import MembersTable from "@/components/members-table";
import { MembersTableSkeleton } from "@/components/skeletons";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { getSession } from "@/lib/get-session";
import { getOrganizationMembers } from "@/server/members";
import { getOrganizationBySlug } from "@/server/organizations";
import { getUsers } from "@/server/users";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function MembersContent({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const [users, members] = await Promise.all([
    getUsers(organizationId, userId),
    getOrganizationMembers(organizationId),
  ]);

  return (
    <>
      <div>
        <h2 className="mb-3 font-semibold text-lg">Current Members</h2>
        <Suspense fallback={<MembersTableSkeleton />}>
          <div className="rounded-lg border">
            <div className="p-4">
              <MembersTable members={members} />
            </div>
          </div>
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-lg">Invite Members</h2>
        <AllUsers organizationId={organizationId} users={users} />
      </div>
    </>
  );
}

export default async function MembersPage({ params }: { params: Params }) {
  const { slug } = await params;

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const organization = await getOrganizationBySlug(slug, session.user.id);

  if (!organization) {
    redirect("/app");
  }

  const currentMember = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organization.id),
      eq(member.userId, session.user.id)
    ),
  });

  const isAdmin =
    currentMember?.role === "admin" || currentMember?.role === "owner";

  if (!isAdmin) {
    redirect(`/app/${slug}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:py-12">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage members and organization settings
        </p>
      </div>

      {isAdmin && organization && (
        <SetDomainForm
          currentDomain={organization.domain ?? null}
          orgId={organization.id}
        />
      )}

      <Suspense fallback={<MembersTableSkeleton />}>
        <MembersContent
          organizationId={organization.id}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
