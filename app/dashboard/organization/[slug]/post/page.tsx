import { FileSearch } from "lucide-react";
import { redirect } from "next/navigation";
import { PostItemForm } from "@/components/forms/post-item-form";
import { getOrganizationBySlug } from "@/server/organizations";
import { isOrgMember } from "@/server/permissions";

type Params = Promise<{ slug: string }>;

export default async function PostItemPage({ params }: { params: Params }) {
  const { slug } = await params;

  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    redirect("/dashboard");
  }

  const isMember = await isOrgMember(organization.id);

  if (!isMember) {
    redirect(`/dashboard/organization/${slug}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSearch className="size-5" />
        </div>
        <div>
          <h1 className="font-bold text-2xl">Post an Item</h1>
          <p className="text-muted-foreground text-sm">
            Report a lost or found item in {organization.name}
          </p>
        </div>
      </div>
      <PostItemForm organizationId={organization.id} organizationSlug={slug} />
    </div>
  );
}
