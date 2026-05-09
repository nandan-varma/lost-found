import { Building2 } from "lucide-react";
import Link from "next/link";
import { CreateOrganizationDialog } from "@/components/forms/create-organization-dialog";
import { JoinOrganizationDialog } from "@/components/forms/join-organization-dialog";
import { getAllOrganizations, getOrganizations } from "@/server/organizations";

export default async function Dashboard() {
  const organizations = await getOrganizations();
  const allOrganizations = await getAllOrganizations();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-20">
      <div className="mb-8">
        <h1 className="font-bold text-2xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Select an organization to manage lost and found items.
        </p>
      </div>

      {organizations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link href={`/dashboard/organization/${org.slug}`} key={org.id}>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:shadow-md">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {org.slug}
                    {org.domain && ` \u00B7 ${org.domain}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 py-16 text-center">
          <Building2 className="mx-auto mb-4 size-8 text-muted-foreground" />
          <p className="mb-1 font-medium">No organizations yet</p>
          <p className="mb-4 text-muted-foreground text-sm">
            Create or join an organization to get started.
          </p>
          <div className="flex items-center justify-center gap-3">
            <CreateOrganizationDialog />
            <JoinOrganizationDialog organizations={allOrganizations} />
          </div>
        </div>
      )}

      {organizations.length > 0 && (
        <div className="mt-8">
          <CreateOrganizationDialog variant="outline" />
        </div>
      )}
    </div>
  );
}
