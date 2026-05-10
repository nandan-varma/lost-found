"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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
  activeOrganizationId: string | null;
  organizations: Organization[];
}

export function OrganizationSwitcher({
  activeOrganizationId,
  organizations,
}: OrganizationSwitcherProps) {
  const router = useRouter();

  const handleChangeOrganization = async (organizationId: string) => {
    if (organizationId === CREATE_ORG_VALUE) {
      router.push("/dashboard?create=true");
      return;
    }

    const org = organizations.find((o) => o.id === organizationId);
    if (!org) {
      return;
    }

    await authClient.organization.setActive({
      organizationId,
    });

    router.push(`/dashboard/organization/${org.slug}`);
  };

  return (
    <Select
      onValueChange={handleChangeOrganization}
      value={activeOrganizationId ?? ""}
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
