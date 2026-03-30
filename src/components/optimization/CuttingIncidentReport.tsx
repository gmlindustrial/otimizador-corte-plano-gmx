/**
 * CuttingIncidentReport — Registro de ocorrências durante corte (G11)
 * Protocolos para: barra defeituosa, corte errado, lâmina quebrou, etc.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, Plus, FileWarning } from 'lucide-react';
import { toast } from 'sonner';

interface Incident {
  id: string;
  tipo: string;
  severidade: string;
  descricao: string;
  acaoTomada: string;
  pecasAfetadas: number;
  materialPerdido: number;
  timestamp: Date;
}

const INCIDENT_TYPES = [
  { value: 'barra_defeituosa', label: 'Barra Defeituosa', icon: '🔴', protocol: 'Retirar barra da serra. Registrar defeito. Isolar material. Verificar lote.' },
  { value: 'corte_errado', label: 'Corte Errado', icon: '⚠️', protocol: 'Parar corte. Medir peça cortada. Registrar desvio. Avaliar se peça é recuperável.' },
  { value: 'lamina_quebrou', label: 'Lâmina Quebrou', icon: '🔧', protocol: 'Parar máquina imediatamente. Substituir lâmina. Verificar peças em corte. Registrar hora da troca.' },
  { value: 'material_fora_especificacao', label: 'Material Fora de Especificação', icon: '📋', protocol: 'Não cortar. Isolar material. Notificar engenharia. Verificar certificado.' },
  { value: 'parada_emergencia', label: 'Parada de Emergência', icon: '🛑', protocol: 'Verificar segurança do operador. Avaliar danos. Registrar causa. Liberar máquina somente após inspeção.' },
  { value: 'desvio_dimensional', label: 'Desvio Dimensional', icon: '📐', protocol: 'Medir novamente. Comparar com tolerância do projeto. Se fora: registrar e separar peça.' },
  { value: 'outro', label: 'Outro', icon: '📝', protocol: 'Descrever a ocorrência em detalhes.' },
];

interface CuttingIncidentReportProps {
  barId?: string;
  optimizationId?: string;
}

export const CuttingIncidentReport = ({ barId, optimizationId }: CuttingIncidentReportProps) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [severidade, setSeveridade] = useState('media');
  const [descricao, setDescricao] = useState('');
  const [acaoTomada, setAcaoTomada] = useState('');
  const [pecasAfetadas, setPecasAfetadas] = useState(0);
  const [materialPerdido, setMaterialPerdido] = useState(0);

  const selectedIncidentType = INCIDENT_TYPES.find(t => t.value === selectedType);

  const handleSubmit = async () => {
    if (!selectedType || !descricao) {
      toast.error('Informe o tipo e a descrição da ocorrência');
      return;
    }

    const incident: Incident = {
      id: `inc-${Date.now()}`,
      tipo: selectedType,
      severidade,
      descricao,
      acaoTomada,
      pecasAfetadas,
      materialPerdido,
      timestamp: new Date(),
    };

    setIncidents(prev => [incident, ...prev]);

    // Persistir no Supabase
    if (optimizationId) {
      try {
        await supabase.from('ocorrencias_corte').insert({
          projeto_otimizacao_id: optimizationId,
          barra_id: barId || null,
          tipo: selectedType,
          severidade,
          descricao,
          acao_tomada: acaoTomada || null,
          pecas_afetadas: pecasAfetadas,
          material_perdido_mm: materialPerdido,
        });
      } catch (e) {
        console.error('Erro ao salvar ocorrência:', e);
      }
    }

    toast.success('Ocorrência registrada');

    // Reset
    setSelectedType('');
    setDescricao('');
    setAcaoTomada('');
    setPecasAfetadas(0);
    setMaterialPerdido(0);
    setDialogOpen(false);
  };

  const severidadeColor = {
    baixa: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    media: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    alta: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    critica: 'bg-red-500/10 text-red-600 border-red-500/30',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-warning" />
            Ocorrências
            {incidents.length > 0 && (
              <Badge variant="destructive" className="text-xs">{incidents.length}</Badge>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Registrar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Registrar Ocorrência
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de Ocorrência *</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Protocolo sugerido */}
                {selectedIncidentType && (
                  <div className="p-3 bg-secondary rounded-lg text-xs">
                    <p className="font-medium mb-1">Protocolo sugerido:</p>
                    <p className="text-muted-foreground">{selectedIncidentType.protocol}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Severidade</Label>
                  <Select value={severidade} onValueChange={setSeveridade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Descrição *</Label>
                  <Textarea
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder="Descreva o que aconteceu..."
                    className="text-xs h-20 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Ação Tomada</Label>
                  <Textarea
                    value={acaoTomada}
                    onChange={e => setAcaoTomada(e.target.value)}
                    placeholder="O que foi feito para resolver..."
                    className="text-xs h-16 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Peças Afetadas</Label>
                    <Input
                      type="number"
                      min={0}
                      value={pecasAfetadas}
                      onChange={e => setPecasAfetadas(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Material Perdido (mm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={materialPerdido}
                      onChange={e => setMaterialPerdido(Number(e.target.value))}
                    />
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  Registrar Ocorrência
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>

      {incidents.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {incidents.map(inc => {
              const type = INCIDENT_TYPES.find(t => t.value === inc.tipo);
              return (
                <div key={inc.id} className="flex items-start gap-3 p-2 rounded-lg border text-xs">
                  <span className="text-base">{type?.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium">{type?.label}</span>
                      <Badge className={`text-[10px] ${severidadeColor[inc.severidade as keyof typeof severidadeColor] || ''}`}>
                        {inc.severidade}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate">{inc.descricao}</p>
                    {inc.pecasAfetadas > 0 && (
                      <p className="text-muted-foreground">{inc.pecasAfetadas} peça(s) afetada(s), {inc.materialPerdido}mm perdido</p>
                    )}
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {inc.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
