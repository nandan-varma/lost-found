import Link from "next/link";
import { OrgNav } from "@/components/items/org-nav";
import { Button } from "@/components/ui/button";
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
      <div className="mb-2">
        <Button
          asChild
          className="px-0 text-muted-foreground"
          size="sm"
          variant="link"
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
      <OrgNav isAdmin={isAdmin} organizationSlug={slug} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
