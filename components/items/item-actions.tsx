"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateItemStatus } from "@/server/items";

interface ItemActionsProps {
  currentStatus: string;
  itemId: string;
}

export function ItemActions({ itemId, currentStatus }: ItemActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleClose() {
    setIsLoading(true);

    const result = await updateItemStatus(itemId, "closed");

    if (result.success) {
      toast.success("Item closed successfully");
      router.refresh();
    } else {
      toast.error(result.error as string);
    }

    setIsLoading(false);
  }

  const buttonLabel =
    currentStatus === "claimed" ? "Mark as Resolved" : "Mark as Closed";

  return (
    <div className="flex gap-3">
      <Button disabled={isLoading} onClick={handleClose} variant="outline">
        {isLoading ? (
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
