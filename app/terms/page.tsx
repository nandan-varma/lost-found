import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Lost and Found.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-semibold text-3xl">Terms of Service</h1>
      <p className="text-muted-foreground text-sm">
        By using Lost and Found, you agree to use the service for lawful
        organizational lost-and-found purposes only.
      </p>
      <section className="space-y-2">
        <h2 className="font-semibold text-xl">Acceptable use</h2>
        <p className="text-muted-foreground text-sm">
          Do not upload illegal, harmful, or misleading content. Organization
          administrators are responsible for moderation in their workspace.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-xl">Account responsibility</h2>
        <p className="text-muted-foreground text-sm">
          You are responsible for activity under your account and for
          maintaining access to your identity provider account.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-xl">Service availability</h2>
        <p className="text-muted-foreground text-sm">
          The service is provided as-is and may change over time. We may suspend
          or remove abusive accounts.
        </p>
      </section>
    </main>
  );
}
