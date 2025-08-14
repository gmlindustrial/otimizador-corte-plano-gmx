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
  const { sobras, loading, adicionarSobra, removerSobra } =
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
            <Select value={filtroPerfilId && filtroPerfilId.trim() !== '' ? filtroPerfilId : 'all'} onValueChange={(value) => setFiltroPerfilId(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os perfis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando estoque...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(sobrasAgrupadas).map(([perfilNome, sobrasDoGrupo]) => {
                const sobras = sobrasDoGrupo as any[];
                const totalSobras = sobras.reduce((acc, sobra) => acc + sobra.quantidade, 0);
                const perfilInfo = sobras[0]?.tipo_perfil;
                const kgPorMetro = sobras[0]?.kg_por_metro;
                
                return (
                  <Card key={perfilNome} className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-800">
                            {perfilNome}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-1">
                            {perfilInfo && (
                              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {perfilInfo}
                              </span>
                            )}
                            {kgPorMetro && (
                              <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                                {kgPorMetro} kg/m
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {totalSobras}
                          </div>
                          <div className="text-sm text-gray-500">
                            {totalSobras === 1 ? 'sobra' : 'sobras'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sobras.map((sobra) => (
                          <div
                            key={sobra.id}
                            className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">
                                {sobra.comprimento}mm
                              </div>
                              <div className="text-sm text-gray-600">
                                {sobra.quantidade} {sobra.quantidade === 1 ? 'unidade' : 'unidades'}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerSobra(sobra.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-3 h-8 w-8 p-0"
                              title="Remover sobra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {Object.keys(sobrasAgrupadas).length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sobra encontrada</h3>
                  <p className="text-sm text-gray-500">
                    {filtroPerfilId ? 'Não há sobras para o perfil selecionado.' : 'Adicione sobras usando o formulário acima.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
