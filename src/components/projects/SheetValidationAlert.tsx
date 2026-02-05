import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Plus, Loader2 } from 'lucide-react';
import type { SheetInventorPiece } from '@/components/file-upload/FileParsingService';
import type { Material } from '@/services/interfaces';
import { materialService } from '@/services/entities/MaterialService';

export interface SheetValidation {
  descricao: string;
  pieces: SheetInventorPiece[];
  totalQuantidade: number;
  material?: Material;
  suggestions: Material[];
}

interface SheetValidationAlertProps {
  validations: SheetValidation[];
  onResolve: (validation: SheetValidation, selectedMaterial: Material) => void;
  onCreateAndResolve?: (descricao: string, material: { tipo: string; descricao: string; comprimento_padrao: number; tipo_corte: 'chapa' }) => Promise<void>;
}

interface InlineFormState {
  tipo: string;
  descricao: string;
  comprimento_padrao: string;
  saving: boolean;
  showForm: boolean;
}

function detectTipoChapa(descricao: string): string {
  if (!descricao) return 'CHAPA';
  // Extrair tipo baseado na descrição (ex: "Chapa 6,4" -> "CHAPA")
  const match = descricao.toUpperCase().match(/^([A-Z]+)/);
  return match ? match[1] : 'CHAPA';
}

function groupByDescricao(pieces: SheetInventorPiece[]): SheetValidation[] {
  const map = new Map<string, SheetValidation>();

  for (const piece of pieces) {
    const key = piece.descricao || 'SEM_DESCRICAO';
    const existing = map.get(key);
    if (existing) {
      existing.pieces.push(piece);
      existing.totalQuantidade += piece.quantity;
    } else {
      map.set(key, {
        descricao: key,
        pieces: [piece],
        totalQuantidade: piece.quantity,
        suggestions: []
      });
    }
  }

  return Array.from(map.values());
}

