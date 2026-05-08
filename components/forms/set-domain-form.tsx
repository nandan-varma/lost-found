"use client";

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
import { updateOrganizationDomain } from "@/server/organizations";

interface SetDomainFormProps {
  orgId: string;
  currentDomain: string | null;
}

export function SetDomainForm({ orgId, currentDomain }: SetDomainFormProps) {
  const [domain, setDomain] = useState(currentDomain ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    setIsLoading(true);

    const result = await updateOrganizationDomain(orgId, domain.trim());

    if (result.success) {
      toast.success("Domain updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  async function handleRemove() {
    setIsLoading(true);

    const result = await updateOrganizationDomain(orgId, "");

    if (result.success) {
      toast.success("Domain removed");
      setDomain("");
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
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
          <Button disabled={isLoading} type="submit">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
          {currentDomain && (
            <Button
              disabled={isLoading}
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
