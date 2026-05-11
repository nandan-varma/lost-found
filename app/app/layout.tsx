import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { HeaderSkeleton } from "@/components/skeletons";
import { getOrganizations } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

async function HeaderContent() {
  const sessionData = await getCurrentUser();

  if (!sessionData) {
    redirect("/login");
  }

  const { currentUser } = sessionData;
  const organizations = await getOrganizations(currentUser.id);
  const activeOrganizationId = sessionData.session.activeOrganizationId ?? null;

  return (
    <Header
      activeOrganizationId={activeOrganizationId}
      organizations={organizations}
      user={currentUser}
    />
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderContent />
      </Suspense>
      {children}
    </div>
  );
}
