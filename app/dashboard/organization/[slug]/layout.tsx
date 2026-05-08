import { OrgNav } from "@/components/items/org-nav";

type Params = Promise<{ slug: string }>;

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <OrgNav organizationSlug={slug} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
