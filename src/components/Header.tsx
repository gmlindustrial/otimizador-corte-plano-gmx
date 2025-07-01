
import { Scissors, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Scissors className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">OTIMIZADOR PLANO CORTE - GMX</h1>
              <p className="text-blue-100 text-sm">Sistema de Otimização de Corte de Materiais</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right mr-4">
              <p className="text-sm text-blue-100">Bem-vindo ao sistema</p>
              <p className="text-xs text-blue-200">Versão 2.0</p>
            </div>
            <a href="/admin" className="text-sm underline hover:text-blue-200">
              Admin
            </a>
          </div>
          
          <Button variant="ghost" size="sm" className="md:hidden text-white">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
