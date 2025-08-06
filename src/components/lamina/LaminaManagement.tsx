import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Eye, Play, Pause, Trash2, RotateCcw } from 'lucide-react';
import { useLaminaService } from '@/hooks/useLaminaService';
import { operadorService } from '@/services';
import type { Lamina, LaminaEstatisticas } from '@/services/interfaces/lamina';
import type { Operador } from '@/services/interfaces';
import { toast } from '@/hooks/use-toast';
export const LaminaManagement = () => {
  const {
    laminas,
    loading,
    error,
    createLamina,
    ativarLamina,
    desativarLamina,
    descartarLamina,
    getEstatisticas,
    refetch
  } = useLaminaService();
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [selectedLamina, setSelectedLamina] = useState<Lamina | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    status: 'ativada',
    observacoes: ''
  });
  const [discardData, setDiscardData] = useState({
    motivo: '',
    operadorId: ''
  });
  const [stats, setStats] = useState<LaminaEstatisticas | null>(null);
  useEffect(() => {
    const fetchOperadores = async () => {
      const response = await operadorService.getAll();
      if (response.success) {
        setOperadores(response.data);
      }
    };
    fetchOperadores();
  }, []);
  const handleCreateLamina = async () => {
    const response = await createLamina({
      codigo: formData.codigo,
      status: formData.status as 'ativada' | 'desativada' | 'descartada',
      data_instalacao: new Date().toISOString(),
      observacoes: formData.observacoes || undefined
    });
    if (response.success) {
      setIsCreateDialogOpen(false);
      setFormData({
        codigo: '',
        status: 'ativada',
        observacoes: ''
      });
      toast({
        title: "Sucesso",
        description: "Lâmina criada com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: response.error || "Erro ao criar lâmina",
        variant: "destructive"
      });
    }
  };
  const handleAtivar = async (lamina: Lamina) => {
    const response = await ativarLamina(lamina.id);
    if (response.success) {
      toast({
        title: "Sucesso",
        description: "Lâmina ativada com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: response.error || "Erro ao ativar lâmina",
        variant: "destructive"
      });
    }
  };
  const handleDesativar = async (lamina: Lamina) => {
    const response = await desativarLamina(lamina.id);
    if (response.success) {
      toast({
        title: "Sucesso",
        description: "Lâmina desativada com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: response.error || "Erro ao desativar lâmina",
        variant: "destructive"
      });
    }
  };
  const handleDescartar = async () => {
    if (!selectedLamina || !discardData.motivo) return;
    const response = await descartarLamina(selectedLamina.id, discardData.motivo, discardData.operadorId || undefined);
    if (response.success) {
      setIsDiscardDialogOpen(false);
      setSelectedLamina(null);
      setDiscardData({
        motivo: '',
        operadorId: ''
      });
      toast({
        title: "Sucesso",
        description: "Lâmina descartada com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: response.error || "Erro ao descartar lâmina",
        variant: "destructive"
      });
    }
  };
  const handleViewStats = async (lamina: Lamina) => {
    const statistics = await getEstatisticas(lamina.id);
    if (statistics) {
      setStats(statistics);
      setSelectedLamina(lamina);
      setIsStatsDialogOpen(true);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativada':
        return <Badge variant="default" className="bg-green-500">Ativada</Badge>;
      case 'desativada':
        return <Badge variant="secondary">Desativada</Badge>;
      case 'descartada':
        return <Badge variant="destructive">Descartada</Badge>;
      case 'substituida':
        return <Badge variant="outline">Substituída</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const totalLaminas = laminas.length;
  const laminasAtivadas = laminas.filter(s => s.status === 'ativada').length;
  const laminasDesativadas = laminas.filter(s => s.status === 'desativada').length;
  const laminasDescartadas = laminas.filter(s => s.status === 'descartada').length;
  if (error) {
    return <div className="p-6 text-center">
        <p className="text-destructive">Erro: {error}</p>
        <Button onClick={refetch} className="mt-4">Tentar Novamente</Button>
      </div>;
  }
  return <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Lâminas</h1>
          <p className="text-muted-foreground">Gerencie suas lâminas de serra, controle de status e substituições</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Lâmina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Lâmina</DialogTitle>
              <DialogDescription>
                Registre uma nova lâmina no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="codigo">Código da Lâmina</Label>
                <Input id="codigo" value={formData.codigo} onChange={e => setFormData({
                ...formData,
                codigo: e.target.value
              })} placeholder="Ex: LAMINA-001" />
              </div>
              <div>
                <Label htmlFor="status">Status Inicial</Label>
                <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativada">Ativada</SelectItem>
                    <SelectItem value="desativada">Desativada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" value={formData.observacoes} onChange={e => setFormData({
                ...formData,
                observacoes: e.target.value
              })} placeholder="Informações adicionais sobre a lâmina..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLamina} disabled={!formData.codigo}>
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lâminas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLaminas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lâminas Ativadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{laminasAtivadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lâminas Desativadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{laminasDesativadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lâminas Descartadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{laminasDescartadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Lâminas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lâminas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as lâminas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Instalação</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow>
                  <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                </TableRow> : laminas.length === 0 ? <TableRow>
                  <TableCell colSpan={5} className="text-center">Nenhuma lâmina cadastrada</TableCell>
                </TableRow> : laminas.map(lamina => <TableRow key={lamina.id}>
                    <TableCell className="font-medium">{lamina.codigo}</TableCell>
                    <TableCell>{getStatusBadge(lamina.status)}</TableCell>
                    <TableCell>
                      {new Date(lamina.data_instalacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {lamina.observacoes || '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewStats(lamina)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Estatísticas
                          </DropdownMenuItem>
                          {lamina.status === 'desativada' && <DropdownMenuItem onClick={() => handleAtivar(lamina)}>
                              <Play className="mr-2 h-4 w-4" />
                              Ativar
                            </DropdownMenuItem>}
                          {lamina.status === 'ativada' && <DropdownMenuItem onClick={() => handleDesativar(lamina)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>}
                          {lamina.status === 'substituida' && <DropdownMenuItem onClick={() => handleAtivar(lamina)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reativar
                            </DropdownMenuItem>}
                          {(lamina.status === 'ativada' || lamina.status === 'desativada') && <DropdownMenuItem onClick={() => {
                      setSelectedLamina(lamina);
                      setIsDiscardDialogOpen(true);
                    }} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Descartar
                            </DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para Descartar Lâmina */}
      <AlertDialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar Lâmina</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará a lâmina como descartada. A lâmina não poderá mais ser utilizada 
              até que seja reativada ou substituída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="motivo">Motivo do Descarte *</Label>
              <Textarea id="motivo" value={discardData.motivo} onChange={e => setDiscardData({
              ...discardData,
              motivo: e.target.value
            })} placeholder="Lâmina cega, quebrada, desgaste excessivo..." />
            </div>
            <div>
              <Label htmlFor="operador">Responsável (Opcional)</Label>
              <Select value={discardData.operadorId} onValueChange={value => setDiscardData({
              ...discardData,
              operadorId: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um operador" />
                </SelectTrigger>
                <SelectContent>
                  {operadores.map(operador => <SelectItem key={operador.id} value={operador.id}>
                      {operador.nome}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDescartar} disabled={!discardData.motivo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Descarte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Estatísticas */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estatísticas Detalhadas da Lâmina</DialogTitle>
            <DialogDescription>
              {selectedLamina?.codigo} - Dados completos de uso e histórico
            </DialogDescription>
          </DialogHeader>
          
          {stats && <div className="space-y-6">
              {/* Métricas Temporais */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Métricas Temporais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p><strong>Data de Criação:</strong> {new Date(stats.metricas_tempo.data_criacao).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Primeira Ativação:</strong> {stats.metricas_tempo.data_primeira_ativacao ? new Date(stats.metricas_tempo.data_primeira_ativacao).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p><strong>Última Ativação:</strong> {stats.metricas_tempo.data_ultima_ativacao ? new Date(stats.metricas_tempo.data_ultima_ativacao).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Última Desativação:</strong> {stats.metricas_tempo.data_ultima_desativacao ? new Date(stats.metricas_tempo.data_ultima_desativacao).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p><strong>Data de Descarte:</strong> {stats.metricas_tempo.data_descarte ? new Date(stats.metricas_tempo.data_descarte).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p><strong>Tempo Ativo:</strong> {stats.metricas_tempo.tempo_total_ativo_dias?.toFixed(1)} dias</p>
                  </div>
                </div>
              </div>

              {/* Uso Geral */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Uso Geral</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">{stats.total_pecas_cortadas}</div>
                    <div className="text-sm text-muted-foreground">Total de Peças Cortadas</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">{stats.projetos_utilizados}</div>
                    <div className="text-sm text-muted-foreground">Projetos Utilizados</div>
                  </div>
                  
                </div>
              </div>

              {/* Detalhamento de Projetos */}
              {stats.projetos_detalhados.length > 0 && <div>
                  <h3 className="text-lg font-semibold mb-3">Projetos Detalhados</h3>
                  <div className="space-y-3">
                    {stats.projetos_detalhados.map((projeto, index) => <div key={index} className="border rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{projeto.projeto_nome}</h4>
                          <Badge variant="outline">{projeto.total_pecas_projeto} peças</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Período: {new Date(projeto.data_primeiro_uso).toLocaleDateString('pt-BR')} - {new Date(projeto.data_ultimo_uso).toLocaleDateString('pt-BR')}</p>
                          <p>Listas de Otimização: {projeto.listas_otimizacao.length}</p>
                        </div>
                      </div>)}
                  </div>
                </div>}

              {/* Histórico de Status */}
              {stats.historico_status.length > 0 && <div>
                  <h3 className="text-lg font-semibold mb-3">Histórico de Status</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {stats.historico_status.map((historico, index) => <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{historico.status_anterior || 'N/A'} → {historico.status_novo}</span>
                          {historico.motivo && <span className="text-sm text-muted-foreground ml-2">({historico.motivo})</span>}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(historico.data_mudanca).toLocaleDateString('pt-BR')}
                        </span>
                      </div>)}
                  </div>
                </div>}

              {/* Histórico de Substituições */}
              {stats.substituicoes.length > 0 && <div>
                  <h3 className="text-lg font-semibold mb-3">Histórico de Substituições</h3>
                  <div className="space-y-2">
                    {stats.substituicoes.map((substituicao, index) => <div key={index} className="p-2 border rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{substituicao.motivo}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(substituicao.data_substituicao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {substituicao.observacoes && <p className="text-sm text-muted-foreground mt-1">{substituicao.observacoes}</p>}
                      </div>)}
                  </div>
                </div>}
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};