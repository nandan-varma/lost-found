import { FileSearch } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PostItemForm } from "@/components/forms/post-item-form";
import { PageLoadingSkeleton } from "@/components/skeletons";
import { getOrganizationBySlug } from "@/server/organizations";
import { isOrgMember } from "@/server/permissions";

type Params = Promise<{ slug: string }>;

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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSearch className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-3xl">Post an Item</h1>
          <p className="text-muted-foreground text-sm">
            Report a lost or found item in {organizationName}
          </p>
        </div>
      </div>
      <PostItemForm organizationId={organizationId} organizationSlug={slug} />
    </div>
  );
}

export default async function PostItemPage({ params }: { params: Params }) {
  const { slug } = await params;

  // Parallel fetch organization and check membership
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
