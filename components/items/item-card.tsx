import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Item, ItemImage } from "@/db/schema";
import { StatusBadge } from "./status-badge";

interface ItemCardProps {
  item: Item & { images: ItemImage[]; user: { name: string } };
  organizationSlug: string;
}

export function ItemCard({ item: i, organizationSlug }: ItemCardProps) {
  const firstImage = i.images[0];

  return (
    <Link href={`/dashboard/organization/${organizationSlug}/items/${i.id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {firstImage ? (
            <Image
              alt={i.title}
              className="object-cover"
              fill
              loading="eager"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={firstImage.url}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{i.title}</h3>
            <StatusBadge status={i.status} />
          </div>
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {i.description}
          </p>
          <p className="text-muted-foreground text-xs">
            Posted by {i.user.name} &middot;{" "}
            {new Date(i.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
