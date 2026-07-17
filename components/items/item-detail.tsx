"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import { getItem } from "@/server/items";
import { ClaimForm } from "./claim-form";
import { ImageGallery } from "./image-gallery";
import { ItemActions } from "./item-actions";
import { StatusBadge } from "./status-badge";

interface ItemDetailProps {
  isOwnerOrAdmin: boolean;
  itemId: string;
  organizationId: string;
  organizationSlug: string;
}

export function ItemDetail({
  itemId,
  organizationId,
  organizationSlug,
  isOwnerOrAdmin,
}: ItemDetailProps) {
  const { data: i } = useQuery({
    queryKey: queryKeys.items.detail(itemId),
    queryFn: () => getItem(itemId),
  });

  if (!i) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-muted-foreground">
        Item not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-semibold text-2xl sm:text-3xl">
              {i.title}
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Posted by {i.user.name} &middot;{" "}
              <span suppressHydrationWarning>
                {new Date(i.createdAt).toLocaleDateString()}
              </span>
            </p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={i.status} />
          </div>
        </div>

        <ImageGallery
          alt={i.title}
          images={i.images.map((img) => ({ id: img.id, url: img.url }))}
        />

        <p className="text-base text-muted-foreground leading-relaxed">
          {i.description}
        </p>
      </div>

      {i.status === "found" && !isOwnerOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Claim This Item</CardTitle>
          </CardHeader>
          <CardContent>
            <ClaimForm
              itemId={i.id}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
            />
          </CardContent>
        </Card>
      )}

      {i.status === "claimed" && i.claim && (
        <Card>
          <CardHeader>
            <CardTitle>Claim Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-medium">Claimed by:</span>{" "}
              {i.claim.claimantName}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {i.claim.claimantEmail}
            </p>
            {i.claim.message && (
              <p>
                <span className="font-medium">Message:</span> {i.claim.message}
              </p>
            )}
            <p>
              <span className="font-medium">Claimed on:</span>{" "}
              <span suppressHydrationWarning>
                {new Date(i.claim.createdAt).toLocaleDateString()}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {i.status === "claimed" && !isOwnerOrAdmin && (
        <Badge className="text-sm" variant="outline">
          This item has been claimed
        </Badge>
      )}

      {isOwnerOrAdmin && i.status !== "closed" && (
        <ItemActions
          currentStatus={i.status}
          itemId={i.id}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />
      )}
    </div>
  );
}
