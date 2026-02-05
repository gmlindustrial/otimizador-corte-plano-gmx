import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  Scissors,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Square,
} from 'lucide-react';
import type { ProjetoChapa, ProjetoChapaGroup } from '@/types/project';
import type { Material } from '@/services/interfaces';
import { materialService } from '@/services/entities/MaterialService';

interface SheetOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ProjetoChapaGroup | null;
  selectedChapas: ProjetoChapa[];
  onOptimize: (config: SheetOptimizationConfig) => Promise<void>;
}

export interface SheetOptimizationConfig {
  nomeOtimizacao: string;
  chapaEstoque: {
    largura: number;
    comprimento: number;
    materialId?: string;
  };
  kerf: number;
  allowRotation: boolean;
  algorithm: 'BLF' | 'Genetic' | 'Hybrid';
  processo: 'plasma' | 'oxicorte';
}

export const SheetOptimizationDialog = ({
  open,
  onOpenChange,
  group,
  selectedChapas,
  onOptimize,
}: SheetOptimizationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [sheetMaterials, setSheetMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // Configuracao da otimizacao
  const [nomeOtimizacao, setNomeOtimizacao] = useState('');
  const [larguraChapa, setLarguraChapa] = useState('2500');
  const [comprimentoChapa, setComprimentoChapa] = useState('6000');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [kerf, setKerf] = useState('3');
  const [allowRotation, setAllowRotation] = useState(true);
  const [algorithm, setAlgorithm] = useState<'BLF' | 'Genetic' | 'Hybrid'>('Hybrid');
  const [processo, setProcesso] = useState<'plasma' | 'oxicorte'>('plasma');

  // Carregar materiais de chapa
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoadingMaterials(true);
      try {
        const result = await materialService.getByTipoCorte('chapa');
        if (result.success && result.data) {
          setSheetMaterials(result.data);
          // Se o grupo tem material, pré-selecionar
          if (group?.material_id) {
            setSelectedMaterialId(group.material_id);
            // Usar comprimento padrao do material se disponivel
            const mat = result.data.find(m => m.id === group.material_id);
            if (mat?.comprimento_padrao) {
              setComprimentoChapa(String(mat.comprimento_padrao));
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar materiais de chapa:', error);
      } finally {
        setLoadingMaterials(false);
      }
    };

    if (open) {
      fetchMaterials();
      // Gerar nome padrao
      if (group) {
        const espessura = group.espessura_mm || 0;
        const material = group.material?.descricao || 'Material';
        setNomeOtimizacao(`OTM-${espessura}mm-${new Date().toISOString().slice(0, 10)}`);
      }
    }
  }, [open, group]);

  // Calcular estatisticas
  const totalPecas = selectedChapas.reduce((sum, c) => sum + c.quantidade, 0);
  const totalArea = selectedChapas.reduce(
    (sum, c) => sum + c.largura_mm * c.altura_mm * c.quantidade,
    0
  );
  const areaChapa =
    (parseFloat(larguraChapa) || 0) * (parseFloat(comprimentoChapa) || 0);
  const estimatedSheets = areaChapa > 0 ? Math.ceil(totalArea / areaChapa) : 0;

  // Validacao
  const isValid =
    nomeOtimizacao.trim() !== '' &&
    parseFloat(larguraChapa) > 0 &&
    parseFloat(comprimentoChapa) > 0 &&
    parseFloat(kerf) >= 0 &&
    selectedChapas.length > 0;

  // Handler de submit
  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      await onOptimize({
        nomeOtimizacao: nomeOtimizacao.trim(),
        chapaEstoque: {
          largura: parseFloat(larguraChapa),
          comprimento: parseFloat(comprimentoChapa),
          materialId: selectedMaterialId || undefined,
        },
        kerf: parseFloat(kerf),
        allowRotation,
        algorithm,
        processo,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao otimizar chapas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            Otimizar Chapas - {group.espessura_mm}mm
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumo das pecas selecionadas - compacto */}
          <div className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 text-sm">
                <span><span className="text-teal-600">Tipos:</span> <strong>{selectedChapas.length}</strong></span>
                <span><span className="text-teal-600">Quantidade:</span> <strong>{totalPecas}</strong></span>
                <span><span className="text-teal-600">Area:</span> <strong>{(totalArea / 1_000_000).toFixed(2)} m²</strong></span>
              </div>
              {group.material && (
                <Badge className="bg-teal-100 text-teal-800">
                  {group.material.descricao}
                </Badge>
              )}
            </div>
          </div>

          {/* Grid principal - 2 colunas em desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coluna esquerda */}
            <div className="space-y-3">
              {/* Nome da otimizacao */}
              <div className="space-y-1">
                <Label htmlFor="nome" className="text-sm">Nome da Otimizacao</Label>
                <Input
                  id="nome"
                  value={nomeOtimizacao}
                  onChange={(e) => setNomeOtimizacao(e.target.value)}
                  placeholder="Ex: OTM-6mm-2024-01-15"
                  className="h-9"
                />
              </div>

              {/* Dimensoes da chapa */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="largura" className="text-sm text-gray-600">Largura (mm)</Label>
                  <Input
                    id="largura"
                    type="number"
                    value={larguraChapa}
                    onChange={(e) => setLarguraChapa(e.target.value)}
                    placeholder="2500"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="comprimento" className="text-sm text-gray-600">Comprimento (mm)</Label>
                  <Input
                    id="comprimento"
                    type="number"
                    value={comprimentoChapa}
                    onChange={(e) => setComprimentoChapa(e.target.value)}
                    placeholder="6000"
                    className="h-9"
                  />
                </div>
              </div>

              {/* Material */}
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Material</Label>
                {loadingMaterials ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando...
                  </div>
                ) : (
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione o material" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetMaterials.map((mat) => (
                        <SelectItem key={mat.id} value={mat.id}>
                          {mat.descricao} ({mat.comprimento_padrao}mm)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Coluna direita */}
            <div className="space-y-3">
              {/* Kerf e Processo na mesma linha */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="kerf" className="text-sm text-gray-600">Kerf (mm)</Label>
                  <Input
                    id="kerf"
                    type="number"
                    value={kerf}
                    onChange={(e) => setKerf(e.target.value)}
                    placeholder="3"
                    min="0"
                    step="0.5"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Processo</Label>
                  <Select value={processo} onValueChange={(v: 'plasma' | 'oxicorte') => setProcesso(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plasma">Plasma</SelectItem>
                      <SelectItem value="oxicorte">Oxicorte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Algoritmo */}
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Algoritmo</Label>
                <Select value={algorithm} onValueChange={(v: 'BLF' | 'Genetic' | 'Hybrid') => setAlgorithm(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hybrid">Hibrido (Recomendado)</SelectItem>
                    <SelectItem value="BLF">BLF - Rapido</SelectItem>
                    <SelectItem value="Genetic">Genetico - Qualidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permitir rotacao */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm">Permitir Rotacao 90°</Label>
                  <p className="text-xs text-gray-500">Melhor aproveitamento</p>
                </div>
                <Switch checked={allowRotation} onCheckedChange={setAllowRotation} />
              </div>
            </div>
          </div>

          {/* Estimativa - compacta */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  Estimativa: <strong>{estimatedSheets}</strong> chapa(s) de {larguraChapa}×{comprimentoChapa}mm
                </span>
              </div>
              <span className="text-xs text-blue-600">* Baseada na area total</span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Otimizando...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4 mr-2" />
                Iniciar Otimizacao
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
