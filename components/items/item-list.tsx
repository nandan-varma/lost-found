import Link from "next/link";
import type { Item, ItemImage } from "@/db/schema";
import { ItemCard } from "./item-card";

interface ItemListProps {
  items: (Item & { images: ItemImage[]; user: { name: string } })[];
  organizationSlug: string;
  activeStatus?: string;
}

export function ItemList({
  items,
  organizationSlug,
  activeStatus,
}: ItemListProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {["all", "lost", "found"].map((status) => (
          <Link
            className={`rounded-md px-4 py-2 font-medium text-sm transition-colors ${
              (status === "all" && !activeStatus) || status === activeStatus
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            href={
              status === "all"
                ? `/dashboard/organization/${organizationSlug}`
                : `/dashboard/organization/${organizationSlug}?status=${status}`
            }
            key={status}
          >
            {status === "all"
              ? "All"
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No items found</p>
          <p className="mt-1 text-sm">{emptyMessage(activeStatus)}</p>
          <Link
            className="mt-4 inline-block font-medium text-primary text-sm underline underline-offset-4 hover:text-primary/80"
            href={`/dashboard/organization/${organizationSlug}/post`}
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
