import {
  Home,
  Wrench,
  Users,
  History,
  UserPlus,
  FilePlus,
  List,
  Package,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isEmployee, isClient } = useAuth();
  const location = useLocation();
  const role = isEmployee && user && "role" in user ? user.role : null;

  const groups = {
    manager: {
      label: "Zarządzanie",
      items: [
        { title: "Pulpit Managera", url: "/manager/dashboard", icon: Home },
        { title: "Pracownicy", url: "/manager/employees", icon: Users },
        { title: "Zlecenia", url: "/manager/orders", icon: List },
        { title: "Usługi", url: "/manager/services", icon: Briefcase },
      ],
    },
    office: {
      label: "Biuro Obsługi",
      items: [
        { title: "Pulpit Biura", url: "/office/dashboard", icon: Home },
        { title: "Klienci", url: "/office/clients", icon: Users },
        {
          title: "Zarejestruj Klienta",
          url: "/office/register-client",
          icon: UserPlus,
        },
        { title: "Nowe Zlecenie", url: "/office/new-order", icon: FilePlus },
        { title: "Lista Zleceń", url: "/office/orders", icon: List },
      ],
    },
    technician: {
      label: "Warsztat",
      items: [{ title: "Moje Zadania", url: "/tech/tasks", icon: Wrench }],
    },
    warehouse: {
      label: "Magazyn",
      items: [
        {
          title: "Stan Magazynowy",
          url: "/warehouse/inventory",
          icon: Package,
        },
      ],
    },
    client: {
      label: "Strefa Klienta",
      items: [
        { title: "Pulpit", url: "/client/dashboard", icon: Home },
        { title: "Historia Zleceń", url: "/client/orders", icon: History },
      ],
    },
  };

  let visibleGroups: {
    label: string;
    items: { title: string; url: string; icon: LucideIcon }[];
  }[] = [];

  if (isClient) {
    visibleGroups = [groups.client];
  } else if (isEmployee) {
    if (role === "MANAGER") {
      visibleGroups = [
        groups.manager,
        groups.office,
        groups.technician,
        groups.warehouse,
      ];
    } else if (role === "OFFICE") {
      visibleGroups = [groups.office];
    } else if (role === "TECHNICIAN") {
      visibleGroups = [groups.technician, groups.warehouse];
    } else if (role === "WAREHOUSE") {
      visibleGroups = [groups.warehouse];
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
