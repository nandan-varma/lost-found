import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AllUsers from "@/components/all-users";
import { SetDomainForm } from "@/components/forms/set-domain-form";
import MembersTable from "@/components/members-table";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/server/organizations";
import { getUsers } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function MembersPage({ params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    redirect("/dashboard");
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
    redirect(`/dashboard/organization/${slug}`);
  }

  const users = await getUsers(organization.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-bold text-2xl">Members</h1>
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

      <div>
        <h2 className="mb-3 font-semibold text-lg">Current Members</h2>
        <MembersTable members={organization?.members || []} />
      </div>

      {isAdmin && (
        <div>
          <h2 className="mb-3 font-semibold text-lg">Invite Members</h2>
          <AllUsers organizationId={organization?.id || ""} users={users} />
        </div>
      )}
    </div>
  );
}
