import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ItemDetail } from "@/components/items/item-detail";
import { auth } from "@/lib/auth";
import { getItem } from "@/server/items";

type Params = Promise<{ slug: string; itemId: string }>;

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { slug, itemId } = await params;

  const itemRecord = await getItem(itemId);

  if (!itemRecord) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isOwnerOrAdmin =
    itemRecord.userId === session.user.id ||
    itemRecord.user.email === session.user.email;

  return (
    <ItemDetail
      isLoggedIn={!!session}
      isOwnerOrAdmin={isOwnerOrAdmin}
      item={itemRecord}
      organizationSlug={slug}
    />
  );
}
