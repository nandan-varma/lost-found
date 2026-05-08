import { Header } from "@/components/header";
import { getOrganizations } from "@/server/organizations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizations = await getOrganizations();

  return (
    <div>
      <Header organizations={organizations} />
      {children}
    </div>
  );
}
