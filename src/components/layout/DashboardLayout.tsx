import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();

  // Derive userName from the user object
  const userName =
    user && "firstName" in user
      ? `${user.firstName} ${user.lastName}`
      : "Klient";

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">
              Portal Serwisu Komputerowego
            </h1>
          </div>
          <div className="ml-auto px-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Zalogowany jako:{" "}
              <span className="font-medium text-foreground">{userName}</span>
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Wyloguj
            </Button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
