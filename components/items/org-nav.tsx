"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrgNavProps {
  isAdmin: boolean;
  organizationSlug: string;
}

export function OrgNav({ isAdmin, organizationSlug }: OrgNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = `/dashboard/organization/${organizationSlug}`;

  function getTabValue(): string {
    if (pathname.startsWith(`${basePath}/post`)) {
      return "post";
    }
    if (isAdmin && pathname.startsWith(`${basePath}/members`)) {
      return "members";
    }
    return "items";
  }

  const tabValue = getTabValue();

  return (
    <Tabs
      onValueChange={(value) =>
        router.push(`${basePath}${value === "items" ? "" : `/${value}`}`)
      }
      value={tabValue}
    >
      <TabsList variant="line">
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="post">Post Item</TabsTrigger>
        {isAdmin && <TabsTrigger value="members">Members</TabsTrigger>}
      </TabsList>
    </Tabs>
  );
}
