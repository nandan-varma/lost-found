"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Search, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { searchUsers } from "@/server/users";

interface InviteMembersProps {
  organizationId: string;
}

export function InviteMembers({ organizationId }: InviteMembersProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["users", "search", organizationId, inputValue],
    queryFn: () => searchUsers(organizationId, inputValue),
    enabled: inputValue.length >= 2,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await authClient.organization.inviteMember({
        email,
        role: "member",
        organizationId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return email;
    },
    onSuccess: (email) => {
      toast.success(`Invitation sent to ${email}`);
      queryClient.invalidateQueries({ queryKey: ["members", organizationId] });
      queryClient.invalidateQueries({
        queryKey: ["users", "search", organizationId],
      });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  const handleAddEmail = useCallback(
    (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail && !emails.includes(normalizedEmail)) {
        setEmails((prev) => [...prev, normalizedEmail]);
      }
      setInputValue("");
      setShowDropdown(false);
    },
    [emails]
  );

  const handleRemoveEmail = useCallback((email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      if (inputValue.includes("@")) {
        handleAddEmail(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length) {
      handleRemoveEmail(emails.at(-1) ?? "");
    }
  };

  const filteredResults = searchResults.filter(
    (u) => !emails.includes(u.email.toLowerCase())
  );

  const showResults = showDropdown && inputValue.length >= 2;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-background p-1.5">
          {emails.map((email) => (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 font-medium text-primary text-sm"
              key={email}
            >
              <span className="max-w-[150px] truncate">{email}</span>
              <X
                className="size-3 cursor-pointer opacity-60 hover:opacity-100"
                onClick={() => handleRemoveEmail(email)}
              />
            </span>
          ))}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="border-0 bg-transparent px-8 py-1 focus-visible:ring-0"
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search by email or name..."
              value={inputValue}
            />
            {isSearching && (
              <Loader2 className="absolute top-1/2 right-2 size-4 -translate-y-1/2 animate-spin" />
            )}
          </div>
        </div>

        {showResults && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-lg">
            {filteredResults.length > 0
              ? filteredResults.map((user) => (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                    key={user.id}
                    onClick={() => handleAddEmail(user.email)}
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        {user.email}
                      </p>
                    </div>
                    <UserPlus className="size-4 text-muted-foreground" />
                  </button>
                ))
              : null}
            {inputValue.includes("@") &&
              !emails.includes(inputValue.toLowerCase()) && (
                <button
                  className="flex w-full items-center gap-2 border-t px-3 py-2 text-left hover:bg-accent"
                  onClick={() => handleAddEmail(inputValue)}
                  type="button"
                >
                  <Mail className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-primary">Invite new user</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {inputValue}
                    </p>
                  </div>
                  <UserPlus className="size-4 text-primary" />
                </button>
              )}
            {!inputValue.includes("@") && filteredResults.length === 0 && (
              <div className="px-3 py-2 text-center text-muted-foreground text-sm">
                No users found. Enter an email address to invite.
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        disabled={emails.length === 0 || mutation.isPending}
        onClick={() => {
          for (const email of emails) {
            mutation.mutate(email);
          }
          setEmails([]);
        }}
        size="sm"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 size-4" />
            Invite{" "}
            {emails.length > 0
              ? `${emails.length} member${emails.length > 1 ? "s" : ""}`
              : "Members"}
          </>
        )}
      </Button>
    </div>
  );
}
