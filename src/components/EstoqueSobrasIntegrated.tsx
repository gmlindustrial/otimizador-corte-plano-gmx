import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useEstoqueSobras } from '@/hooks/useEstoqueSobras';

export const EstoqueSobrasIntegrated = () => {
  const { sobras, loading, adicionarSobra, usarSobra, removerSobra } =
    useEstoqueSobras();

  const [novaSobra, setNovaSobra] = useState({ comprimento: '', quantidade: '' });
  const [saving, setSaving] = useState(false);

  const handleAdicionar = async () => {
    const comp = parseInt(novaSobra.comprimento);
    const qtd = parseInt(novaSobra.quantidade) || 1;
    if (comp > 0 && qtd > 0) {
      setSaving(true);
      await adicionarSobra(comp, qtd);
      setSaving(false);
      setNovaSobra({ comprimento: '', quantidade: '' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> Estoque de Sobras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Comprimento (mm)</Label>
              <Input
                type="number"
                value={novaSobra.comprimento}
                onChange={(e) =>
                  setNovaSobra((p) => ({ ...p, comprimento: e.target.value }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={novaSobra.quantidade}
                onChange={(e) =>
                  setNovaSobra((p) => ({ ...p, quantidade: e.target.value }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="invisible">Add</Label>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleAdicionar}
                disabled={saving || !novaSobra.comprimento}
              >
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center">Carregando...</div>
          ) : (
            <div className="space-y-2">
              {sobras.map((sobra) => (
                <div
                  key={sobra.id}
                  className="flex items-center justify-between bg-green-50 p-2 rounded"
                >
                  <span>
                    {sobra.comprimento}mm - {sobra.quantidade} un
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => usarSobra(sobra.id)}
                    >
                      Usar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerSobra(sobra.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {sobras.length === 0 && (
                <div className="text-center text-sm text-gray-500">
                  Nenhuma sobra cadastrada
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
