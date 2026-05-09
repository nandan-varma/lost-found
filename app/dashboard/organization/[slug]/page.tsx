import { ItemList } from "@/components/items/item-list";
import { itemStatusSchema } from "@/lib/validations";
import { getItems } from "@/server/items";
import { getOrganizationBySlug } from "@/server/organizations";

type Params = Promise<{ slug: string }>;

export default async function OrganizationItemsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ status?: string }>;
}) {
  const { slug } = await params;
  const { status } = await searchParams;

  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return (
      <div className="py-12 text-center text-muted-foreground">
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
    <ItemList
      activeStatus={parsedStatus.success ? parsedStatus.data : undefined}
      items={items}
      organizationSlug={slug}
    />
  );
}
