import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Eye, MoreHorizontal, CheckCircle, XCircle, Trash2, BarChart3, Wrench, Clock } from 'lucide-react';
import { useSerraService } from '@/hooks/useSerraService';
import { operadorService } from '@/services/entities/OperadorService';
import type { Serra, SerraEstatisticas } from '@/services/interfaces/serra';
import type { Operador } from '@/services/interfaces';

export const SerraManagement = () => {
  const { 
    serras, 
    serrasAtivadas, 
    loading, 
    createSerra, 
    ativarSerra,
    desativarSerra,
    descartarSerra, 
    getEstatisticas 
  } = useSerraService();
  const [operadores, setOperadores] = useState<Operador[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDescartarDialog, setShowDescartarDialog] = useState(false);
  const [showEstatisticasDialog, setShowEstatisticasDialog] = useState(false);
  const [selectedSerra, setSelectedSerra] = useState<Serra | null>(null);
  const [estatisticas, setEstatisticas] = useState<SerraEstatisticas | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    data_instalacao: '',
    status: 'ativada' as Serra['status'],
    observacoes: ''
  });

  const [descarteData, setDescarteData] = useState({
    motivo: '',
    operador_id: ''
  });

  React.useEffect(() => {
    const fetchOperadores = async () => {
      const response = await operadorService.getAll();
      if (response.success) {
        setOperadores(response.data);
      }
    };
    fetchOperadores();
  }, []);

  const handleCreateSerra = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await createSerra({
      codigo: formData.codigo,
      data_instalacao: formData.data_instalacao || new Date().toISOString(),
      status: formData.status,
      observacoes: formData.observacoes
    });

    if (result.success) {
      setShowCreateDialog(false);
      setFormData({
        codigo: '',
        data_instalacao: '',
        status: 'ativada',
        observacoes: ''
      });
    }
  };

  const handleAtivar = async (serra: Serra) => {
    const result = await ativarSerra(serra.id);
    if (result.success) {
      // Sucesso já é mostrado pelo service
    }
  };

  const handleDesativar = async (serra: Serra) => {
    const result = await desativarSerra(serra.id);
    if (result.success) {
      // Sucesso já é mostrado pelo service
    }
  };

  const handleDescartar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSerra) return;

    const result = await descartarSerra(
      selectedSerra.id,
      descarteData.motivo,
      descarteData.operador_id || undefined
    );

    if (result.success) {
      setShowDescartarDialog(false);
      setSelectedSerra(null);
      setDescarteData({
        motivo: '',
        operador_id: ''
      });
    }
  };

  const handleViewEstatisticas = async (serra: Serra) => {
    setSelectedSerra(serra);
    const stats = await getEstatisticas(serra.id);
    setEstatisticas(stats);
    setShowEstatisticasDialog(true);
  };

  const getStatusBadge = (status: Serra['status']) => {
    const variants = {
      ativada: 'default',
      desativada: 'secondary',
      descartada: 'destructive'
    } as const;

    const labels = {
      ativada: 'Ativada',
      desativada: 'Desativada',
      descartada: 'Descartada'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status]}
      </Badge>
    );
  };

  // Estatísticas do dashboard
  const totalSerras = serras.length;
  const serrasAtivadasCount = serras.filter(s => s.status === 'ativada').length;
  const serrasDesativadas = serras.filter(s => s.status === 'desativada').length;
  const serrasDescartadas = serras.filter(s => s.status === 'descartada').length;

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Controle de Serras</h2>
          <p className="text-muted-foreground">
            Gerencie suas serras com controle simplificado de status
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Serra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Serra</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSerra} className="space-y-4">
              <div>
                <Label htmlFor="codigo">Código da Serra</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: SERRA-001"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Serra['status']) => setFormData({ ...formData, status: value })}>
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
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre a serra..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serras</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSerras}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serras Ativadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{serrasAtivadasCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desativadas</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{serrasDesativadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descartadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{serrasDescartadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Serras */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Serras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Instalação</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serras.map((serra) => (
                <TableRow key={serra.id}>
                  <TableCell className="font-medium">{serra.codigo}</TableCell>
                  <TableCell>{getStatusBadge(serra.status)}</TableCell>
                  <TableCell>
                    {new Date(serra.data_instalacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{serra.observacoes || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewEstatisticas(serra)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Ver Estatísticas
                        </DropdownMenuItem>
                        {serra.status === 'desativada' && (
                          <DropdownMenuItem onClick={() => handleAtivar(serra)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                        {serra.status === 'ativada' && (
                          <DropdownMenuItem onClick={() => handleDesativar(serra)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Desativar
                          </DropdownMenuItem>
                        )}
                        {serra.status !== 'descartada' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedSerra(serra);
                                setShowDescartarDialog(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Descartar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Descarte */}
      <Dialog open={showDescartarDialog} onOpenChange={setShowDescartarDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Descartar Serra</DialogTitle>
            <DialogDescription>
              Descartar a serra {selectedSerra?.codigo}. Esta ação é permanente e a serra não poderá ser reativada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDescartar}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="motivo">Motivo do Descarte</Label>
                <Textarea
                  id="motivo"
                  value={descarteData.motivo}
                  onChange={(e) => setDescarteData(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ex: Serra cega, quebrada, desgaste excessivo..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="operador">Operador Responsável</Label>
                <Select
                  value={descarteData.operador_id}
                  onValueChange={(value) => setDescarteData(prev => ({ ...prev, operador_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operadores.map((operador) => (
                      <SelectItem key={operador.id} value={operador.id}>
                        {operador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDescartarDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive">Descartar Serra</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Estatísticas */}
      <Dialog open={showEstatisticasDialog} onOpenChange={setShowEstatisticasDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estatísticas Detalhadas da Serra {selectedSerra?.codigo}</DialogTitle>
          </DialogHeader>
          
          {estatisticas && (
            <div className="space-y-6">
              {/* Métricas de Tempo */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico Temporal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p><strong>Data de criação:</strong> {new Date(estatisticas.metricas_tempo.data_criacao).toLocaleDateString()}</p>
                      <p><strong>Primeira ativação:</strong> {estatisticas.metricas_tempo.data_primeira_ativacao ? new Date(estatisticas.metricas_tempo.data_primeira_ativacao).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Última ativação:</strong> {estatisticas.metricas_tempo.data_ultima_ativacao ? new Date(estatisticas.metricas_tempo.data_ultima_ativacao).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Última desativação:</strong> {estatisticas.metricas_tempo.data_ultima_desativacao ? new Date(estatisticas.metricas_tempo.data_ultima_desativacao).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Data de descarte:</strong> {estatisticas.metricas_tempo.data_descarte ? new Date(estatisticas.metricas_tempo.data_descarte).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Tempo ativo:</strong> {estatisticas.metricas_tempo.tempo_total_ativo_dias ? `${estatisticas.metricas_tempo.tempo_total_ativo_dias} dias` : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uso Geral */}
              <Card>
                <CardHeader>
                  <CardTitle>Uso Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{estatisticas.total_pecas_cortadas}</p>
                      <p className="text-sm text-muted-foreground">Peças cortadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{estatisticas.projetos_utilizados}</p>
                      <p className="text-sm text-muted-foreground">Projetos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">{estatisticas.primeiro_uso ? new Date(estatisticas.primeiro_uso).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Primeiro uso</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">{estatisticas.ultimo_uso ? new Date(estatisticas.ultimo_uso).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Último uso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projetos Detalhados */}
              <Card>
                <CardHeader>
                  <CardTitle>Projetos Utilizados</CardTitle>
                </CardHeader>
                <CardContent>
                  {estatisticas.projetos_detalhados.length > 0 ? (
                    <div className="space-y-4">
                      {estatisticas.projetos_detalhados.map((projeto, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{projeto.projeto_nome}</h4>
                              <p className="text-sm text-muted-foreground">
                                {projeto.total_pecas_projeto} peças cortadas
                              </p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>Primeiro uso: {new Date(projeto.data_primeiro_uso).toLocaleDateString()}</p>
                              <p>Último uso: {new Date(projeto.data_ultimo_uso).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {projeto.listas_otimizacao.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Listas de Otimização:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {projeto.listas_otimizacao.map((lista, listaIndex) => (
                                  <div key={listaIndex} className="bg-muted p-2 rounded text-sm">
                                    <p className="font-medium">{lista.nome_lista}</p>
                                    <p className="text-muted-foreground">{lista.quantidade_cortada} peças</p>
                                    <p className="text-xs text-muted-foreground">{new Date(lista.data_corte).toLocaleDateString()}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum projeto registrado</p>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Mudanças de Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {estatisticas.historico_status.length > 0 ? (
                    <div className="space-y-2">
                      {estatisticas.historico_status.map((historico, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">
                              {historico.status_anterior ? `${historico.status_anterior} → ` : ''}
                              <span className={`px-2 py-1 rounded text-xs ${
                                historico.status_novo === 'ativada' ? 'bg-green-100 text-green-800' :
                                historico.status_novo === 'desativada' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {historico.status_novo}
                              </span>
                            </p>
                            {historico.motivo && (
                              <p className="text-sm text-muted-foreground mt-1">{historico.motivo}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{new Date(historico.data_mudanca).toLocaleDateString()}</p>
                            <p>{new Date(historico.data_mudanca).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhuma mudança de status registrada</p>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Substituições */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Substituições</CardTitle>
                </CardHeader>
                <CardContent>
                  {estatisticas.substituicoes.length > 0 ? (
                    <div className="space-y-2">
                      {estatisticas.substituicoes.map((sub, index) => (
                        <div key={index} className="p-3 border rounded">
                          <p><strong>Motivo:</strong> {sub.motivo}</p>
                          <p><strong>Data:</strong> {new Date(sub.data_substituicao).toLocaleDateString()}</p>
                          {sub.observacoes && <p><strong>Observações:</strong> {sub.observacoes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhuma substituição registrada</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};