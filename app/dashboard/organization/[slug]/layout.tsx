import Link from "next/link";
import { OrgNav } from "@/components/items/org-nav";
import { Button } from "@/components/ui/button";

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
      <OrgNav organizationSlug={slug} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
