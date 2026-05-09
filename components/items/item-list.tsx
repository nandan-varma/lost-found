"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Item, ItemImage } from "@/db/schema";
import { ItemCard } from "./item-card";

interface ItemListProps {
  activeStatus?: string;
  items: (Item & { images: ItemImage[]; user: { name: string } })[];
  organizationSlug: string;
}

export function ItemList({
  items,
  organizationSlug,
  activeStatus,
}: ItemListProps) {
  const router = useRouter();
  const baseHref = `/dashboard/organization/${organizationSlug}`;

  return (
    <div className="space-y-6">
      <Tabs
        onValueChange={(value) =>
          router.push(
            value === "all" ? baseHref : `${baseHref}?status=${value}`
          )
        }
        value={activeStatus ?? "all"}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
          <TabsTrigger value="found">Found</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No items found</p>
          <p className="mt-1 text-sm">{emptyMessage(activeStatus)}</p>
          <Link
            className="mt-4 inline-block font-medium text-primary text-sm underline underline-offset-4 hover:text-primary/80"
            href={`${baseHref}/post`}
          >
            Post an item
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <ItemCard item={i} key={i.id} organizationSlug={organizationSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

function emptyMessage(activeStatus?: string): string {
  if (activeStatus === "lost") {
    return "No lost items have been posted yet.";
  }
  if (activeStatus === "found") {
    return "No found items have been posted yet.";
  }
  return "No items have been posted yet.";
}
