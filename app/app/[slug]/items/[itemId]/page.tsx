import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ItemDetail } from "@/components/items/item-detail";
import { ItemDetailSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/get-session";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { getItem } from "@/server/items";
import { isItemOwnerOrAdmin } from "@/server/permissions";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; itemId: string }>;

async function ItemDetailContent({
  slug,
  itemId,
}: {
  slug: string;
  itemId: string;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [item, isOwnerOrAdmin] = await Promise.all([
    getItem(itemId, session.user.id),
    isItemOwnerOrAdmin(itemId, session.user.id),
  ]);

  if (!item) {
    notFound();
  }

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.items.detail(itemId), item);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ItemDetail
          isOwnerOrAdmin={isOwnerOrAdmin}
          itemId={item.id}
          organizationId={item.organizationId}
          organizationSlug={slug}
        />
      </HydrationBoundary>
    </div>
  );
}

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { slug, itemId } = await params;

  return (
    <Suspense fallback={<ItemDetailSkeleton />}>
      <ItemDetailContent itemId={itemId} slug={slug} />
    </Suspense>
  );
}
