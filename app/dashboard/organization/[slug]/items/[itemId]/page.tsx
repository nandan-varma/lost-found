import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ItemDetail } from "@/components/items/item-detail";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getItem } from "@/server/items";

type Params = Promise<{ slug: string; itemId: string }>;

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { slug, itemId } = await params;

  const item = await getItem(itemId);

  if (!item) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isOwnerOrAdmin =
    item.userId === session.user.id || item.user.email === session.user.email;

  return (
    <div>
      <Button
        asChild
        className="mb-4 px-0 text-muted-foreground"
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
