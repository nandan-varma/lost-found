"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-keys";
import { updateOrganizationDomain } from "@/server/organizations";

interface SetDomainFormProps {
  currentDomain: string | null;
  orgId: string;
}

export function SetDomainForm({ orgId, currentDomain }: SetDomainFormProps) {
  const [domain, setDomain] = useState(currentDomain ?? "");
  const { refresh } = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newDomain: string) =>
      updateOrganizationDomain(orgId, newDomain),
    onError: () => {
      toast.error("Failed to update domain");
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Domain updated");
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizations.byId(orgId),
        });
        refresh();
      } else {
        toast.error(result.error);
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    mutation.mutate(domain.trim());
  }

  function handleRemove() {
    mutation.mutate("", {
      onSuccess: (result) => {
        if (result.success) {
          setDomain("");
        }
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Domain</CardTitle>
        <CardDescription>
          Users with email addresses at this domain will be automatically added
          to this organization when they sign up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex items-end gap-3" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-1">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              onChange={(e) => setDomain(e.target.value)}
              placeholder="seattleu.edu"
              value={domain}
            />
          </div>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
          {!!currentDomain && (
            <Button
              disabled={mutation.isPending}
              onClick={handleRemove}
              type="button"
              variant="outline"
            >
              Remove
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
