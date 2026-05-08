import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Claim, Item, ItemImage, User } from "@/db/schema";
import { ClaimForm } from "./claim-form";
import { ItemActions } from "./item-actions";
import { StatusBadge } from "./status-badge";

interface ItemDetailProps {
  item: Item & {
    images: ItemImage[];
    user: Pick<User, "name" | "email">;
    claim: Claim | null;
  };
  organizationSlug: string;
  isOwnerOrAdmin: boolean;
  isLoggedIn: boolean;
}

export function ItemDetail({
  item: i,
  organizationSlug,
  isOwnerOrAdmin,
}: ItemDetailProps) {
  const mainImage = i.images[0];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-bold text-2xl">{i.title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Posted by {i.user.name} &middot;{" "}
              {new Date(i.createdAt).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={i.status} />
        </div>

        {mainImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <Image
              alt={i.title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              src={mainImage.url}
            />
          </div>
        )}

        {i.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {i.images.map((img) => (
              <div
                className="relative aspect-video h-20 shrink-0 overflow-hidden rounded-md bg-muted"
                key={img.id}
              >
                <Image
                  alt={i.title}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={img.url}
                />
              </div>
            ))}
          </div>
        )}

        <p className="text-muted-foreground">{i.description}</p>
      </div>

      {i.status === "found" && !isOwnerOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Claim This Item</CardTitle>
          </CardHeader>
          <CardContent>
            <ClaimForm itemId={i.id} organizationSlug={organizationSlug} />
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
              {new Date(i.claim.createdAt).toLocaleDateString()}
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
        <ItemActions currentStatus={i.status} itemId={i.id} />
      )}
    </div>
  );
}
