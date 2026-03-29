
import { Scissors } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export const Header = () => {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex items-center gap-2">
        <Scissors className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-semibold text-foreground">
          OTIMIZADOR PLANO CORTE - GMX
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden md:block">
          Sistema de Otimização de Corte de Materiais
        </span>
      </div>
    </header>
  );
};
