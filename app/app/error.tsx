"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
      </div>
      <h1 className="mb-2 font-bold text-2xl">Dashboard error</h1>
      <p className="mb-6 text-muted-foreground text-sm">
        {error.digest
          ? `Error reference: ${error.digest}`
          : "Something went wrong loading the dashboard"}
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/app">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
