"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Item, ItemImage } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { getItems } from "@/server/items";
import { ItemCard } from "./item-card";

interface ItemListProps {
  activeStatus?: string;
  initialItems: (Item & { images: ItemImage[]; user: { name: string } })[];
  isAdmin?: boolean;
  organizationId: string;
  organizationSlug: string;
}

export function ItemList({
  initialItems,
  isAdmin,
  organizationId,
  organizationSlug,
  activeStatus,
}: ItemListProps) {
  const router = useRouter();
  const baseHref = `/app/${organizationSlug}`;

  const { data: items } = useQuery({
    queryKey: queryKeys.items.filtered(organizationId, activeStatus),
    queryFn: () =>
      getItems(organizationId, activeStatus as "lost" | "found" | undefined),
    initialData: initialItems,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4 sm:space-y-6">
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

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button
              asChild
              className="flex-1 sm:flex-none"
              size="sm"
              variant="outline"
            >
              <Link href={`${baseHref}/settings`}>
                <Settings className="mr-1.5 size-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </Button>
          )}
          <Button asChild className="flex-1 sm:flex-none" size="sm">
            <Link href={`${baseHref}/new`}>
              <Plus className="mr-1.5 size-4" />
              <span className="hidden sm:inline">New Post</span>
              <span className="sm:hidden">+</span>
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center sm:py-16">
          <p className="font-medium text-lg">No items found</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {emptyMessage(activeStatus)}
          </p>
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
