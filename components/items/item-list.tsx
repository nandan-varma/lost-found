"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Item, ItemImage } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { getItems } from "@/server/items";
import { ItemCard } from "./item-card";

interface ItemListProps {
  activeStatus?: string;
  initialItems: (Item & { images: ItemImage[]; user: { name: string } })[];
  organizationId: string;
  organizationSlug: string;
}

export function ItemList({
  initialItems,
  organizationId,
  organizationSlug,
  activeStatus,
}: ItemListProps) {
  const router = useRouter();
  const baseHref = `/dashboard/organization/${organizationSlug}`;

  const { data: items } = useQuery({
    queryKey: queryKeys.items.filtered(organizationId, activeStatus),
    queryFn: () =>
      getItems(organizationId, activeStatus as "lost" | "found" | undefined),
    initialData: initialItems,
  });

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
          <TabsTrigger value="found">Found</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center sm:py-16">
          <p className="font-medium text-lg">No items found</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {emptyMessage(activeStatus)}
          </p>
          <Link
            className="mt-4 inline-block font-medium text-primary text-sm underline underline-offset-4 hover:text-primary/80"
            href={`${baseHref}/post`}
          >
            Post an item
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {items.map((i, index) => (
            <ItemCard
              item={i}
              key={i.id}
              organizationSlug={organizationSlug}
              priority={index === 0}
            />
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
