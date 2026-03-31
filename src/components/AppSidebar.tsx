import {
  BarChart3,
  Folder,
  Package,
  FileText,
  Settings,
  Scissors,
  Shield,
  LogOut,
  Ruler,
  Square,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isAdmin: boolean;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, tooltip: "Painel de indicadores e KPIs" },
  { id: "projects", label: "Projetos", icon: Folder, tooltip: "Gerenciar projetos de corte" },
  { id: "optimize", label: "Corte Linear", icon: Ruler, tooltip: "Otimização de corte de barras/perfis" },
  { id: "sheet-cutting", label: "Corte Chapas", icon: Square, tooltip: "Nesting de chapas com importação DXF" },
  { id: "sobras", label: "Estoque", icon: Package, tooltip: "Estoque de sobras disponíveis" },
  { id: "reports", label: "Relatórios", icon: FileText, tooltip: "Relatórios e exportações" },
  { id: "settings", label: "Configurações", icon: Settings, tooltip: "Cadastros e configurações do sistema" },
  { id: "laminas", label: "Lâminas", icon: Scissors, tooltip: "Gestão de lâminas de corte" },
];

const adminItem = { id: "admin", label: "Administrador", icon: Shield, tooltip: "Gerenciar usuários do sistema" };

export function AppSidebar({ activeSection, onSectionChange, isAdmin }: AppSidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const items = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">GMX Corte</span>
            <span className="text-xs text-muted-foreground">v2.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    tooltip={item.tooltip}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
