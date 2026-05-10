import { Building2 } from "lucide-react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/get-session";
import { getAllOrganizations, getOrganizations } from "@/server/organizations";

export const dynamic = "force-dynamic";

const CreateOrganizationDialog = dynamicImport(
  () =>
    import("@/components/forms/create-organization-dialog").then(
      (m) => m.CreateOrganizationDialog
    ),
  {
    loading: () => (
      <Button disabled variant="default">
        Create Organization
      </Button>
    ),
  }
);

const JoinOrganizationDialog = dynamicImport(
  () =>
    import("@/components/forms/join-organization-dialog").then(
      (m) => m.JoinOrganizationDialog
    ),
  {
    loading: () => (
      <Button disabled variant="outline">
        Join Organization
      </Button>
    ),
  }
);

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { create } = await searchParams;

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [organizations, allOrganizations] = await Promise.all([
    getOrganizations(session.user.id),
    getAllOrganizations(session.user.id),
  ]);

  if (!create && organizations.length === 1) {
    redirect(`/dashboard/organization/${organizations[0].slug}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-12">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Select an organization to manage lost and found items.
        </p>
      </div>

      {organizations.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link href={`/dashboard/organization/${org.slug}`} key={org.id}>
              <div className="flex h-full items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:shadow-md">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{org.name}</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {org.slug}
                    {org.domain && ` \u00B7 ${org.domain}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center sm:py-16">
          <Building2 className="mx-auto mb-4 size-8 text-muted-foreground" />
          <p className="mb-1 font-medium">No organizations yet</p>
          <p className="mb-4 text-muted-foreground text-sm">
            Create or join an organization to get started.
          </p>
          <div className="flex items-center justify-center gap-3">
            <CreateOrganizationDialog defaultOpen={!!create} />
            <JoinOrganizationDialog organizations={allOrganizations} />
          </div>
        </div>
      )}

      {organizations.length > 0 && (
        <div className="border-t pt-8">
          <CreateOrganizationDialog defaultOpen={!!create} variant="outline" />
        </div>
      )}
    </div>
  );
}
