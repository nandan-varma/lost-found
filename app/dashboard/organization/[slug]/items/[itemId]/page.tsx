import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ItemDetail } from "@/components/items/item-detail";
import { ItemDetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getItem } from "@/server/items";
import { isItemOwnerOrAdmin } from "@/server/permissions";

type Params = Promise<{ slug: string; itemId: string }>;

async function ItemDetailContent({
  slug,
  itemId,
}: {
  slug: string;
  itemId: string;
}) {
  // Parallel fetch item and session
  const [item, session] = await Promise.all([
    getItem(itemId),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  if (!item) {
    notFound();
  }

  if (!session) {
    redirect("/login");
  }

  const isOwnerOrAdmin = await isItemOwnerOrAdmin(itemId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Button
        asChild
        className="mb-6 px-0 text-muted-foreground"
        size="sm"
        variant="link"
      >
        <Link href={`/dashboard/organization/${slug}`}>
          <ArrowLeft className="mr-1 size-4" />
          Back to items
        </Link>
      </Button>
      <ItemDetail
        isLoggedIn={!!session}
        isOwnerOrAdmin={isOwnerOrAdmin}
        item={item}
        organizationSlug={slug}
      />
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
