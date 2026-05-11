"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface OrgBreadcrumbProps {
  organizationName: string;
  organizationSlug: string;
}

export function OrgBreadcrumb({
  organizationName,
  organizationSlug,
}: OrgBreadcrumbProps) {
  const pathname = usePathname();
  const basePath = `/app/${organizationSlug}`;

  const currentPage = getCurrentPage(pathname, basePath);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/app">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={basePath}>{organizationName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function getCurrentPage(pathname: string, basePath: string): string {
  if (pathname.startsWith(`${basePath}/new`)) {
    return "New Post";
  }

  if (pathname.startsWith(`${basePath}/settings`)) {
    return "Settings";
  }

  if (pathname.startsWith(`${basePath}/items/`)) {
    return "Item Details";
  }

  return "Items";
}
