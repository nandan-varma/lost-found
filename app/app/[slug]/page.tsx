import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemList } from "@/components/items/item-list";
import { ItemListSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/get-session";
import { createItemStatusSchema } from "@/lib/validations";
import { getItems } from "@/server/items";
import { getOrganizationBySlug } from "@/server/organizations";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `${slug} items`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function ItemsContent({
  slug,
  status,
}: {
  slug: string;
  status?: string;
}) {
  const session = await getSession();

  const organization = await getOrganizationBySlug(slug, session?.user.id);

  if (!organization) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-muted-foreground">
        Organization not found
      </div>
    );
  }

  const parsedStatus = createItemStatusSchema.safeParse(status);

  const items = await getItems(
    organization.id,
    parsedStatus.success ? parsedStatus.data : undefined
  );

  return (
    <div className="mx-auto max-w-6xl px-4">
      <ItemList
        activeStatus={parsedStatus.success ? parsedStatus.data : undefined}
        initialItems={items}
        isAdmin={organization.isAdmin}
        organizationId={organization.id}
        organizationSlug={slug}
      />
    </div>
  );
}

export default async function OrganizationItemsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ slug }, { status }] = await Promise.all([params, searchParams]);

  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <ItemsContent slug={slug} status={status} />
    </Suspense>
  );
}
