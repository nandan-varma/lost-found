import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Claim, Item, ItemImage, User } from "@/db/schema";
import { ClaimForm } from "./claim-form";
import { ImageGallery } from "./image-gallery";
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

        <ImageGallery
          alt={i.title}
          images={i.images.map((img) => ({ id: img.id, url: img.url }))}
        />

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
