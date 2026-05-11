"use client";

import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrgNavProps {
  isAdmin: boolean;
  organizationSlug: string;
}

export function OrgNav({ isAdmin, organizationSlug }: OrgNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = `/app/${organizationSlug}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="fixed right-4 bottom-4 z-50 size-12 rounded-full shadow-lg lg:hidden"
          size="sm"
          variant="ghost"
        >
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem
          className={pathname === basePath ? "bg-accent" : ""}
          onClick={() => router.push(basePath)}
        >
          Items
        </DropdownMenuItem>
        <DropdownMenuItem
          className={pathname.startsWith(`${basePath}/new`) ? "bg-accent" : ""}
          onClick={() => router.push(`${basePath}/new`)}
        >
          Post Item
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            className={
              pathname.startsWith(`${basePath}/settings`) ? "bg-accent" : ""
            }
            onClick={() => router.push(`${basePath}/settings`)}
          >
            Settings
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
