import { ArrowLeft, FileSearch } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PostItemForm } from "@/components/forms/post-item-form";
import { PageLoadingSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { getOrganizationBySlug } from "@/server/organizations";
import { isOrgMember } from "@/server/permissions";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Post an item",
};

async function PostItemContent({
  slug,
  organizationId,
  organizationName,
}: {
  slug: string;
  organizationId: string;
  organizationName: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button
          asChild
          className="-ml-3 text-muted-foreground"
          size="sm"
          variant="ghost"
        >
          <Link href={`/app/${slug}`}>
            <ArrowLeft className="mr-1 size-4" />
            <span className="sr-only sm:not-sr-only">Items</span>
          </Link>
        </Button>
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileSearch className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-3xl">Post an Item</h1>
            <p className="text-muted-foreground text-sm">
              Report a lost or found item in {organizationName}
            </p>
          </div>
        </div>
        <PostItemForm organizationId={organizationId} organizationSlug={slug} />
      </div>
    </div>
  );
}

export default async function PostItemPage({ params }: { params: Params }) {
  const { slug } = await params;

  const [organization] = await Promise.all([getOrganizationBySlug(slug)]);

  if (!organization) {
    redirect("/app");
  }

  const isMember = await isOrgMember(organization.id);

  if (!isMember) {
    redirect(`/app/${slug}`);
  }

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <PostItemContent
        organizationId={organization.id}
        organizationName={organization.name}
        slug={slug}
      />
    </Suspense>
  );
}
