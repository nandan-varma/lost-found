import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { OrgNav } from "@/components/items/org-nav";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";

type Params = Promise<{ slug: string }>;

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { slug } = await params;

  const [org, session] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    }),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  const currentMember =
    session && org
      ? await db.query.member.findFirst({
          where: and(
            eq(member.organizationId, org.id),
            eq(member.userId, session.user.id)
          ),
        })
      : null;

  const isAdmin =
    currentMember?.role === "admin" || currentMember?.role === "owner";

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
