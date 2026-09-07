import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true },
  });

  return (
    <SidebarProvider>
      <AppSidebar orgName={organization?.name ?? "Avero Pro"} />
      <SidebarInset className="min-w-0">
        <Topbar name={user.name ?? user.email ?? ""} email={user.email ?? ""} role={user.role} />
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
