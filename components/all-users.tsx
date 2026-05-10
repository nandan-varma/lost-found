"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { User } from "@/db/schema";
import { authClient } from "@/lib/auth-client";

interface AllUsersProps {
  organizationId: string;
  users: User[];
}

export default function AllUsers({ users, organizationId }: AllUsersProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (user: User) => {
      const { error } = await authClient.organization.inviteMember({
        email: user.email,
        role: "member",
        organizationId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return user;
    },
    onSuccess: (user) => {
      toast.success(`Invitation sent to ${user.name}`);
      queryClient.invalidateQueries({ queryKey: ["members", organizationId] });
      queryClient.invalidateQueries({
        queryKey: ["users", organizationId, "non-members"],
      });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to invite member to organization");
    },
  });

  if (users.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No users available to invite.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {users.map((user) => (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
          key={user.id}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{user.name}</p>
            <p className="truncate text-muted-foreground text-xs">
              {user.email}
            </p>
          </div>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(user)}
            size="sm"
            variant="outline"
          >
            {mutation.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <>
                <UserPlus className="mr-1 size-3" />
                Invite
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
