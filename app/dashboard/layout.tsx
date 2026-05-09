import { Header } from "@/components/header";
import { getOrganizations } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = await getCurrentUser();
  const organizations = await getOrganizations();

  return (
    <div>
      <Header organizations={organizations} user={currentUser} />
      {children}
    </div>
  );
}
