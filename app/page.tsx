import Image from "next/image";
import Link from "next/link";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <header className="absolute top-0 right-0 flex items-center justify-end p-4">
        <ModeSwitcher />
      </header>
      <div className="flex h-screen flex-col items-center justify-center gap-5 px-5 text-center">
        <div className="relative size-24">
          <Image
            alt="Lost and Found"
            className="rounded-lg dark:invert"
            fill
            priority
            sizes="96px"
            src="/better-auth-starter.png"
          />
        </div>

        <h1 className="font-bold text-4xl">Lost and Found</h1>

        <p className="max-w-md text-lg text-muted-foreground">
          Find what&apos;s lost. Return what&apos;s found. A simple way for your
          organization to track lost and found items.
        </p>

        <div className="flex gap-2">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
