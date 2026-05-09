import { Suspense } from "react";
import { Header } from "@/components/header";
import { HeaderSkeleton } from "@/components/skeletons";
import { getOrganizations } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

async function HeaderContent() {
  const { currentUser } = await getCurrentUser();
  const organizations = await getOrganizations();

  return <Header organizations={organizations} user={currentUser} />;
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
