import { ArrowRight, Eye, MapPin, Search, Shield, Users } from "lucide-react";
import Link from "next/link";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";

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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link className="font-bold text-lg tracking-tight" href="/">
          Lost and Found
        </Link>
        <div className="flex items-center gap-3">
          <ModeSwitcher />
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center px-6 pt-24 pb-16 text-center md:pt-32 md:pb-20">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-muted-foreground text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            Track lost items across your organization
          </div>

          <h1 className="max-w-3xl font-bold text-4xl tracking-tight md:text-6xl">
            Find what&apos;s lost.
            <br />
            Return what&apos;s found.
          </h1>

          <p className="mt-6 max-w-lg text-muted-foreground md:text-lg">
            A simple way for your organization to track lost and found items.
            Report, browse, and claim items — all in one place.
          </p>

          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Get started
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-center font-bold text-2xl tracking-tight md:text-3xl">
              How it works
            </h2>
            <p className="mb-12 text-center text-muted-foreground">
              Three simple steps to reunite lost items with their owners
            </p>

            <div className="grid gap-8 md:grid-cols-3">
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
                  <h3 className="font-semibold text-xl">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-center font-bold text-2xl tracking-tight md:text-3xl">
              Everything you need
            </h2>
            <p className="mb-12 text-center text-muted-foreground">
              Features designed to make lost and found management effortless
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  className="space-y-2 rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm"
                  key={feature.title}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 px-6 py-16 text-center md:py-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-bold text-2xl tracking-tight md:text-3xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Create an account and join an organization to start tracking lost
              and found items today.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Sign up free
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
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
