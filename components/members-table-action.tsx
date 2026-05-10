"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeMember } from "@/server/members";
import { Button } from "./ui/button";

export default function MembersTableAction({ memberId }: { memberId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => removeMember(memberId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Member removed from organization");
        queryClient.invalidateQueries({ queryKey: ["members"] });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove member");
      }
    },
    onError: () => {
      toast.error("Failed to remove member from organization");
    },
  });

  return (
    <Button
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      size="sm"
      variant="destructive"
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        "Remove"
      )}
    </Button>
  );
}
