import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SessionManager } from "@/components/sessions/session-manager";
import { Button } from "@/components/ui/button";

export default function SessionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <Button
          asChild
          className="-ml-3 text-muted-foreground"
          size="sm"
          variant="ghost"
        >
          <Link href="/app">
            <ArrowLeft className="mr-1 size-4" />
            <span className="sr-only sm:not-sr-only">Dashboard</span>
          </Link>
        </Button>
      </div>
      <SessionManager />
    </div>
  );
}
