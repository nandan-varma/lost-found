"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { updateItemStatus } from "@/server/items";

interface ItemActionsProps {
  currentStatus: string;
  itemId: string;
  organizationId: string;
}

export function ItemActions({
  itemId,
  currentStatus,
  organizationId,
}: ItemActionsProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
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
        toast.error(result.error as string);
      }
    },
  });

  const buttonLabel =
    currentStatus === "claimed" ? "Mark as Resolved" : "Mark as Closed";

  return (
    <div className="flex gap-3">
      <Button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        variant="outline"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {buttonLabel}
          </>
        ) : (
          buttonLabel
        )}
      </Button>
    </div>
  );
}
