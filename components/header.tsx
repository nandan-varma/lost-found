import Link from "next/link";
import type { Organization } from "@/db/schema";
import { Logout } from "./logout";
import { ModeSwitcher } from "./mode-switcher";
import { OrganizationSwitcher } from "./organization-switcher";

export function Header({ organizations }: { organizations: Organization[] }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link className="font-bold text-sm tracking-tight" href="/dashboard">
            Lost and Found
          </Link>
          {organizations.length > 0 && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <OrganizationSwitcher organizations={organizations} />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Logout />
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}
