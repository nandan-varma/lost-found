import { OrgBreadcrumb } from "@/components/items/org-breadcrumb";
import { getOrganizationBySlug } from "@/server/organizations";

type Params = Promise<{ slug: string }>;

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { slug } = await params;

  const orgData = await getOrganizationBySlug(slug);

  const isAdmin = orgData?.isAdmin ?? false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <OrgBreadcrumb
        isAdmin={isAdmin}
        organizationName={orgData?.name ?? slug}
        organizationSlug={slug}
      />
      {children}
    </div>
  );
}
