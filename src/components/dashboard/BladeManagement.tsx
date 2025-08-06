import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scissors, AlertTriangle, CheckCircle, Download, Send, Power, PowerOff, Trash2, Filter, BarChart3, Search, TrendingUp, Users, Activity } from 'lucide-react';
import { useLaminaService } from '@/hooks/useLaminaService';
import { useToast } from '@/hooks/use-toast';
import { LaminaEstatisticas } from '@/services/interfaces/lamina';
import { supabase } from '@/integrations/supabase/client';

interface BladeManagementProps {
  history: any[];
  onExport: (type: string) => void;
  onSendWhatsApp: (type: string) => void;
  onSendTelegram: (type: string) => void;
}

export const BladeManagement = ({ 
  history, 
  onExport, 
  onSendWhatsApp, 
  onSendTelegram 
}: BladeManagementProps) => {
  
  const { laminas, laminasAtivadas, loading, ativarLamina, desativarLamina, descartarLamina, getEstatisticas } = useLaminaService();
  const { toast } = useToast();
  const [selectedBladeId, setSelectedBladeId] = useState<string>('');
  const [bladeStats, setBladeStats] = useState<LaminaEstatisticas | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bladeCuts, setBladeCuts] = useState<any[]>([]);
  const [loadingCuts, setLoadingCuts] = useState(false);
  const [overviewStats, setOverviewStats] = useState<any>({});

  // Analysis tab filter states
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedOptimization, setSelectedOptimization] = useState<string>('');
  const [analysisBladeFilter, setAnalysisBladeFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredStats, setFilteredStats] = useState<any>({});
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Load overview statistics
  useEffect(() => {
    const loadOverviewStats = async () => {
      if (!laminas.length) return;
      
      try {
        const { data: cutsData, error } = await supabase
          .from('serra_uso_cortes')
          .select(`
            serra_id,
            quantidade_cortada,
            data_corte,
            serras!inner(codigo, status)
          `);

        if (error) throw error;

        const today = new Date().toISOString().split('T')[0];
        const cutsToday = cutsData?.filter(cut => 
          cut.data_corte.startsWith(today)
        ).reduce((sum, cut) => sum + cut.quantidade_cortada, 0) || 0;

        const totalCuts = cutsData?.reduce((sum, cut) => sum + cut.quantidade_cortada, 0) || 0;
        const activeBlades = laminas.filter(l => l.status === 'ativada').length;
        const totalBlades = laminas.length;

        setOverviewStats({
          totalBlades,
          activeBlades,
          inactiveBlades: totalBlades - activeBlades,
          cutsToday,
          totalCuts,
          averageCutsPerBlade: totalBlades > 0 ? Math.round(totalCuts / totalBlades) : 0
        });
      } catch (error) {
        console.error('Error loading overview stats:', error);
      }
    };

    loadOverviewStats();
  }, [laminas]);

  // Auto-select the first blade for individual management
  useEffect(() => {
    if (laminas.length > 0 && !selectedBladeId) {
      setSelectedBladeId(laminas[0].id);
    }
  }, [laminas, selectedBladeId]);

  // Load statistics when blade is selected
  useEffect(() => {
    if (selectedBladeId) {
      setLoadingStats(true);
      getEstatisticas(selectedBladeId)
        .then(data => {
          if (data) {
            setBladeStats(data);
          }
        })
        .catch(error => {
          console.error('Error loading blade statistics:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as estatísticas da lâmina.",
            variant: "destructive"
          });
        })
        .finally(() => setLoadingStats(false));
    }
  }, [selectedBladeId]);

  // Load cuts for selected blade
  useEffect(() => {
    if (selectedBladeId) {
      setLoadingCuts(true);
      const loadBladeCuts = async () => {
        try {
          const { data, error } = await supabase
            .from('serra_uso_cortes')
            .select(`
              *,
              projetos!inner(nome),
              projeto_otimizacoes(nome_lista),
              operadores(nome),
              perfis_materiais(descricao_perfil)
            `)
            .eq('serra_id', selectedBladeId)
            .order('data_corte', { ascending: false });

          if (error) throw error;
          setBladeCuts(data || []);
        } catch (error) {
          console.error('Error loading blade cuts:', error);
        } finally {
          setLoadingCuts(false);
        }
      };

      loadBladeCuts();
    }
  }, [selectedBladeId]);

  // Load projects with usage data
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('serra_uso_cortes')
          .select(`
            projeto_id,
            projetos!inner(nome)
          `)
          .not('projeto_id', 'is', null);

        if (error) throw error;

        const uniqueProjects = data.reduce((acc: any[], item) => {
          if (!acc.find(p => p.id === item.projeto_id)) {
            acc.push({
              id: item.projeto_id,
              nome: item.projetos.nome
            });
          }
          return acc;
        }, []);

        setProjects(uniqueProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  // Load optimizations when project changes
  useEffect(() => {
    if (selectedProject) {
      const loadOptimizations = async () => {
        try {
          const { data, error } = await supabase
            .from('serra_uso_cortes')
            .select(`
              otimizacao_id,
              projeto_otimizacoes!inner(nome_lista)
            `)
            .eq('projeto_id', selectedProject)
            .not('otimizacao_id', 'is', null);

          if (error) throw error;

          const uniqueOptimizations = data.reduce((acc: any[], item) => {
            if (!acc.find(o => o.id === item.otimizacao_id)) {
              acc.push({
                id: item.otimizacao_id,
                nome: item.projeto_otimizacoes.nome_lista
              });
            }
            return acc;
          }, []);

          setOptimizations(uniqueOptimizations);
        } catch (error) {
          console.error('Error loading optimizations:', error);
        }
      };

      loadOptimizations();
    } else {
      setOptimizations([]);
      setSelectedOptimization('');
    }
  }, [selectedProject]);

  // Load filtered data
  useEffect(() => {
    const loadFilteredData = async () => {
      if ((!selectedProject || selectedProject === "all") && (!selectedOptimization || selectedOptimization === "all")) {
        setFilteredData([]);
        setFilteredStats({});
        return;
      }

      setLoadingFilters(true);
      try {
        let query = supabase
          .from('serra_uso_cortes')
          .select(`
            *,
            serras!inner(codigo),
            projetos!inner(nome),
            projeto_otimizacoes(nome_lista),
            operadores(nome)
          `);

        if (selectedProject && selectedProject !== "all") {
          query = query.eq('projeto_id', selectedProject);
        }

        if (selectedOptimization && selectedOptimization !== "all") {
          query = query.eq('otimizacao_id', selectedOptimization);
        }

        if (analysisBladeFilter && analysisBladeFilter !== "all") {
          query = query.eq('serra_id', analysisBladeFilter);
        }

        const { data, error } = await query.order('data_corte', { ascending: false });

        if (error) throw error;

        setFilteredData(data || []);

        // Calculate statistics
        const stats = {
          totalBlades: new Set(data?.map(item => item.serra_id)).size || 0,
          totalCuts: data?.reduce((sum, item) => sum + item.quantidade_cortada, 0) || 0,
          dateRange: {
            first: data && data.length > 0 ? data[data.length - 1]?.data_corte : null,
            last: data && data.length > 0 ? data[0]?.data_corte : null
          },
          bladeUsage: data?.reduce((acc: any, item) => {
            const bladeId = item.serra_id;
            if (!acc[bladeId]) {
              acc[bladeId] = {
                codigo: item.serras.codigo,
                cuts: 0,
                firstUse: item.data_corte,
                lastUse: item.data_corte
              };
            }
            acc[bladeId].cuts += item.quantidade_cortada;
            if (item.data_corte < acc[bladeId].firstUse) {
              acc[bladeId].firstUse = item.data_corte;
            }
            if (item.data_corte > acc[bladeId].lastUse) {
              acc[bladeId].lastUse = item.data_corte;
            }
            return acc;
          }, {}) || {}
        };

        setFilteredStats(stats);
      } catch (error) {
        console.error('Error loading filtered data:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados filtrados.",
          variant: "destructive"
        });
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilteredData();
  }, [selectedProject, selectedOptimization, analysisBladeFilter]);

  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedOptimization('all');
    setAnalysisBladeFilter('all');
    setFilteredData([]);
    setFilteredStats({});
  };

  // Filter blades based on search and status
  const filteredBlades = laminas.filter(blade => {
    const matchesSearch = searchTerm === '' || 
      blade.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || blade.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentBlade = laminas.find(blade => blade.id === selectedBladeId);
  
  // Calculate cuts today from blade usage data
  const cutsToday = bladeStats?.projetos_detalhados.reduce((sum, projeto) => {
    const today = new Date().toISOString().split('T')[0];
    return sum + projeto.listas_otimizacao.filter(lista => 
      lista.data_corte.startsWith(today)
    ).reduce((acc, lista) => acc + lista.quantidade_cortada, 0);
  }, 0) || 0;

  // Estimate blade health (configurable limits could come from system settings)
  const maxCuts = 2000; // This could come from system settings or blade specifications
  const totalCuts = bladeStats?.total_pecas_cortadas || 0;
  const bladeHealth = Math.min((totalCuts / maxCuts) * 100, 100);

  // Calculate days since installation
  const daysSinceInstallation = currentBlade ? 
    Math.ceil((new Date().getTime() - new Date(currentBlade.data_instalacao).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativada': return 'bg-green-100 text-green-800 border-green-200';
      case 'desativada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'descartada': return 'bg-red-100 text-red-800 border-red-200';
      case 'substituida': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativada': return 'Ativa';
      case 'desativada': return 'Desativada';
      case 'descartada': return 'Descartada';
      case 'substituida': return 'Substituída';
      default: return 'Desconhecido';
    }
  };

  const getConditionFromHealth = (health: number) => {
    if (health >= 90) return { condition: 'critical', text: 'Crítica', color: 'bg-red-100 text-red-800 border-red-200' };
    if (health >= 75) return { condition: 'warning', text: 'Atenção', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { condition: 'good', text: 'Boa', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const handleActivateBlade = async (bladeId: string) => {
    try {
      const response = await ativarLamina(bladeId);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Lâmina ativada com sucesso.",
        });
        setSelectedBladeId(bladeId);
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao ativar lâmina.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao ativar lâmina.",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateBlade = async (bladeId: string) => {
    try {
      const response = await desativarLamina(bladeId);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Lâmina desativada com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao desativar lâmina.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao desativar lâmina.",
        variant: "destructive"
      });
    }
  };

  const handleDiscardBlade = async (bladeId: string) => {
    try {
      const response = await descartarLamina(bladeId, 'Descarte via dashboard');
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Lâmina descartada com sucesso.",
        });
        // Select another blade if current one was discarded
        if (bladeId === selectedBladeId && laminasAtivadas.length > 0) {
          setSelectedBladeId(laminasAtivadas[0].id);
        }
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao descartar lâmina.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao descartar lâmina.",
        variant: "destructive"
      });
    }
  };

  const condition = getConditionFromHealth(bladeHealth);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="management">Gestão Individual</TabsTrigger>
          <TabsTrigger value="analysis">Análise por Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="management">
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Total de Lâminas</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{overviewStats.totalBlades || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Lâminas Ativas</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{overviewStats.activeBlades || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Cortes Hoje</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{overviewStats.cutsToday || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Total de Cortes</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{overviewStats.totalCuts || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Blade Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Gestão de Lâminas
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onExport('blade-report')}>
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onSendWhatsApp('blade-report')}>
                    <Send className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onSendTelegram('blade-report')}>
                    <Send className="w-4 h-4 mr-1" />
                    Telegram
                  </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código da lâmina..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ativada">Ativada</SelectItem>
                    <SelectItem value="desativada">Desativada</SelectItem>
                    <SelectItem value="descartada">Descartada</SelectItem>
                    <SelectItem value="substituida">Substituída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Blade List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Carregando lâminas...</p>
                  </div>
                </div>
              ) : filteredBlades.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {laminas.length === 0 
                      ? "Nenhuma lâmina cadastrada no sistema."
                      : "Nenhuma lâmina encontrada com os filtros aplicados."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Instalação</TableHead>
                        <TableHead>Cortes Hoje</TableHead>
                        <TableHead>Total Cortes</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBlades.map((blade) => {
                        // Calculate today's cuts for this blade
                        const today = new Date().toISOString().split('T')[0];
                        const todayCuts = overviewStats.cutsToday || 0; // Using overview stats for performance

                        return (
                          <TableRow 
                            key={blade.id}
                            className={selectedBladeId === blade.id ? "bg-blue-50" : ""}
                          >
                            <TableCell>
                              <Button
                                variant="ghost"
                                onClick={() => setSelectedBladeId(blade.id)}
                                className="text-left p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                              >
                                {blade.codigo}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(blade.status)} variant="outline">
                                {getStatusText(blade.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(blade.data_instalacao).toLocaleDateString('pt-BR')}
                            </TableCell>
                             <TableCell>
                               {selectedBladeId === blade.id ? cutsToday : '-'}
                             </TableCell>
                            <TableCell>
                              {bladeStats && selectedBladeId === blade.id 
                                ? bladeStats.total_pecas_cortadas 
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {blade.status === 'ativada' ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDeactivateBlade(blade.id)}
                                    disabled={loading}
                                  >
                                    <PowerOff className="w-3 h-3" />
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleActivateBlade(blade.id)}
                                    disabled={loading}
                                  >
                                    <Power className="w-3 h-3" />
                                  </Button>
                                )}
                                {blade.status !== 'descartada' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDiscardBlade(blade.id)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Selected Blade Details */}
              {selectedBladeId && !loading && (
                <>
                  {/* Status da Lâmina */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalCuts}</div>
                      <div className="text-sm text-gray-600">Total de Cortes</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{cutsToday}</div>
                      <div className="text-sm text-gray-600">Cortes Hoje</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">{bladeStats?.projetos_utilizados || 0}</div>
                      <div className="text-sm text-gray-600">Projetos Utilizados</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{daysSinceInstallation}</div>
                      <div className="text-sm text-gray-600">Dias de Uso</div>
                    </div>
                  </div>

                  {/* Indicador de Saúde */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Indicador de Saúde da Lâmina</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(currentBlade.status)}>
                          {getStatusText(currentBlade.status)}
                        </Badge>
                        <Badge className={condition.color}>
                          {condition.text}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Vida Útil</span>
                        <span>{totalCuts} / {maxCuts} cortes</span>
                      </div>
                      <Progress value={bladeHealth} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Instalação:</span>
                        <div className="font-medium">
                          {new Date(currentBlade.data_instalacao).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Primeiro Uso:</span>
                        <div className="font-medium">
                          {bladeStats?.primeiro_uso ? new Date(bladeStats.primeiro_uso).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {bladeHealth > 75 && (
                      <Alert className={bladeHealth > 90 ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
                        <AlertTriangle className={`h-4 w-4 ${bladeHealth > 90 ? 'text-red-600' : 'text-yellow-600'}`} />
                        <AlertDescription className={bladeHealth > 90 ? "text-red-800" : "text-yellow-800"}>
                          <strong>{bladeHealth > 90 ? 'CRÍTICO:' : 'Atenção:'}</strong> 
                          {bladeHealth > 90 ? ' Lâmina deve ser trocada imediatamente!' : ' Lâmina próxima do limite recomendado. Programar troca em breve.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Histórico de Projetos */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Histórico de Projetos</h4>
                    {bladeStats?.projetos_detalhados.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">Nenhum projeto encontrado para esta lâmina.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="border border-gray-300 px-3 py-2 text-left">Projeto</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Listas</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Total Peças</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Primeiro Uso</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Último Uso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bladeStats?.projetos_detalhados.map((projeto, index) => (
                              <tr key={projeto.projeto_id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 font-medium">
                                  {projeto.projeto_nome}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <div className="space-y-1">
                                    {projeto.listas_otimizacao.map((lista, idx) => (
                                      <div key={idx} className="text-xs">
                                        <span className="font-medium">{lista.nome_lista}</span>
                                        <span className="text-gray-500 ml-1">({lista.quantidade_cortada} peças)</span>
                                        <span className="text-gray-400 ml-1">{new Date(lista.data_corte).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 font-semibold">
                                  {projeto.total_pecas_projeto}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  {new Date(projeto.data_primeiro_uso).toLocaleDateString()}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  {new Date(projeto.data_ultimo_uso).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Substituições */}
                  {bladeStats?.substituicoes && bladeStats.substituicoes.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h4 className="font-semibold">Histórico de Substituições</h4>
                      <div className="space-y-2">
                        {bladeStats.substituicoes.map((substituicao) => (
                          <Alert key={substituicao.id} className="border-blue-200 bg-blue-50">
                            <AlertDescription className="text-blue-800">
                              <div className="flex justify-between items-start">
                                <div>
                                  <strong>Motivo:</strong> {substituicao.motivo}<br />
                                  <strong>Data:</strong> {new Date(substituicao.data_substituicao).toLocaleDateString()}
                                  {substituicao.observacoes && (
                                    <>
                                      <br />
                                      <strong>Observações:</strong> {substituicao.observacoes}
                                    </>
                                  )}
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alerta de Troca */}
                  {bladeHealth > 90 && currentBlade.status === 'ativada' && (
                    <Alert className="border-red-200 bg-red-50 mt-6">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>CRÍTICO:</strong> Lâmina deve ser trocada imediatamente!
                          </div>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDiscardBlade(currentBlade.id)}
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Descartar Lâmina
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Análise de Uso por Projeto/Lista
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onExport('filtered-analysis')}>
                    <Download className="w-4 h-4 mr-1" />
                    Exportar Filtros
                  </Button>
                </div>
              </div>

              {/* Filters Section */}
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="w-4 h-4" />
                  Filtros de Análise
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Projeto:</label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os projetos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os projetos</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Lista de Otimização:</label>
                    <Select 
                      value={selectedOptimization} 
                      onValueChange={setSelectedOptimization}
                      disabled={!selectedProject || selectedProject === "all"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as listas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as listas</SelectItem>
                        {optimizations.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Lâmina:</label>
                    <Select value={analysisBladeFilter} onValueChange={setAnalysisBladeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as lâminas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as lâminas</SelectItem>
                        {laminas.map((blade) => (
                          <SelectItem key={blade.id} value={blade.id}>
                            {blade.codigo} - {getStatusText(blade.status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      disabled={(!selectedProject || selectedProject === "all") && (!selectedOptimization || selectedOptimization === "all") && (!analysisBladeFilter || analysisBladeFilter === "all")}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingFilters ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Carregando análise...</p>
                  </div>
                </div>
              ) : (!selectedProject && !selectedOptimization) ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Selecione um projeto para visualizar a análise de uso de lâminas.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{filteredStats.totalBlades}</div>
                      <div className="text-sm text-gray-600">Lâminas Utilizadas</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{filteredStats.totalCuts}</div>
                      <div className="text-sm text-gray-600">Total de Cortes</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {filteredStats.dateRange?.first ? 
                          Math.ceil((new Date(filteredStats.dateRange.last).getTime() - new Date(filteredStats.dateRange.first).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0}
                      </div>
                      <div className="text-sm text-gray-600">Dias de Operação</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {filteredStats.totalBlades > 0 ? Math.round(filteredStats.totalCuts / filteredStats.totalBlades) : 0}
                      </div>
                      <div className="text-sm text-gray-600">Cortes por Lâmina</div>
                    </div>
                  </div>

                  {/* Filter Summary */}
                  {(selectedProject || selectedOptimization) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Filtros Aplicados:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {selectedProject && (
                          <div>Projeto: <span className="font-medium">{projects.find(p => p.id === selectedProject)?.nome}</span></div>
                        )}
                        {selectedOptimization && (
                          <div>Lista: <span className="font-medium">{optimizations.find(o => o.id === selectedOptimization)?.nome}</span></div>
                        )}
                        {filteredStats.dateRange?.first && (
                          <div>Período: <span className="font-medium">
                            {new Date(filteredStats.dateRange.first).toLocaleDateString()} - {new Date(filteredStats.dateRange.last).toLocaleDateString()}
                          </span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Blade Usage Table */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Uso de Lâminas no Filtro</h4>
                    {Object.keys(filteredStats.bladeUsage || {}).length === 0 ? (
                      <p className="text-gray-600 text-center py-4">Nenhum dado encontrado para os filtros aplicados.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="border border-gray-300 px-3 py-2 text-left">Código da Lâmina</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Cortes Realizados</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Primeiro Uso</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Último Uso</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Participação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(filteredStats.bladeUsage || {})
                              .sort(([,a]: any, [,b]: any) => b.cuts - a.cuts)
                              .map(([bladeId, usage]: [string, any]) => (
                                <tr key={bladeId} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-3 py-2 font-medium">
                                    {usage.codigo}
                                  </td>
                                  <td className="border border-gray-300 px-3 py-2 font-semibold">
                                    {usage.cuts}
                                  </td>
                                  <td className="border border-gray-300 px-3 py-2">
                                    {new Date(usage.firstUse).toLocaleDateString()}
                                  </td>
                                  <td className="border border-gray-300 px-3 py-2">
                                    {new Date(usage.lastUse).toLocaleDateString()}
                                  </td>
                                  <td className="border border-gray-300 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full" 
                                          style={{ width: `${(usage.cuts / filteredStats.totalCuts) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-gray-600">
                                        {Math.round((usage.cuts / filteredStats.totalCuts) * 100)}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Detailed Usage History */}
                  {filteredData.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Histórico Detalhado de Cortes</h4>
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="border border-gray-300 px-3 py-2 text-left">Data</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Lâmina</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Projeto</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Lista</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Peças</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Operador</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData.slice(0, 50).map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2">
                                  {new Date(item.data_corte).toLocaleDateString()}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 font-medium">
                                  {item.serras.codigo}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  {item.projetos.nome}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  {item.projeto_otimizacoes?.nome_lista || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 font-semibold">
                                  {item.quantidade_cortada}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  {item.operadores?.nome || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredData.length > 50 && (
                        <p className="text-sm text-gray-600 text-center">
                          Mostrando 50 de {filteredData.length} registros
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};