
import { Building2, Ruler } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-xl">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <Ruler className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bar Optimization Pro</h1>
              <p className="text-blue-200 text-sm">Sistema de Otimização de Corte Industrial</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Building2 className="w-5 h-5" />
              <span className="text-sm">Modo Industrial</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
