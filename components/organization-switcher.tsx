"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Organization } from "@/db/schema";
import { authClient } from "@/lib/auth-client";

const CREATE_ORG_VALUE = "__create__";

interface OrganizationSwitcherProps {
  organizations: Organization[];
}

export function OrganizationSwitcher({
  organizations,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const handleChangeOrganization = async (organizationId: string) => {
    if (organizationId === CREATE_ORG_VALUE) {
      router.push("/dashboard?create=true");
      return;
    }

    try {
      const { error } = await authClient.organization.setActive({
        organizationId,
      });

      if (error) {
        console.error(error);
        toast.error("Failed to switch organization");
        return;
      }

      toast.success("Organization switched successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch organization");
    }
  };

  return (
    <Select
      onValueChange={handleChangeOrganization}
      value={activeOrganization?.id ?? ""}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={CREATE_ORG_VALUE}>
          <div className="flex items-center gap-2">
            <Plus className="size-4" />
            Create Organization
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
