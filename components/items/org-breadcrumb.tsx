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
  isAdmin: boolean;
  organizationName: string;
  organizationSlug: string;
}

export function OrgBreadcrumb({
  isAdmin,
  organizationName,
  organizationSlug,
}: OrgBreadcrumbProps) {
  const pathname = usePathname();
  const basePath = `/app/${organizationSlug}`;

  const currentPage = getCurrentPage(pathname, basePath, isAdmin);

  return (
    <Breadcrumb className="mb-4">
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
        {currentPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function getCurrentPage(
  pathname: string,
  basePath: string,
  isAdmin: boolean
): string | null {
  if (pathname.startsWith(`${basePath}/new`)) {
    return "Post Item";
  }

  if (pathname.startsWith(`${basePath}/settings`) && isAdmin) {
    return "Settings";
  }

  if (
    pathname.startsWith(`${basePath}/items/`) &&
    !pathname.endsWith("/items")
  ) {
    return "Item Details";
  }

  return null;
}
