"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { User } from "@/db/schema";
import { authClient } from "@/lib/auth-client";

interface AllUsersProps {
  organizationId: string;
  users: User[];
}

export default function AllUsers({ users, organizationId }: AllUsersProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const router = useRouter();

  const handleInviteMember = async (user: User) => {
    try {
      setLoadingUserId(user.id);
      const { error } = await authClient.organization.inviteMember({
        email: user.email,
        role: "member",
        organizationId,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Invitation sent to ${user.name}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to invite member to organization");
      console.error(error);
    } finally {
      setLoadingUserId(null);
    }
  };

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
            disabled={loadingUserId === user.id}
            onClick={() => handleInviteMember(user)}
            size="sm"
            variant="outline"
          >
            {loadingUserId === user.id ? (
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
