import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useEstoqueSobras } from '@/hooks/useEstoqueSobras';
import { usePerfilService } from '@/hooks/services/usePerfilService';

export const EstoqueSobrasIntegrated = () => {
  const { sobras, loading, adicionarSobra, usarSobra, removerSobra } =
    useEstoqueSobras();
  const { perfis } = usePerfilService();

  const [novaSobra, setNovaSobra] = useState({ comprimento: '', quantidade: '', perfilId: '' });
  const [saving, setSaving] = useState(false);
  const [filtroPerfilId, setFiltroPerfilId] = useState<string>('');

  const handleAdicionar = async () => {
    const comp = parseInt(novaSobra.comprimento);
    const qtd = parseInt(novaSobra.quantidade) || 1;
    if (comp > 0 && qtd > 0 && novaSobra.perfilId) {
      setSaving(true);
      await adicionarSobra(comp, qtd, undefined, novaSobra.perfilId);
      setSaving(false);
      setNovaSobra({ comprimento: '', quantidade: '', perfilId: '' });
    }
  };

  // Filtrar sobras por perfil
  const sobrasFiltradas = filtroPerfilId 
    ? sobras.filter(s => s.id_perfis_materiais === filtroPerfilId)
    : sobras;

  // Agrupar sobras por perfil
  const sobrasAgrupadas = sobrasFiltradas.reduce((grupos: any, sobra) => {
    const perfilKey = sobra.descricao_perfil || 'Sem Perfil';
    if (!grupos[perfilKey]) {
      grupos[perfilKey] = [];
    }
    grupos[perfilKey].push(sobra);
    return grupos;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> Estoque de Sobras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Filtro por Perfil */}
          <div className="space-y-2">
            <Label>Filtrar por Perfil</Label>
            <Select value={filtroPerfilId} onValueChange={setFiltroPerfilId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os perfis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os perfis</SelectItem>
                {perfis.map((perfil) => (
                  <SelectItem key={perfil.id} value={perfil.id}>
                    {perfil.descricao_perfil} ({perfil.tipo_perfil})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formulário de Adição */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={novaSobra.perfilId} onValueChange={(value) => 
                setNovaSobra(p => ({ ...p, perfilId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {perfis.map((perfil) => (
                    <SelectItem key={perfil.id} value={perfil.id}>
                      {perfil.descricao_perfil} ({perfil.tipo_perfil})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                disabled={saving || !novaSobra.comprimento || !novaSobra.perfilId}
              >
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center">Carregando...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(sobrasAgrupadas).map(([perfilNome, sobrasDoGrupo]) => (
                <div key={perfilNome} className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">
                    {perfilNome}
                  </h4>
                  <div className="space-y-2">
                    {(sobrasDoGrupo as any[]).map((sobra) => (
                      <div
                        key={sobra.id}
                        className="flex items-center justify-between bg-green-50 p-2 rounded"
                      >
                        <span className="text-sm">
                          {sobra.comprimento}mm - {sobra.quantidade} un
                          {sobra.tipo_perfil && (
                            <span className="text-gray-500 ml-2">({sobra.tipo_perfil})</span>
                          )}
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
                  </div>
                </div>
              ))}
              {Object.keys(sobrasAgrupadas).length === 0 && (
                <div className="text-center text-sm text-gray-500">
                  Nenhuma sobra encontrada
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
