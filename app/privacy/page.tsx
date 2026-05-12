import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Lost and Found.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-semibold text-3xl">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">
        Lost and Found processes basic account details, organization membership,
        item listings, and claim information to operate the service.
      </p>
      <section className="space-y-2">
        <h2 className="font-semibold text-xl">Data we process</h2>
        <p className="text-muted-foreground text-sm">
          Account profile information from sign-in provider, item content you
          submit, uploaded images, and audit-related timestamps.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-xl">How data is used</h2>
        <p className="text-muted-foreground text-sm">
          Data is used to authenticate users, authorize access by organization,
          and support lost-and-found workflows.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-xl">Contact</h2>
        <p className="text-muted-foreground text-sm">
          Contact your organization administrator for data requests related to
          workspace content.
        </p>
      </section>
    </main>
  );
}
