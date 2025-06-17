
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Plus, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export interface SobraItem {
  id: string;
  comprimento: number;
  localizacao: string;
  tipoMaterial: string;
  disponivel: boolean;
  dataAdicao: string;
}

interface EstoqueSobrasProps {
  tipoMaterial?: string;
}

export const EstoqueSobras = ({ tipoMaterial }: EstoqueSobrasProps) => {
  const [sobras, setSobras] = useState<SobraItem[]>([]);
  const [novaSobra, setNovaSobra] = useState({
    comprimento: '',
    localizacao: ''
  });

  const adicionarSobra = () => {
    const comprimento = parseInt(novaSobra.comprimento);
    
    if (comprimento > 0 && novaSobra.localizacao.trim() && tipoMaterial) {
      const sobra: SobraItem = {
        id: Date.now().toString(),
        comprimento,
        localizacao: novaSobra.localizacao.trim(),
        tipoMaterial,
        disponivel: true,
        dataAdicao: new Date().toISOString()
      };
      
      setSobras(prev => [sobra, ...prev]);
      setNovaSobra({ comprimento: '', localizacao: '' });
      toast.success(`Sobra adicionada: ${comprimento}mm - ${novaSobra.localizacao}`);
    }
  };

  const removerSobra = (id: string) => {
    setSobras(prev => prev.filter(s => s.id !== id));
    toast.info('Sobra removida do estoque');
  };

  const marcarComoUsada = (id: string) => {
    setSobras(prev => prev.map(s => 
      s.id === id ? { ...s, disponivel: false } : s
    ));
    toast.success('Sobra marcada como utilizada');
  };

  const sobrasDisponiveis = sobras.filter(s => s.disponivel);
  const sobrasUsadas = sobras.filter(s => !s.disponivel);

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Estoque de Sobras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!tipoMaterial ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">
                Selecione um tipo de material no projeto para gerenciar sobras
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Material Ativo:</strong> {tipoMaterial}
                </p>
              </div>

              {/* Adicionar Nova Sobra */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Comprimento (mm)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 850"
                    value={novaSobra.comprimento}
                    onChange={(e) => setNovaSobra(prev => ({ ...prev, comprimento: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Localização
                  </Label>
                  <Input
                    placeholder="Ex: Prateleira A1"
                    value={novaSobra.localizacao}
                    onChange={(e) => setNovaSobra(prev => ({ ...prev, localizacao: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="invisible">Ação</Label>
                  <Button 
                    onClick={adicionarSobra}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!novaSobra.comprimento || !novaSobra.localizacao}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de Sobras Disponíveis */}
              {sobrasDisponiveis.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Sobras Disponíveis ({sobrasDisponiveis.length})
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {sobrasDisponiveis.map((sobra) => (
                      <div key={sobra.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {sobra.comprimento}mm
                          </span>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {sobra.localizacao}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => marcarComoUsada(sobra.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                          >
                            Usar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerSobra(sobra.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de Sobras Usadas */}
              {sobrasUsadas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-500 flex items-center gap-2">
                    Sobras Utilizadas ({sobrasUsadas.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {sobrasUsadas.map((sobra) => (
                      <div key={sobra.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg opacity-60">
                        <div className="flex-1">
                          <span className="text-sm line-through">
                            {sobra.comprimento}mm - {sobra.localizacao}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerSobra(sobra.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sobras.length === 0 && (
                <div className="text-center py-6">
                  <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">
                    Nenhuma sobra cadastrada para este material
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
