import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Users, Link, Info, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProjetoPeca, EmendaConfiguration } from '@/types/project';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface OptimizationCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, barLength: number, emendaConfig?: EmendaConfiguration) => void;
  selectedPieces?: ProjetoPeca[];
  projectId?: string;
  onNavigateToProfileManagement?: () => void;
}

export const OptimizationCreateDialog = ({ open, onOpenChange, onCreate, selectedPieces = [], projectId, onNavigateToProfileManagement }: OptimizationCreateDialogProps) => {
  const [name, setName] = useState('');
  const [barLength, setBarLength] = useState('6000');
  const [loading, setLoading] = useState(false);
  const [availableBarSizes, setAvailableBarSizes] = useState<Array<{ comprimento: number; descricao: string }>>([]);
  const [suggestedBarSize, setSuggestedBarSize] = useState<number>(6000);
  const [showEmendaSettings, setShowEmendaSettings] = useState(false);
  
  // Estados para configuração de emendas
  const [emendaConfig, setEmendaConfig] = useState<EmendaConfiguration>({
    emendaObrigatoria: false,
    permitirEmendas: false,
    tamanhoMinimoSobra: 200,
    maxEmendasPorPeca: 3
  });

  // Buscar tamanhos de barra disponíveis e gerar nome sugerido
  useEffect(() => {
    const fetchBarSizes = async () => {
      const { data } = await supabase
        .from('tamanhos_barras')
        .select('comprimento, descricao')
        .order('comprimento');
      
      if (data) {
        setAvailableBarSizes(data);
      }
    };
    
    fetchBarSizes();
  }, []);

  // Gerar nome sequencial baseado no projeto e perfil
  useEffect(() => {
    const generateSequentialName = async () => {
      if (!projectId || !selectedPieces.length || !open) return;
      
      try {
        // Buscar otimizações anteriores do projeto
        const { data: optimizations } = await supabase
          .from('projeto_otimizacoes')
          .select('nome_lista')
          .eq('projeto_id', projectId)
          .order('created_at', { ascending: false });

        // Encontrar o último número sequencial
        let lastNumber = 0;
        if (optimizations) {
          optimizations.forEach(opt => {
            const match = opt.nome_lista.match(/^Lista (\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > lastNumber) lastNumber = num;
            }
          });
        }

        // Obter perfil predominante das peças selecionadas
        const perfilIds = [...new Set(selectedPieces.map(p => p.perfil_id).filter(Boolean))];
        let predominantProfile = 'Perfil Mix';
        
        if (perfilIds.length === 1) {
          // Se todas as peças têm o mesmo perfil, buscar o nome
          const { data: perfil } = await supabase
            .from('perfis_materiais')
            .select('descricao_perfil')
            .eq('id', perfilIds[0])
            .single();
          
          if (perfil) {
            predominantProfile = perfil.descricao_perfil;
          }
        } else if (perfilIds.length > 1) {
          // Se há múltiplos perfis, usar "Mix"
          predominantProfile = 'Perfil Mix';
        }

        // Gerar nome: Lista {numero} - {perfil}
        const nextNumber = lastNumber + 1;
        const suggestedName = `Lista ${nextNumber} - ${predominantProfile}`;
        setName(suggestedName);

      } catch (error) {
        console.error('Erro ao gerar nome sequencial:', error);
        // Fallback para nome básico
        setName(`Lista 1`);
      }
    };

    generateSequentialName();
  }, [projectId, selectedPieces, open]);

  // Validar peças sem perfil
  const piecesWithoutProfile = selectedPieces.filter(piece => !piece.perfil_id);
  const hasInvalidPieces = piecesWithoutProfile.length > 0;

  // Calcular tamanho sugerido baseado nas peças selecionadas e detectar emendas obrigatórias
  useEffect(() => {
    if (selectedPieces.length > 0) {
      const maxLength = Math.max(...selectedPieces.map(p => p.comprimento_mm));
      const maxBarraDisponivel = Math.max(...availableBarSizes.map(b => b.comprimento), 12000);
      
      let suggested = 6000; // padrão
      
      if (maxLength <= 3000) {
        suggested = 6000; // mínimo eficiente
      } else if (maxLength <= 6000) {
        suggested = 6000; // ideal
      } else if (maxLength <= 12000) {
        suggested = 12000; // necessário
      } else {
        suggested = 12000; // máximo disponível
      }
      
      setSuggestedBarSize(suggested);
      setBarLength(suggested.toString());

      // Detectar se emenda é obrigatória
      const temPecaGrande = selectedPieces.some(p => p.comprimento_mm > maxBarraDisponivel);
      setEmendaConfig(prev => ({
        ...prev,
        emendaObrigatoria: temPecaGrande
      }));
    }
  }, [selectedPieces, availableBarSizes]);

  const handleSubmit = () => {
    if (!name) return;
    
    // Validar se todas as peças têm perfil
    if (hasInvalidPieces) {
      alert('Não é possível criar otimização com peças sem perfil definido.');
      return;
    }
    
    const selectedBarLength = parseInt(barLength, 10);
    const maxPieceLength = selectedPieces.length > 0 ? Math.max(...selectedPieces.map(p => p.comprimento_mm)) : 0;
    
    // Se peça é maior que barra e emendas não estão habilitadas
    if (maxPieceLength > selectedBarLength && !emendaConfig.permitirEmendas && !emendaConfig.emendaObrigatoria) {
      alert(`Atenção: Existe peça com ${maxPieceLength}mm que não cabe na barra de ${selectedBarLength}mm selecionada. Habilite emendas para continuar.`);
      return;
    }
    
    setLoading(true);
    try {
      onCreate(name, selectedBarLength, emendaConfig);
      onOpenChange(false);
      setName('');
    } finally {
      setLoading(false);
    }
  };

  const maxPieceLength = selectedPieces.length > 0 ? Math.max(...selectedPieces.map(p => p.comprimento_mm)) : 0;
  const selectedBarLengthNum = parseInt(barLength, 10);
  const isValidSelection = maxPieceLength <= selectedBarLengthNum || emendaConfig.permitirEmendas || emendaConfig.emendaObrigatoria;
  const pecasQueNecessitamEmenda = selectedPieces.filter(p => p.comprimento_mm > selectedBarLengthNum);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Otimização</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Lista</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Validação de Perfis */}
          {hasInvalidPieces && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Peças sem perfil definido encontradas:</p>
                  <div className="text-sm space-y-1">
                    {piecesWithoutProfile.map((piece, index) => (
                      <div key={index} className="bg-destructive/10 p-2 rounded">
                        • POSIÇÃO: {piece.posicao} ({piece.comprimento_mm}mm)
                        {piece.tag && ` - TAG: ${piece.tag}`}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mt-2">
                    É necessário definir o perfil para todas as peças antes de criar uma otimização.
                  </p>
                  {onNavigateToProfileManagement && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        onNavigateToProfileManagement();
                        onOpenChange(false);
                      }}
                      className="mt-2"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Gerenciar Perfis
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Análise das Peças Selecionadas */}
          {selectedPieces.length > 0 && !hasInvalidPieces && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Análise das Peças</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Peças selecionadas:</span>
                  <Badge variant="secondary">{selectedPieces.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maior comprimento:</span>
                  <Badge variant="outline">{maxPieceLength}mm</Badge>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>Sugestão:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{suggestedBarSize}mm</Badge>
                    {parseInt(barLength) === suggestedBarSize ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="bar">Tamanho da Barra</Label>
            <Select value={barLength} onValueChange={(v) => setBarLength(v)}>
              <SelectTrigger id="bar" className={!isValidSelection ? "border-red-500" : ""}>
                <SelectValue placeholder="Tamanho da barra" />
              </SelectTrigger>
              <SelectContent>
                {availableBarSizes.map((size) => (
                  <SelectItem key={size.comprimento} value={size.comprimento.toString()}>
                    {size.comprimento}mm {size.descricao && `- ${size.descricao}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!isValidSelection && !emendaConfig.permitirEmendas && (
              <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Barra muito pequena para a maior peça ({maxPieceLength}mm). Habilite emendas para continuar.
              </div>
            )}
            
            {pecasQueNecessitamEmenda.length > 0 && (emendaConfig.permitirEmendas || emendaConfig.emendaObrigatoria) && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                <Link className="h-4 w-4" />
                {pecasQueNecessitamEmenda.length} peça(s) será(ão) emendada(s) automaticamente
              </div>
            )}
          </div>

          {/* Configurações de Emenda */}
          <Collapsible open={showEmendaSettings} onOpenChange={setShowEmendaSettings}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurações de Emenda
                {(emendaConfig.permitirEmendas || emendaConfig.emendaObrigatoria) && (
                  <Badge variant="secondary" className="ml-2">Ativo</Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Opções de Emenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Permitir Emendas */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Permitir Emendas</Label>
                      <p className="text-xs text-muted-foreground">
                        Habilita o uso de emendas para otimizar aproveitamento
                      </p>
                    </div>
                    <Switch
                      checked={emendaConfig.permitirEmendas}
                      onCheckedChange={(checked) => 
                        setEmendaConfig(prev => ({ ...prev, permitirEmendas: checked }))
                      }
                      disabled={emendaConfig.emendaObrigatoria}
                    />
                  </div>

                  {emendaConfig.emendaObrigatoria && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Emendas obrigatórias detectadas: existem peças maiores que as barras disponíveis.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Configurações avançadas - só aparecem se emendas estão habilitadas */}
                  {(emendaConfig.permitirEmendas || emendaConfig.emendaObrigatoria) && (
                    <>
                      {/* Tamanho Mínimo Sobra */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Tamanho Mínimo da Sobra (mm)
                        </Label>
                        <Input
                          type="number"
                          value={emendaConfig.tamanhoMinimoSobra}
                          onChange={(e) => 
                            setEmendaConfig(prev => ({ 
                              ...prev, 
                              tamanhoMinimoSobra: parseInt(e.target.value) || 200 
                            }))
                          }
                          min="50"
                          max="1000"
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Sobras menores que este valor serão descartadas
                        </p>
                      </div>

                      {/* Máximo Emendas por Peça */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Máximo de Emendas por Peça
                        </Label>
                        <Select
                          value={emendaConfig.maxEmendasPorPeca.toString()}
                          onValueChange={(value) => 
                            setEmendaConfig(prev => ({ 
                              ...prev, 
                              maxEmendasPorPeca: parseInt(value) 
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 emenda</SelectItem>
                            <SelectItem value="2">2 emendas</SelectItem>
                            <SelectItem value="3">3 emendas</SelectItem>
                            <SelectItem value="4">4 emendas</SelectItem>
                            <SelectItem value="5">5 emendas</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Limite máximo de segmentos por peça
                        </p>
                      </div>


                    </>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={loading || !name || !isValidSelection || hasInvalidPieces}>
            {loading ? 'Criando...' : 'Criar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
