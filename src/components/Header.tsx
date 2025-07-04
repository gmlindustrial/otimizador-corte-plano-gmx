
import { Scissors, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

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
            <div className="flex items-center mr-4 space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-100">Bem-vindo ao sistema</p>
                <p className="text-xs text-blue-200">Versão 2.0</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="md:hidden text-white">
            <LogOut className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="sm" className="md:hidden text-white">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
