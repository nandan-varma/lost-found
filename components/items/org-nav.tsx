"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrgNavProps {
  organizationSlug: string;
}

export function OrgNav({ organizationSlug }: OrgNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = `/dashboard/organization/${organizationSlug}`;

  function getTabValue(): string {
    if (pathname.startsWith(`${basePath}/post`)) {
      return "post";
    }
    if (pathname.startsWith(`${basePath}/members`)) {
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
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
