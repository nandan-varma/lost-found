"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() =>
              authClient.signIn.social({
                callbackURL: "/app",
                provider: "microsoft",
              })
            }
            variant="outline"
          >
            <svg
              aria-label="Microsoft logo"
              className="mr-2 size-4"
              role="img"
              viewBox="0 0 23 23"
            >
              <path d="M0 0h10.909v10.909H0z" fill="#f25022" />
              <path d="M12.091 0H23v10.909H12.091z" fill="#7fba00" />
              <path d="M0 12.091h10.909V23H0z" fill="#00a4ef" />
              <path d="M12.091 12.091H23V23H12.091z" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </Button>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-muted-foreground text-xs *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
        By clicking continue, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </div>
    </div>
  );
}
