
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { History, Search, Calendar, User, Building } from 'lucide-react';

interface HistoryPanelProps {
  history: Array<{
    id: string;
    project: any;
    pieces: any[];
    results: any;
    date: string;
    barLength: number;
  }>;
  onLoadHistory: (entry: any) => void;
}

export const HistoryPanel = ({ history, onLoadHistory }: HistoryPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item =>
    item.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.project.obra.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Otimizações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Barra de Pesquisa */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por projeto, cliente ou obra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Histórico */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredHistory.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{item.project.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.project.client}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {item.project.obra}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onLoadHistory(item)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Carregar
                  </Button>
                </div>

                {/* Resumo dos Resultados */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="font-semibold text-blue-600">{item.results.totalBars}</div>
                    <div className="text-blue-500">Barras</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="font-semibold text-green-600">{item.results.efficiency.toFixed(1)}%</div>
                    <div className="text-green-500">Eficiência</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="font-semibold text-red-600">{(item.results.totalWaste / 1000).toFixed(2)}m</div>
                    <div className="text-red-500">Desperdício</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded text-center">
                    <div className="font-semibold text-purple-600">{item.barLength/1000}m</div>
                    <div className="text-purple-500">Barra</div>
                  </div>
                </div>

                {/* Lista de Peças */}
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Peças:</strong> {item.pieces.map(p => `${p.quantity}x${p.length}mm`).join(', ')}
                </div>
              </div>
            ))}

            {filteredHistory.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                Nenhum resultado encontrado para "{searchTerm}"
              </div>
            )}

            {history.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma otimização no histórico ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
