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
  const basePath = `/app/${organizationSlug}`;

  function getTabValue(): string {
    if (pathname.startsWith(`${basePath}/new`)) {
      return "post";
    }
    if (isAdmin && pathname.startsWith(`${basePath}/settings`)) {
      return "members";
    }
    return "items";
  }

  const tabValue = getTabValue();

  return (
    <Tabs
      onValueChange={(value) =>
        router.push(
          `${basePath}${value === "items" ? "" : `/${value === "post" ? "new" : value}`}`
        )
      }
      value={tabValue}
    >
      <TabsList variant="line">
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="post">Post Item</TabsTrigger>
        {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
      </TabsList>
    </Tabs>
  );
}
