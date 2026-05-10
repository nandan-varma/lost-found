import { ArrowRight, Eye, MapPin, Search, Shield, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/get-session";

const features = [
  {
    icon: MapPin,
    title: "Report Lost & Found",
    description:
      "Quickly post items you've lost or found with photos and descriptions.",
  },
  {
    icon: Search,
    title: "Browse Listings",
    description:
      "Search through lost and found items posted by your community.",
  },
  {
    icon: Shield,
    title: "Claim Verification",
    description:
      "Secure claim process to ensure items are returned to the right owner.",
  },
  {
    icon: Users,
    title: "Organization-Focused",
    description:
      "Built for schools, offices, and communities to manage lost items together.",
  },
  {
    icon: Eye,
    title: "Image Uploads",
    description: "Upload multiple photos to help identify lost or found items.",
  },
];

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link
            className="font-bold text-sm tracking-tight sm:text-base"
            href="/"
          >
            Lost and Found
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ModeSwitcher />
            <Button
              asChild
              className="xs:inline-flex hidden"
              size="sm"
              variant="ghost"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="text-xs sm:text-sm" size="sm">
              <Link href="/login">
                <span className="xs:inline hidden">Get started</span>
                <span className="inline xs:hidden">Sign up</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16 md:py-32">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted px-2 py-1 text-muted-foreground text-xs sm:px-3 sm:py-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span className="xs:inline hidden">
              Track lost items across your organization
            </span>
            <span className="inline xs:hidden">Manage lost & found</span>
          </div>

          <h1 className="max-w-3xl font-bold text-3xl tracking-tight sm:text-4xl md:text-6xl">
            Find what&apos;s lost.
            <br />
            Return what&apos;s found.
          </h1>

          <p className="mt-4 max-w-lg text-muted-foreground text-sm sm:mt-6 sm:text-base md:text-lg">
            A simple way for your organization to track lost and found items.
            Report, browse, and claim items — all in one place.
          </p>

          <div className="mt-6 flex xs:flex-row flex-col gap-2 xs:gap-3 sm:mt-8">
            <Button asChild className="text-sm xs:text-base" size="lg">
              <Link href="/login">
                Get started
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="text-sm xs:text-base"
              size="lg"
              variant="outline"
            >
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-center font-bold text-2xl tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mb-8 text-center text-muted-foreground text-sm sm:mb-12">
              Three simple steps to reunite lost items with their owners
            </p>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Post an Item",
                  description:
                    "Snap a photo, add a description, and tag it as lost or found.",
                },
                {
                  step: "02",
                  title: "Browse & Match",
                  description:
                    "Community members browse listings to find their missing items.",
                },
                {
                  step: "03",
                  title: "Claim & Return",
                  description:
                    "Claim an item and coordinate its return through the platform.",
                },
              ].map((item) => (
                <div className="space-y-3" key={item.step}>
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-background font-mono text-muted-foreground text-sm">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-center font-bold text-2xl tracking-tight sm:text-3xl">
              Everything you need
            </h2>
            <p className="mb-8 text-center text-muted-foreground text-sm sm:mb-12">
              Features designed to make lost and found management effortless
            </p>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  className="space-y-2 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm sm:p-6"
                  key={feature.title}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-base">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 px-4 py-12 text-center sm:px-6 sm:py-16 md:py-24">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in and join an organization to start tracking lost and found
              items today.
            </p>
            <div className="mt-6 flex xs:flex-row flex-col xs:justify-center gap-2 xs:gap-3 sm:mt-8">
              <Button asChild className="text-sm xs:text-base" size="lg">
                <Link href="/login">
                  Get started
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="text-sm xs:text-base"
                size="lg"
                variant="outline"
              >
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-muted-foreground text-sm">
          <p>Lost and Found</p>
          <p>Built for organizations</p>
        </div>
      </footer>
    </div>
  );
}
