"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { removeMember } from "@/server/members";
import { Button } from "./ui/button";

export default function MembersTableAction({
  memberId,
  organizationId,
}: {
  memberId: string;
  organizationId: string;
}) {
  const { refresh } = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => removeMember(memberId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Member removed from organization");
        queryClient.invalidateQueries({
          queryKey: queryKeys.members.all(organizationId),
        });
        refresh();
      } else {
        toast.error(result.error);
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
