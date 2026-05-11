import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SetDomainForm } from "@/components/forms/set-domain-form";
import { InviteMembers } from "@/components/invite-members";
import MembersTable from "@/components/members-table";
import { MembersTableSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { getSession } from "@/lib/get-session";
import { getOrganizationMembers } from "@/server/members";
import { getOrganizationBySlug } from "@/server/organizations";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function MembersContent({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const members = await getOrganizationMembers(organizationId, userId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 font-semibold text-lg">Current Members</h2>
        <Suspense fallback={<MembersTableSkeleton />}>
          <div className="rounded-lg border">
            <div className="p-4">
              <MembersTable members={members} organizationId={organizationId} />
            </div>
          </div>
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-lg">Invite Members</h2>
        <InviteMembers organizationId={organizationId} />
      </div>
    </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button
          asChild
          className="-ml-3 text-muted-foreground"
          size="sm"
          variant="ghost"
        >
          <Link href={`/app/${slug}`}>
            <ArrowLeft className="mr-1 size-4" />
            <span className="sr-only sm:not-sr-only">Items</span>
          </Link>
        </Button>
      </div>
      <div className="max-w-3xl space-y-8">
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

        <MembersContent
          organizationId={organization.id}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
