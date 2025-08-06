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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estatísticas - {selectedSerra?.codigo}</DialogTitle>
          </DialogHeader>
          {estatisticas && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{estatisticas.total_pecas_cortadas}</div>
                    <p className="text-xs text-muted-foreground">Peças Cortadas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{estatisticas.projetos_utilizados}</div>
                    <p className="text-xs text-muted-foreground">Projetos Utilizados</p>
                  </CardContent>
                </Card>
              </div>
              
              {estatisticas.primeiro_uso && (
                <div>
                  <Label>Primeiro Uso</Label>
                  <p>{new Date(estatisticas.primeiro_uso).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              
              {estatisticas.ultimo_uso && (
                <div>
                  <Label>Último Uso</Label>
                  <p>{new Date(estatisticas.ultimo_uso).toLocaleDateString('pt-BR')}</p>
                </div>
              )}

              {estatisticas.substituicoes.length > 0 && (
                <div>
                  <Label>Histórico de Substituições/Descartes</Label>
                  <div className="mt-2 space-y-2">
                    {estatisticas.substituicoes.map((subst: any) => (
                      <div key={subst.id} className="border rounded p-2">
                        <p className="text-sm">
                          <strong>Data:</strong> {new Date(subst.data_substituicao).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm">
                          <strong>Motivo:</strong> {subst.motivo}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};