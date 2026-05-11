import { OrgBreadcrumb } from "@/components/items/org-breadcrumb";
import { getSession } from "@/lib/get-session";
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

  const session = await getSession();

  const orgData = await getOrganizationBySlug(slug, session?.user.id);

  const isAdmin = orgData?.isAdmin ?? false;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-20 pb-10">
      <OrgBreadcrumb
        isAdmin={isAdmin}
        organizationName={orgData?.name ?? slug}
        organizationSlug={slug}
      />
      {children}
    </div>
  );
}
