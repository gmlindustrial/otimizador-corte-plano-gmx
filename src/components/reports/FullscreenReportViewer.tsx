import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  X, ZoomIn, ZoomOut, Search, Filter, ChevronLeft, ChevronRight, 
  Package, Tag, Wrench, Printer, Check, Square, Recycle, MapPin, DollarSign, Scissors, AlertTriangle, Power
} from 'lucide-react';
import type { OptimizationResult, Project } from '@/pages/Index';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { useLaminaService } from '@/hooks/useLaminaService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface FullscreenReportViewerProps {
  isOpen: boolean;
  onClose: () => void;
  results: OptimizationResult;
  barLength: number;
  project: Project | null;
  onResultsChange?: (results: OptimizationResult) => void;
  optimizationId?: string;
}

export const FullscreenReportViewer = ({
  isOpen,
  onClose,
  results,
  barLength,
  project,
  onResultsChange,
  optimizationId
}: FullscreenReportViewerProps) => {
  const [selectedBar, setSelectedBar] = useState<number>(0);
  const { logPieceAction } = useAuditLogger();
  const { laminas, laminasAtivadas, registrarCorteCompleto, ativarLamina, loading: laminaLoading } = useLaminaService();
  const queryClient = useQueryClient();
  const [selectedLamina, setSelectedLamina] = useState<string>('');
  const [activationDialogOpen, setActivationDialogOpen] = useState<boolean>(false);
  const [laminaToActivate, setLaminaToActivate] = useState<string>('');
  const [svgZoomLevel, setSvgZoomLevel] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterByFase, setFilterByFase] = useState<string>('');
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(false);
  const [checkedPieces, setCheckedPieces] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('detailed');
  // const [showLegend, setShowLegend] = useState<boolean>(true); // TODO: Reativar legenda no futuro

  useEffect(() => {
    if (!isOpen) return;
    const initial = new Set<string>();
    results.bars.forEach((bar, bIdx) => {
      bar.pieces.forEach((piece: any) => {
        if (piece.cortada) {
          initial.add(`${piece.tag || piece.length}-${piece.posicao || 'Manual'}`);
        }
      });
    });
    setCheckedPieces(initial);
  }, [isOpen, results]);

  // Auto-selecionar lâmina ativa quando abrir o modal
  useEffect(() => {
    if (isOpen && laminasAtivadas.length > 0 && !selectedLamina) {
      setSelectedLamina(laminasAtivadas[0].id);
    }
  }, [isOpen, laminasAtivadas, selectedLamina]);

  // Função para ativar lâmina
  const handleActivateLamina = async (laminaId: string) => {
    setLaminaToActivate(laminaId);
    setActivationDialogOpen(true);
  };

  const confirmActivation = async () => {
    try {
      await ativarLamina(laminaToActivate);
      setSelectedLamina(laminaToActivate);
      toast({
        title: "Lâmina ativada",
        description: "A lâmina foi ativada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao ativar",
        description: "Não foi possível ativar a lâmina.",
        variant: "destructive",
      });
    } finally {
      setActivationDialogOpen(false);
      setLaminaToActivate('');
    }
  };

  // Ordenar lâminas: ativas primeiro, depois desativadas
  const sortedLaminas = [...laminas].sort((a, b) => {
    if (a.status === 'ativada' && b.status !== 'ativada') return -1;
    if (a.status !== 'ativada' && b.status === 'ativada') return 1;
    return a.codigo.localeCompare(b.codigo);
  });

  // Extrair fases únicas
  const allFases = new Set<string>();
  results.bars.forEach(bar => {
    bar.pieces.forEach((piece: any) => {
      if (piece.fase) allFases.add(piece.fase);
    });
  });

  // Filtrar dados baseado na busca e filtros
  const filteredBars = results.bars.map((bar, barIndex) => ({
    ...bar,
    barIndex,
    pieces: bar.pieces.filter((piece: any) => {
      const matchesSearch = !searchTerm || 
        (piece.tag && piece.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (piece.fase && piece.fase.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFase = !filterByFase || piece.fase === filterByFase;
      
      const pieceId = `${piece.tag || piece.length}-${piece.posicao || 'Manual'}`;
      const matchesPending = !showOnlyPending || !checkedPieces.has(pieceId);
      
      return matchesSearch && matchesFase && matchesPending;
    })
  })).filter(bar => bar.pieces.length > 0);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setSelectedBar(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setSelectedBar(prev => Math.min(filteredBars.length - 1, prev + 1));
          break;
        case '+':
          setSvgZoomLevel(prev => Math.min(2, prev + 0.1));
          break;
        case '-':
          setSvgZoomLevel(prev => Math.max(0.5, prev - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, filteredBars.length]);

  const togglePieceCheck = async (barIndex: number, piece: any) => {
    const pieceId = `${piece.tag || piece.length}-${piece.posicao || 'Manual'}`;
    const newChecked = new Set(checkedPieces);

    let checked: boolean;
    if (newChecked.has(pieceId)) {
      newChecked.delete(pieceId);
      checked = false;
    } else {
      newChecked.add(pieceId);
      checked = true;
    }

    // Verificar se há lâmina selecionada antes de marcar como cortada
    if (checked && !selectedLamina) {
      toast({
        title: "Selecione uma lâmina",
        description: "É necessário selecionar uma lâmina ativa antes de marcar peças como cortadas.",
        variant: "destructive",
      });
      return;
    }

    piece.cortada = checked;
    setCheckedPieces(newChecked);
    onResultsChange?.(results);

    // Sincronizar a coluna corte na tabela projeto_pecas
    if (piece.id) {
      try {
        const { error } = await supabase
          .from('projeto_pecas')
          .update({ corte: checked })
          .eq('id', piece.id);

        if (error) {
          console.error('Erro ao atualizar coluna corte:', error);
        }
      } catch (error) {
        console.error('Erro ao sincronizar corte na base de dados:', error);
      }
    }

    // Log da ação no histórico com descrição detalhada
    if (project) {
      const descricaoDetalhada = checked 
        ? `Peça da TAG ${piece.tag || piece.length} - Posição ${piece.posicao || 'Manual'}, da Lista ${barIndex + 1} foi marcada como cortada`
        : `Peça da TAG ${piece.tag || piece.length} - Posição ${piece.posicao || 'Manual'}, da Lista ${barIndex + 1} foi desmarcada`;

      await logPieceAction(
        checked ? 'MARCAR_CORTADA' : 'DESMARCAR_CORTADA',
        pieceId,
        project.projectNumber || project.name || 'Projeto',
        {
          descricaoCustomizada: descricaoDetalhada,
          tag: piece.tag,
          posicao: piece.posicao || 'Manual',
          lista: barIndex + 1,
          comprimento: piece.length,
          perfil: piece.perfil,
          quantidade: piece.quantidade,
          statusAnterior: !checked ? 'cortada' : 'pendente',
          statusAtual: checked ? 'cortada' : 'pendente'
        }
      );

      // Registrar corte no sistema de lâminas e marcar no banco se foi marcada como cortada
      if (checked && selectedLamina) {
        try {
          await registrarCorteCompleto({
            serra_id: selectedLamina,
            projeto_id: project.id || '',
            otimizacao_id: optimizationId,
            quantidade_cortada: piece.quantidade || 1,
            peca_posicao: piece.posicao || 'Manual',
            peca_tag: piece.tag,
            perfil_id: piece.perfilId,
            observacoes: `Lista ${barIndex + 1} - Comprimento: ${piece.length}mm`
          });

          // Atualizar coluna corte no banco de dados
          if (piece.id) {
            await import('@/services/entities/ProjetoPecaService').then(({ projetoPecaService }) => {
              return projetoPecaService.markAsCut([piece.id]);
            });
          }
          
          toast({
            title: "Corte registrado",
            description: `Peça ${piece.tag || piece.length}mm registrada na lâmina.`,
          });
        } catch (error) {
          console.error('Erro ao registrar corte na lâmina:', error);
          toast({
            title: "Erro no registro",
            description: "Falha ao registrar corte na lâmina. Verifique os logs.",
            variant: "destructive",
          });
        }
      } else if (!checked && piece.id) {
        // Desmarcar peça como cortada no banco
        try {
          await import('@/services/entities/ProjetoPecaService').then(({ projetoPecaService }) => {
            return projetoPecaService.unmarkAsCut([piece.id]);
          });
        } catch (error) {
          console.error('Erro ao desmarcar peça como cortada:', error);
        }
      }

      // Invalidar cache das estatísticas do projeto para atualizar contadores
      if (project?.id) {
        await queryClient.invalidateQueries({
          queryKey: ['project-statistics', project.id]
        });
      }
    }
  };

  const currentBar = filteredBars[selectedBar];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  // TODO: Reativar no futuro - Agrupar peças por fase para legenda
  /* 
  const faseLegend = new Map<string, { color: string; count: number }>();
  
  results.bars.forEach(bar => {
    bar.pieces.forEach((piece: any) => {
      if (piece.fase && !faseLegend.has(piece.fase)) {
        faseLegend.set(piece.fase, { 
          color: piece.color, 
          count: results.bars.reduce((total, b) => 
            total + b.pieces.filter((p: any) => p.fase === piece.fase).length, 0
          )
        });
      }
    });
  });
  */

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 bg-white m-0 rounded-none border-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Visualização Completa - {project?.projectNumber || 'Projeto'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">
                Visualização Completa - {project?.projectNumber || 'Projeto'}
              </h2>
              <Badge variant="outline">
                {filteredBars.length} barras | {results.efficiency.toFixed(1)}% eficiência
              </Badge>
              
              {/* Seleção de Lâmina Redesenhada */}
              <div className="flex items-center gap-3">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Select value={selectedLamina} onValueChange={setSelectedLamina}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar lâmina" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {sortedLaminas.filter(lamina => lamina.id && lamina.id.trim() !== '').map((lamina) => (
                        <SelectItem key={lamina.id} value={lamina.id} className="hover:bg-accent">
                          Lâmina {lamina.codigo}
                        </SelectItem>
                      ))}
                      {sortedLaminas.length === 0 && (
                        <SelectItem value="none" disabled>
                          Nenhuma lâmina encontrada
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Badge de Status Externa */}
                  {selectedLamina && (() => {
                    const lamina = sortedLaminas.find(l => l.id === selectedLamina);
                    if (!lamina) return null;
                    
                    return (
                      <Badge 
                        variant={lamina.status === 'ativada' ? 'default' : lamina.status === 'descartada' ? 'destructive' : 'outline'}
                        className={
                          lamina.status === 'ativada' 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : lamina.status === 'descartada'
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }
                      >
                        {lamina.status === 'ativada' ? 'Ativa' : lamina.status === 'descartada' ? 'Descartada' : 'Desativada'}
                      </Badge>
                    );
                  })()}
                  
                  {/* Botão de Ativar Externa */}
                  {selectedLamina && (() => {
                    const lamina = sortedLaminas.find(l => l.id === selectedLamina);
                    if (!lamina || lamina.status !== 'desativada') return null;
                    
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border-green-200 hover:bg-green-50"
                        onClick={() => handleActivateLamina(lamina.id)}
                        disabled={laminaLoading}
                      >
                        <Power className="w-3 h-3 mr-1" />
                        Ativar
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Controles de Zoom SVG */}
              <Button variant="outline" size="sm" onClick={() => setSvgZoomLevel(prev => Math.max(0.5, prev - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono">{(svgZoomLevel * 100).toFixed(0)}%</span>
              <Button variant="outline" size="sm" onClick={() => setSvgZoomLevel(prev => Math.min(2, prev + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              {/* TODO: Reativar Toggle Legenda no futuro */}
              {/* 
              <Button 
                variant={showLegend ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
              >
                <Square className="w-4 h-4 mr-1" />
                Legenda
              </Button>
              */}
              
              {/* Imprimir */}
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
              </Button>
              
              {/* Single X button */}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* TODO: Reativar Legenda de Identificação no futuro */}
          {/* 
          {showLegend && (
            <div className="p-4 border-b bg-blue-50 flex-shrink-0">
              <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                <Square className="w-4 h-4" />
                Legenda de Identificação
              </h4>
              ...toda a legenda aqui...
            </div>
          )}
          */}

          {/* Alerta sobre lâminas */}
          {laminasAtivadas.length === 0 && laminas.length > 0 && (
            <div className="p-4 border-b">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma lâmina ativa encontrada. Selecione uma lâmina desativada e ative-a para registrar cortes no sistema.
                </AlertDescription>
              </Alert>
            </div>
          )}
          {laminas.length === 0 && (
            <div className="p-4 border-b">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma lâmina cadastrada no sistema. Vá até a tela de Lâminas para cadastrar uma nova lâmina.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Filtros */}
          <div className="flex items-center gap-4 p-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por TAG ou fase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <select 
              value={filterByFase} 
              onChange={(e) => setFilterByFase(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todas as fases</option>
              {Array.from(allFases).map(fase => (
                <option key={fase} value={fase}>{fase}</option>
              ))}
            </select>
            
            <Button
              variant={showOnlyPending ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOnlyPending(!showOnlyPending)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Apenas Pendentes
            </Button>

            <div className="ml-auto text-sm text-gray-600">
              Peças cortadas: {checkedPieces.size} / {results.bars.reduce((sum, bar) => sum + bar.pieces.length, 0)}
            </div>
          </div>

          {/* Navegação de Barras */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              disabled={selectedBar === 0}
              onClick={() => setSelectedBar(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Barra:</span>
              <select 
                value={selectedBar} 
                onChange={(e) => setSelectedBar(Number(e.target.value))}
                className="px-3 py-1 border rounded"
              >
                {filteredBars.map((_, index) => (
                  <option key={index} value={index}>
                    Barra {filteredBars[index].barIndex + 1}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                de {filteredBars.length}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={selectedBar >= filteredBars.length - 1}
              onClick={() => setSelectedBar(prev => Math.min(filteredBars.length - 1, prev + 1))}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Conteúdo Principal - com altura fixa e scroll independente */}
          <div className="flex-1 overflow-auto">
            {currentBar && (
              <div className="p-6">
                {/* Informações da Barra */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span>Barra {currentBar.barIndex + 1}</span>
                        
                        {/* Indicadores NOVA/SOBRA */}
                        {(currentBar as any).type === 'leftover' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Recycle className="w-3 h-3 mr-1" />
                            SOBRA
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            NOVA
                          </Badge>
                        )}
                        
                        {/* Localização para sobras */}
                        {(currentBar as any).type === 'leftover' && (currentBar as any).location && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            <MapPin className="w-3 h-3 mr-1" />
                            {(currentBar as any).location}
                          </Badge>
                        )}
                        
                        {/* Economia para sobras */}
                        {(currentBar as any).type === 'leftover' && (currentBar as any).economySaved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Economia: R$ {(currentBar as any).economySaved.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span>Eficiência: {((currentBar.totalUsed / barLength) * 100).toFixed(1)}%</span>
                        <span>Sobra: {(currentBar.waste / 1000).toFixed(3)}m</span>
                        <span>Peças: {currentBar.pieces.length}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Visualização SVG da Barra com zoom independente */}
                    <div className="mb-6" style={{ transform: `scale(${svgZoomLevel})`, transformOrigin: 'top left' }}>
                      <svg width="100%" height="100" viewBox={`0 0 ${barLength / 10} 100`} className="border rounded">
                        {(() => {
                          let currentX = 0;
                          return currentBar.pieces.map((piece: any, pieceIndex) => {
                            const segmentWidth = piece.length / 10;
                            const pieceId = `${piece.tag || piece.length}-${piece.posicao || 'Manual'}`;
                            const isChecked = checkedPieces.has(pieceId);
                            
                            // Cor baseada no tipo de barra
                            const segmentColor = (currentBar as any).type === 'leftover' ? '#10B981' : piece.color || colors[pieceIndex % colors.length];
                            
                            const segment = (
                              <g key={pieceIndex}>
                                <rect
                                  x={currentX}
                                  y={30}
                                  width={segmentWidth}
                                  height={40}
                                  fill={isChecked ? '#9CA3AF' : segmentColor}
                                  stroke="#fff"
                                  strokeWidth="2"
                                  opacity={isChecked ? 0.5 : 1}
                                />
                                <text
                                  x={currentX + segmentWidth / 2}
                                  y={55}
                                  textAnchor="middle"
                                  fontSize="8"
                                  fill="white"
                                  fontWeight="bold"
                                >
                                  {piece.tag || (piece.length > 300 ? `${piece.length}` : '')}
                                </text>
                                {isChecked && (
                                  <text
                                    x={currentX + segmentWidth / 2}
                                    y={50}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="white"
                                  >
                                    ✓
                                  </text>
                                )}
                                {/* Indicador de reutilização */}
                                {(currentBar as any).type === 'leftover' && (
                                  <text
                                    x={currentX + segmentWidth / 2}
                                    y={45}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill="white"
                                  >
                                    ♻
                                  </text>
                                )}
                              </g>
                            );
                            currentX += segmentWidth;
                            return segment;
                          });
                        })()}
                        
                        {/* Sobra */}
                        {currentBar.waste > 0 && (
                          <rect
                            x={currentBar.totalUsed / 10}
                            y={30}
                            width={currentBar.waste / 10}
                            height={40}
                            fill="#9CA3AF"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        )}
                        
                        {/* Escala */}
                        {Array.from({ length: Math.ceil(barLength / 1000) + 1 }, (_, i) => (
                          <g key={i}>
                            <line
                              x1={i * 100}
                              y1={25}
                              x2={i * 100}
                              y2={75}
                              stroke="#666"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            <text
                              x={i * 100}
                              y={20}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#666"
                            >
                              {i}m
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Tabela Detalhada - com scroll independente */}
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead className={`sticky top-0 ${(currentBar as any).type === 'leftover' ? 'bg-green-50' : 'bg-gray-100'}`}>
                          <tr>
                            <th className="border border-gray-300 px-4 py-3 text-left">Status</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Peça</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">TAG</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Posição</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Comprimento</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Fase</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Perfil</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentBar.pieces.map((piece: any, pieceIndex) => {
                            const pieceId = `${piece.tag || piece.length}-${piece.posicao || 'Manual'}`;
                            const isChecked = checkedPieces.has(pieceId);
                            
                            return (
                              <tr key={pieceIndex} className={`hover:bg-gray-50 ${isChecked ? 'bg-green-50' : ''}`}>
                                <td className="border border-gray-300 px-4 py-3">
                                  <Button
                                    variant={isChecked ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => togglePieceCheck(currentBar.barIndex, piece)}
                                  >
                                    {isChecked ? <Check className="w-4 h-4" /> : '□'}
                                  </Button>
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded border" 
                                      style={{ backgroundColor: (currentBar as any).type === 'leftover' ? '#10B981' : piece.color || colors[pieceIndex % colors.length] }}
                                    />
                                    Peça {pieceIndex + 1}
                                    {(currentBar as any).type === 'leftover' && <Recycle className="w-3 h-3 text-green-600" />}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  {piece.tag ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {piece.tag}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  <div className="text-sm font-medium">
                                    {piece.posicao || 'Manual'}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 font-mono text-lg font-bold">
                                  {piece.length}mm
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  {piece.fase ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      <Package className="w-3 h-3 mr-1" />
                                      {piece.fase}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">Manual</span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  {piece.perfil ? (
                                    <Badge variant="secondary">
                                      <Wrench className="w-3 h-3 mr-1" />
                                      {piece.perfil}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Sobra */}
                          {currentBar.waste > 0 && (
                            <tr className="bg-red-50">
                              <td className="border border-gray-300 px-4 py-3">
                                <span className="text-red-600">N/A</span>
                              </td>
                              <td className="border border-gray-300 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded border bg-gray-300" />
                                  Sobra
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">N/A</td>
                              <td className="border border-gray-300 px-4 py-3 font-mono text-red-600 font-bold">
                                {currentBar.waste}mm
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">Descarte</td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">
                                {(currentBar as any).type === 'leftover' ? 'Sobra da Sobra' : 'Desperdício'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer com atalhos */}
          <div className="p-4 border-t bg-gray-50 text-sm text-gray-600 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Atalhos: ESC (sair) | ← → (navegar) | + - (zoom)</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Projeto: {project?.client || 'N/A'}</span>
                <span>Operador: {(project as any)?.operador || 'N/A'}</span>
                <span>Material: {(project as any)?.tipoMaterial || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog de Confirmação de Ativação */}
        <AlertDialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ativar Lâmina</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja ativar esta lâmina? Todas as outras lâminas ativas serão automaticamente desativadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmActivation}>
                Ativar Lâmina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};