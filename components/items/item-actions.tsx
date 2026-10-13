"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ItemStatus } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { deleteItem, updateItemStatus } from "@/server/items";

interface ItemActionsProps {
  currentStatus: ItemStatus;
  itemId: string;
  organizationId: string;
  organizationSlug: string;
}

export function ItemActions({
  itemId,
  currentStatus,
  organizationId,
  organizationSlug,
}: ItemActionsProps) {
  const queryClient = useQueryClient();
  const { push } = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const statusMutation = useMutation({
    mutationFn: () => updateItemStatus(itemId, "closed"),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Item closed successfully");
        queryClient.invalidateQueries({
          queryKey: queryKeys.items.detail(itemId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.items.all(organizationId),
        });
      } else {
        toast.error(result.error);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(itemId),
    onError: () => {
      toast.error("Failed to delete item.");
      setDeleteDialogOpen(false);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Item deleted");
        queryClient.invalidateQueries({
          queryKey: queryKeys.items.all(organizationId),
        });
        push(`/app/${organizationSlug}`);
      } else {
        toast.error(result.error);
        setDeleteDialogOpen(false);
      }
    },
  });

  const buttonLabel =
    currentStatus === "claimed" ? "Mark as Resolved" : "Mark as Closed";

  return (
    <div className="flex gap-3">
      <Button
        disabled={statusMutation.isPending}
        onClick={() => statusMutation.mutate()}
        variant="outline"
      >
        {statusMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {buttonLabel}
          </>
        ) : (
          buttonLabel
        )}
      </Button>

      <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive">
        <Trash2 className="size-4" />
        Delete
      </Button>

      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              This will permanently delete the post and its images. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
