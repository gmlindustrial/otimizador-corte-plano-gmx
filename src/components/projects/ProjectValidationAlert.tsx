import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Plus, Loader2 } from 'lucide-react';
import type { ProjectPieceValidation, PerfilMaterial } from '@/types/project';

interface ProjectValidationAlertProps {
  validations: ProjectPieceValidation[];
  onResolve: (validation: ProjectPieceValidation, selectedPerfil: PerfilMaterial) => void;
  onCreateAndResolve?: (descricaoRaw: string, perfil: { tipo_perfil: string; descricao_perfil: string; kg_por_metro: number }) => Promise<void>;
  onNavigateToProfileManagement?: () => void;
}

interface InlineFormState {
  tipo_perfil: string;
  descricao_perfil: string;
  kg_por_metro: string;
  saving: boolean;
  showForm: boolean;
}

function detectTipoPerfil(descricao: string): string {
  if (!descricao) return 'OUTRO';
  const match = descricao.toUpperCase().match(/^([A-Z]+)/);
  return match ? match[1] : 'OUTRO';
}

interface GroupedValidation {
  descricaoRaw: string;
  validations: ProjectPieceValidation[];
  suggestions: PerfilMaterial[];
  totalQuantidade: number;
}

function groupByDescricao(validations: ProjectPieceValidation[]): GroupedValidation[] {
  const map = new Map<string, GroupedValidation>();

  for (const v of validations) {
    const key = v.peca.descricao_perfil_raw || 'SEM_DESCRICAO';
    const existing = map.get(key);
    if (existing) {
      existing.validations.push(v);
      existing.totalQuantidade += v.peca.quantidade;
      for (const s of v.suggestions) {
        if (!existing.suggestions.some(es => es.id === s.id)) {
          existing.suggestions.push(s);
        }
      }
    } else {
      map.set(key, {
        descricaoRaw: key,
        validations: [v],
        suggestions: [...v.suggestions],
        totalQuantidade: v.peca.quantidade,
      });
    }
  }

  return Array.from(map.values());
}

export const ProjectValidationAlert = ({ validations, onResolve, onCreateAndResolve, onNavigateToProfileManagement }: ProjectValidationAlertProps) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, InlineFormState>>({});

  const groups = groupByDescricao(validations);

  if (groups.length === 0) return null;

  const initForm = (descricaoRaw: string) => {
    if (forms[descricaoRaw]) return;
    setForms(prev => ({
      ...prev,
      [descricaoRaw]: {
        tipo_perfil: detectTipoPerfil(descricaoRaw),
        descricao_perfil: descricaoRaw,
        kg_por_metro: '',
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

  const handleCreate = async (group: GroupedValidation) => {
    if (!onCreateAndResolve) return;
    const form = forms[group.descricaoRaw];
    if (!form) return;

    const kgPorMetro = parseFloat(form.kg_por_metro.replace(',', '.'));
    if (isNaN(kgPorMetro) || kgPorMetro <= 0) return;

    updateForm(group.descricaoRaw, 'saving', true);
    try {
      await onCreateAndResolve(group.descricaoRaw, {
        tipo_perfil: form.tipo_perfil,
        descricao_perfil: form.descricao_perfil,
        kg_por_metro: kgPorMetro,
      });
    } finally {
      updateForm(group.descricaoRaw, 'saving', false);
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

  const totalPecas = validations.length;

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="w-4 h-4 text-orange-600" />
      <AlertDescription>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-orange-800">
              {totalPecas} peça(s) sem perfil ({groups.length} perfil(s) distinto(s))
            </p>
            <p className="text-sm text-orange-700">
              Cadastre os perfis abaixo para vincular automaticamente a todas as peças correspondentes.
            </p>
          </div>

          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.descricaoRaw} className="border-orange-200 bg-white">
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => handleToggle(group.descricaoRaw)}
                >
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.descricaoRaw || 'Sem descrição'}</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        {group.validations.length} peça(s)
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedKey === group.descricaoRaw ? 'Ocultar' : 'Resolver'}
                    </Button>
                  </CardTitle>
                </CardHeader>

                {expandedKey === group.descricaoRaw && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <p>Posições: {group.validations.map(v => v.peca.posicao).join(', ')}</p>
                        <p>Quantidade total: {group.totalQuantidade}</p>
                      </div>

                      {group.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Perfis similares encontrados:</p>
                          <div className="space-y-2">
                            {group.suggestions.map((perfil) => (
                              <div key={perfil.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div>
                                  <p className="font-medium">{perfil.descricao_perfil}</p>
                                  <p className="text-sm text-gray-600">
                                    {perfil.tipo_perfil} | {perfil.kg_por_metro} kg/m
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    for (const v of group.validations) {
                                      onResolve(v, perfil);
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Usar este ({group.validations.length})
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {onCreateAndResolve && forms[group.descricaoRaw] && (
                        <div>
                          {!forms[group.descricaoRaw].showForm ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-50"
                              onClick={() => updateForm(group.descricaoRaw, 'showForm', true)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Cadastrar Novo Perfil
                            </Button>
                          ) : (
                            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                              <p className="text-sm font-medium text-blue-800">Cadastrar Novo Perfil</p>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Tipo</label>
                                  <Input
                                    value={forms[group.descricaoRaw].tipo_perfil}
                                    onChange={(e) => updateForm(group.descricaoRaw, 'tipo_perfil', e.target.value)}
                                    placeholder="W, L, C..."
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Descrição</label>
                                  <Input
                                    value={forms[group.descricaoRaw].descricao_perfil}
                                    onChange={(e) => updateForm(group.descricaoRaw, 'descricao_perfil', e.target.value)}
                                    placeholder="W200X35.9"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Peso por metro (kg/m)</label>
                                  <Input
                                    value={forms[group.descricaoRaw].kg_por_metro}
                                    onChange={(e) => updateForm(group.descricaoRaw, 'kg_por_metro', e.target.value)}
                                    placeholder="Ex: 35.9"
                                    className="h-9 text-sm"
                                    type="text"
                                    inputMode="decimal"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-blue-600">
                                  Será vinculado a {group.validations.length} peça(s)
                                </p>
                                <Button
                                  size="sm"
                                  disabled={
                                    forms[group.descricaoRaw]?.saving ||
                                    !(forms[group.descricaoRaw]?.kg_por_metro?.trim()) ||
                                    !(forms[group.descricaoRaw]?.descricao_perfil?.trim()) ||
                                    !(forms[group.descricaoRaw]?.tipo_perfil?.trim())
                                  }
                                  onClick={() => handleCreate(group)}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  {forms[group.descricaoRaw].saving ? (
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
                            Nenhum perfil similar encontrado.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={onNavigateToProfileManagement}
                          >
                            Cadastrar Novo Perfil
                          </Button>
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
