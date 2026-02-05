import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Scissors, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ProjetoChapaGroup, ProjetoChapa } from '@/types/project';

interface SheetGroupCardProps {
  groups: ProjetoChapaGroup[];
  onOptimizeGroup: (group: ProjetoChapaGroup, selectedChapas: ProjetoChapa[]) => void;
  loading?: boolean;
}

export const SheetGroupCard = ({ groups, onOptimizeGroup, loading }: SheetGroupCardProps) => {
  const [selectedChapas, setSelectedChapas] = useState<Record<string, Set<string>>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Gerar chave unica para cada grupo
  const getGroupKey = (group: ProjetoChapaGroup) =>
    `${group.espessura_mm}_${group.material_id || 'sem_material'}`;

  // Toggle selecao de chapa individual
  const toggleChapaSelection = (groupKey: string, chapaId: string) => {
    setSelectedChapas(prev => {
      const groupSet = new Set(prev[groupKey] || []);
      if (groupSet.has(chapaId)) {
        groupSet.delete(chapaId);
      } else {
        groupSet.add(chapaId);
      }
      return { ...prev, [groupKey]: groupSet };
    });
  };

  // Toggle selecao de todas as chapas do grupo
  const toggleAllInGroup = (groupKey: string, chapas: ProjetoChapa[]) => {
    setSelectedChapas(prev => {
      const groupSet = new Set(prev[groupKey] || []);
      const allSelected = chapas.every(c => groupSet.has(c.id));

      if (allSelected) {
        // Desmarcar todas
        return { ...prev, [groupKey]: new Set() };
      } else {
        // Marcar todas
        return { ...prev, [groupKey]: new Set(chapas.map(c => c.id)) };
      }
    });
  };

  // Verificar se grupo pode ser otimizado
  const canOptimize = (group: ProjetoChapaGroup, groupKey: string) => {
    const selected = selectedChapas[groupKey];
    if (!selected || selected.size === 0) return false;
    // Verificar se todas as chapas selecionadas tem material
    const selectedChapasArray = group.chapas.filter(c => selected.has(c.id));
    return selectedChapasArray.every(c => !c.material_nao_encontrado);
  };

  // Handler para iniciar otimizacao
  const handleOptimize = (group: ProjetoChapaGroup, groupKey: string) => {
    const selected = selectedChapas[groupKey];
    if (!selected) return;
    const selectedChapasArray = group.chapas.filter(c => selected.has(c.id));
    onOptimizeGroup(group, selectedChapasArray);
  };

  // Calcular area em m²
  const formatArea = (areaMm2: number) => {
    const areaM2 = areaMm2 / 1_000_000;
    return areaM2.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Agrupando chapas...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
          <Scissors className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">Nenhum grupo de chapas para otimizar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Chapas agrupadas por <span className="font-medium">espessura + material</span> para otimizacao conjunta.
      </div>

      <Accordion
        type="multiple"
        value={expandedGroups}
        onValueChange={setExpandedGroups}
        className="space-y-4"
      >
        {groups.map((group) => {
          const groupKey = getGroupKey(group);
          const selected = selectedChapas[groupKey] || new Set();
          const allSelected = group.chapas.length > 0 && group.chapas.every(c => selected.has(c.id));
          const someSelected = selected.size > 0;
          const hasMaterialIssue = group.chapas.some(c => c.material_nao_encontrado);
          const selectedCount = selected.size;
          const selectedQtd = group.chapas
            .filter(c => selected.has(c.id))
            .reduce((sum, c) => sum + c.quantidade, 0);

          return (
            <AccordionItem
              key={groupKey}
              value={groupKey}
              className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              <AccordionTrigger className="hover:no-underline px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 transition-all duration-300">
                <div className="flex items-center gap-4 flex-1">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleAllInGroup(groupKey, group.chapas)}
                    onClick={(e) => e.stopPropagation()}
                    className="scale-110"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 text-lg">
                        Espessura: {group.espessura_mm}mm
                      </span>
                      {group.material ? (
                        <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">
                          {group.material.descricao}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Sem material
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 px-3 py-1">
                      {group.chapas.length} tipo(s)
                    </Badge>
                    <Badge variant="outline" className="border-purple-200 text-purple-700 px-3 py-1">
                      {group.total_quantidade} un
                    </Badge>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 px-3 py-1">
                      {formatArea(group.total_area_mm2)} m²
                    </Badge>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptimize(group, groupKey);
                      }}
                      disabled={!canOptimize(group, groupKey)}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 ml-2"
                    >
                      <Calculator className="w-4 h-4 mr-1" />
                      Otimizar
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 py-4 bg-white">
                <div className="space-y-4">
                  {/* Lista de chapas do grupo */}
                  <div className="space-y-2">
                    {group.chapas.map((chapa) => {
                      const isSelected = selected.has(chapa.id);
                      const hasIssue = chapa.material_nao_encontrado;

                      return (
                        <div
                          key={chapa.id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            hasIssue
                              ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
                              : isSelected
                              ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
                              : 'bg-gradient-to-r from-gray-50 to-white border-gray-100 hover:border-teal-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleChapaSelection(groupKey, chapa.id)}
                              disabled={hasIssue}
                              className="scale-110"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-600">Tag:</span>
                                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium text-sm">
                                  {chapa.tag}
                                </span>
                                <span className="text-sm font-semibold text-gray-600 ml-2">Posicao:</span>
                                <span className="font-mono text-sm text-gray-700">
                                  {chapa.posicao}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-sm">
                                  {chapa.largura_mm} × {chapa.altura_mm} mm
                                </span>
                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-sm">
                                  Qtd: {chapa.quantidade}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={
                                    chapa.status === 'aguardando_otimizacao'
                                      ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                      : chapa.status === 'otimizada'
                                      ? 'border-blue-200 text-blue-700 bg-blue-50'
                                      : 'border-green-200 text-green-700 bg-green-50'
                                  }
                                >
                                  {chapa.status === 'aguardando_otimizacao'
                                    ? 'Aguardando'
                                    : chapa.status === 'otimizada'
                                    ? 'Otimizada'
                                    : 'Cortada'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {hasIssue && (
                            <span className="text-orange-600 flex items-center gap-1 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              Defina o material
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo da selecao */}
                  {someSelected && (
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                      <Badge className="bg-teal-100 text-teal-800">
                        {selectedCount} selecionada(s)
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Total: {selectedQtd} unidade(s)
                      </span>
                    </div>
                  )}

                  {hasMaterialIssue && (
                    <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      Algumas chapas nao podem ser otimizadas porque nao tem material cadastrado.
                      Defina o material no alerta acima.
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