export const SheetValidationAlert = ({ validations, onResolve, onCreateAndResolve }: SheetValidationAlertProps) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, InlineFormState>>({});
  const [sheetMaterials, setSheetMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar materiais de chapa disponíveis
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const result = await materialService.getByTipoCorte('chapa');
        if (result.success && result.data) {
          setSheetMaterials(result.data);
        }
      } catch (error) {
        console.error('Erro ao buscar materiais de chapa:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // Adicionar sugestões aos grupos baseado nos materiais disponíveis
  const groupsWithSuggestions = validations.map(v => {
    const descLower = v.descricao.toLowerCase();
    const suggestions = sheetMaterials.filter(m => {
      const matDescLower = m.descricao.toLowerCase();
      // Buscar materiais que contenham parte da descrição
      return matDescLower.includes(descLower) ||
             descLower.includes(matDescLower) ||
             // Tentar encontrar por espessura (ex: "6,4" ou "6.4")
             (v.pieces[0]?.thickness && matDescLower.includes(String(v.pieces[0].thickness)));
    });
    return { ...v, suggestions };
  });

  if (loading) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
        <AlertDescription>Carregando materiais de chapa...</AlertDescription>
      </Alert>
    );
  }

  if (groupsWithSuggestions.length === 0) return null;

  const initForm = (descricao: string) => {
    if (forms[descricao]) return;
    const thickness = validations.find(v => v.descricao === descricao)?.pieces[0]?.thickness;
    setForms(prev => ({
      ...prev,
      [descricao]: {
        tipo: detectTipoChapa(descricao),
        descricao: descricao,
        comprimento_padrao: '6000', // 6000mm padrão para chapas
        saving: false,
        showForm: false,
      },
    }));
  };

  const updateForm = (key: string, field: keyof InlineFormState, value: string | boolean) => {
    setForms(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleCreate = async (group: SheetValidation) => {
    if (!onCreateAndResolve) return;
    const form = forms[group.descricao];
    if (!form) return;

    const comprimentoPadrao = parseFloat(form.comprimento_padrao.replace(',', '.'));
    if (isNaN(comprimentoPadrao) || comprimentoPadrao <= 0) return;

    updateForm(group.descricao, 'saving', true);
    try {
      await onCreateAndResolve(group.descricao, {
        tipo: form.tipo,
        descricao: form.descricao,
        comprimento_padrao: comprimentoPadrao,
        tipo_corte: 'chapa',
      });
    } finally {
      updateForm(group.descricao, 'saving', false);
    }
  };

  const handleToggle = (key: string) => {
    if (expandedKey === key) {
      setExpandedKey(null);
    } else {
      setExpandedKey(key);
      initForm(key);
    }
  };

  const totalPecas = validations.reduce((sum, v) => sum + v.pieces.length, 0);

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="w-4 h-4 text-orange-600" />
      <AlertDescription>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-orange-800">
              {totalPecas} chapa(s) sem material cadastrado ({groupsWithSuggestions.length} tipo(s) distinto(s))
            </p>
            <p className="text-sm text-orange-700">
              Cadastre os materiais abaixo para vincular automaticamente a todas as chapas correspondentes.
            </p>
          </div>

          <div className="space-y-3">
            {groupsWithSuggestions.map((group) => (
              <Card key={group.descricao} className="border-orange-200 bg-white">
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => handleToggle(group.descricao)}
                >
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.descricao || 'Sem descrição'}</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        {group.pieces.length} chapa(s)
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedKey === group.descricao ? 'Ocultar' : 'Resolver'}
                    </Button>
                  </CardTitle>
                </CardHeader>

                {expandedKey === group.descricao && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <p>Tags: {group.pieces.map(p => p.tag).join(', ')}</p>
                        <p>Quantidade total: {group.totalQuantidade}</p>
                        <p>Dimensões: {group.pieces.map(p => `${p.width}×${p.height}mm`).join(', ')}</p>
                        {group.pieces[0]?.thickness && (
                          <p>Espessura: {group.pieces[0].thickness}mm</p>
                        )}
                      </div>

                      {group.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Materiais similares encontrados:</p>
                          <div className="space-y-2">
                            {group.suggestions.map((material) => (
                              <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div>
                                  <p className="font-medium">{material.descricao}</p>
                                  <p className="text-sm text-gray-600">
                                    {material.tipo} | {material.comprimento_padrao}mm
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => onResolve(group, material)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Usar este ({group.pieces.length})
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {onCreateAndResolve && forms[group.descricao] && (
                        <div>
                          {!forms[group.descricao].showForm ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-50"
                              onClick={() => updateForm(group.descricao, 'showForm', true)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Cadastrar Novo Material de Chapa
                            </Button>
                          ) : (
                            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                              <p className="text-sm font-medium text-blue-800">Cadastrar Novo Material</p>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Tipo</label>
                                  <Input
                                    value={forms[group.descricao].tipo}
                                    onChange={(e) => updateForm(group.descricao, 'tipo', e.target.value)}
                                    placeholder="CHAPA"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Descrição</label>
                                  <Input
                                    value={forms[group.descricao].descricao}
                                    onChange={(e) => updateForm(group.descricao, 'descricao', e.target.value)}
                                    placeholder="Chapa 6,4mm A36"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Comprimento padrão (mm)</label>
                                  <Input
                                    value={forms[group.descricao].comprimento_padrao}
                                    onChange={(e) => updateForm(group.descricao, 'comprimento_padrao', e.target.value)}
                                    placeholder="Ex: 6000"
                                    className="h-9 text-sm"
                                    type="text"
                                    inputMode="decimal"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-blue-600">
                                  Será vinculado a {group.pieces.length} chapa(s)
                                </p>
                                <Button
                                  size="sm"
                                  disabled={
                                    forms[group.descricao]?.saving ||
                                    !(forms[group.descricao]?.comprimento_padrao?.trim()) ||
                                    !(forms[group.descricao]?.descricao?.trim()) ||
                                    !(forms[group.descricao]?.tipo?.trim())
                                  }
                                  onClick={() => handleCreate(group)}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  {forms[group.descricao].saving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                      Salvando...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Cadastrar e Vincular
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!onCreateAndResolve && group.suggestions.length === 0 && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Nenhum material de chapa similar encontrado.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Função auxiliar para agrupar peças por descrição
export { groupByDescricao };
