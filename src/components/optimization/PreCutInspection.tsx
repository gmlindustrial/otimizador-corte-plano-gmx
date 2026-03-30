/**
 * PreCutInspection — Checklist de inspeção pré-corte (G14)
 * Operador/inspetor verifica material antes de autorizar corte.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PreCutInspectionProps {
  onApproved: () => void;
  onRejected: (reason: string) => void;
  materialInfo?: string;
  optimizationId?: string;
}

const INSPECTION_ITEMS = [
  { id: 'visual', label: 'Inspeção visual — sem trincas, corrosão ou deformação', required: true },
  { id: 'dimensional', label: 'Verificação dimensional — comprimento e perfil conferem com o pedido', required: true },
  { id: 'identificacao', label: 'Identificação do material — corrida/lote legível na barra', required: false },
  { id: 'superficie', label: 'Superfície da barra — sem marcas profundas ou danos de transporte', required: true },
  { id: 'esquadro', label: 'Verificação de esquadro — extremidades dentro da tolerância', required: false },
  { id: 'lamina', label: 'Lâmina da serra — verificada e em boas condições', required: true },
  { id: 'fixacao', label: 'Fixação/morsa — barra presa corretamente na serra', required: true },
];

const DEFECT_OPTIONS = [
  'Trinca superficial',
  'Corrosão excessiva',
  'Deformação/empenamento',
  'Perfil incorreto',
  'Comprimento insuficiente',
  'Dano de transporte',
  'Identificação ilegível',
  'Outro',
];

export const PreCutInspection = ({ onApproved, onRejected, materialInfo, optimizationId }: PreCutInspectionProps) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [defects, setDefects] = useState<string[]>([]);
  const [observations, setObservations] = useState('');
  const [inspectionType, setInspectionType] = useState('visual');

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDefect = (defect: string) => {
    setDefects(prev =>
      prev.includes(defect)
        ? prev.filter(d => d !== defect)
        : [...prev, defect]
    );
  };

  const requiredItems = INSPECTION_ITEMS.filter(i => i.required);
  const allRequiredChecked = requiredItems.every(i => checkedItems.has(i.id));

  const saveInspection = async (status: string) => {
    if (!optimizationId) return;
    try {
      await supabase.from('inspecao_pre_corte').insert({
        projeto_otimizacao_id: optimizationId,
        status,
        tipo_inspecao: inspectionType,
        observacoes: observations || null,
        defeitos_encontrados: defects.length > 0 ? defects : null,
      });
    } catch (e) {
      console.error('Erro ao salvar inspeção:', e);
    }
  };

  const handleApprove = async () => {
    if (!allRequiredChecked) {
      toast.error('Complete todos os itens obrigatórios antes de aprovar');
      return;
    }
    await saveInspection('aprovado');
    toast.success('Material aprovado para corte');
    onApproved();
  };

  const handleReject = async () => {
    if (defects.length === 0 && !observations) {
      toast.error('Informe o motivo da rejeição (defeito ou observação)');
      return;
    }
    const reason = [
      ...defects,
      observations ? `Obs: ${observations}` : '',
    ].filter(Boolean).join('; ');
    await saveInspection('reprovado');
    toast.error('Material reprovado para corte');
    onRejected(reason);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Inspeção Pré-Corte
          </div>
          {materialInfo && (
            <Badge variant="outline" className="text-xs">{materialInfo}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de inspeção */}
        <div className="space-y-1">
          <Label className="text-xs">Tipo de Inspeção</Label>
          <Select value={inspectionType} onValueChange={setInspectionType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visual">Visual</SelectItem>
              <SelectItem value="dimensional">Dimensional</SelectItem>
              <SelectItem value="ultrassom">Ultrassom</SelectItem>
              <SelectItem value="magnetica">Partícula Magnética</SelectItem>
              <SelectItem value="completa">Completa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Checklist de Verificação</Label>
          {INSPECTION_ITEMS.map(item => (
            <div key={item.id} className="flex items-start gap-2 p-2 rounded hover:bg-accent/30">
              <Checkbox
                checked={checkedItems.has(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
                id={item.id}
              />
              <Label htmlFor={item.id} className="text-xs cursor-pointer leading-tight">
                {item.label}
                {item.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
          ))}
        </div>

        {/* Defeitos encontrados */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Defeitos Encontrados (se houver)</Label>
          <div className="flex flex-wrap gap-1.5">
            {DEFECT_OPTIONS.map(defect => (
              <Badge
                key={defect}
                variant={defects.includes(defect) ? 'destructive' : 'outline'}
                className="text-xs cursor-pointer"
                onClick={() => toggleDefect(defect)}
              >
                {defect}
              </Badge>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1">
          <Label className="text-xs">Observações</Label>
          <Textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            placeholder="Informações adicionais sobre o material..."
            className="text-xs h-16 resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApprove}
            disabled={!allRequiredChecked}
            className="flex-1"
            variant="default"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprovar para Corte
          </Button>
          <Button
            onClick={handleReject}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reprovar
          </Button>
        </div>

        {defects.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {defects.length} defeito(s) selecionado(s) — material será reprovado se confirmado
          </div>
        )}
      </CardContent>
    </Card>
  );
};
