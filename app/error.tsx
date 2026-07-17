"use client";

import { FileSearch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <FileSearch className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm">
          {error.digest
            ? `Error reference: ${error.digest}`
            : "An unexpected error occurred"}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
