import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/layout/user-menu";
import { BackButton } from "@/components/back-button";

export function Topbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <BackButton />
      <form action="/clients" className="flex-1 max-w-sm" data-tour="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Rechercher un client…"
            className="h-8 pl-8"
          />
        </div>
      </form>
      <div className="ml-auto flex items-center gap-2">
        <UserMenu name={name} email={email} role={role} />
      </div>
    </header>
  );
}
