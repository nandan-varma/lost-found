import type { Organization } from "@/db/schema";
import { Logout } from "./logout";
import { ModeSwitcher } from "./mode-switcher";
import { OrganizationSwitcher } from "./organization-switcher";

export function Header({ organizations }: { organizations: Organization[] }) {
  return (
    <header className="absolute top-0 right-0 flex w-full items-center justify-between p-4">
      <OrganizationSwitcher organizations={organizations} />
      <div className="flex items-center gap-2">
        <Logout />
        <ModeSwitcher />
      </div>
    </header>
  );
}
