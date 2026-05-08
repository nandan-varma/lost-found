"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface OrgNavProps {
  organizationSlug: string;
}

const tabs = [
  { label: "Items", href: "" },
  { label: "Post Item", href: "/post" },
  { label: "Members", href: "/members" },
];

export function OrgNav({ organizationSlug }: OrgNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/organization/${organizationSlug}`;

  const activeTab = tabs.find((tab) => {
    const tabHref = `${basePath}${tab.href}`;
    if (tab.href === "") {
      return pathname === tabHref || pathname.startsWith(`${tabHref}/items/`);
    }
    return pathname.startsWith(tabHref);
  });

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const href = `${basePath}${tab.href}`;
        const isActive = activeTab?.href === tab.href;

        return (
          <Link
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              isActive
                ? "border-primary border-b-2 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            href={href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
