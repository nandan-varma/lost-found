"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Organization, User as UserType } from "@/db/schema";
import { authClient } from "@/lib/auth-client";
import { ModeSwitcher } from "./mode-switcher";
import { OrganizationSwitcher } from "./organization-switcher";

interface HeaderProps {
  activeOrganizationId: string | null;
  organizations: Organization[];
  user: UserType;
}

export function Header({
  activeOrganizationId,
  organizations,
  user,
}: HeaderProps) {
  const router = useRouter();

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link className="font-bold text-sm tracking-tight" href="/app">
            Lost and Found
          </Link>
          {organizations.length > 0 && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <OrganizationSwitcher
                activeOrganizationId={activeOrganizationId}
                organizations={organizations}
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModeSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-8 rounded-full p-0" variant="ghost">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/sessions">Sessions</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
