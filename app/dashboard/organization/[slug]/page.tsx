import { Suspense } from "react";
import { ItemList } from "@/components/items/item-list";
import { ItemListSkeleton } from "@/components/skeletons";
import { itemStatusSchema } from "@/lib/validations";
import { getItems } from "@/server/items";
import { getOrganizationBySlug } from "@/server/organizations";

type Params = Promise<{ slug: string }>;

async function ItemsContent({
  slug,
  status,
}: {
  slug: string;
  status?: string;
}) {
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-muted-foreground">
        Organization not found
      </div>
    );
  }

  const parsedStatus = itemStatusSchema.safeParse(status);

  const items = await getItems(
    organization.id,
    parsedStatus.success ? parsedStatus.data : undefined
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <ItemList
        activeStatus={parsedStatus.success ? parsedStatus.data : undefined}
        initialItems={items}
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
  const { slug } = await params;
  const { status } = await searchParams;

  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <ItemsContent slug={slug} status={status} />
    </Suspense>
  );
}
