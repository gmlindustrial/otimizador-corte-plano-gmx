import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, RefreshCw, Settings } from 'lucide-react';
import { useSerraService } from '@/hooks/useSerraService';
import { operadorService } from '@/services/entities/OperadorService';
import type { Serra } from '@/services/interfaces/serra';

export const SerraManagement = () => {
  const { serras, serrasAtivas, loading, createSerra, updateSerra, substituirSerra, getEstatisticas } = useSerraService();
  const [operadores, setOperadores] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchOperadores = async () => {
      const response = await operadorService.getAll();
      if (response.success) {
        setOperadores(response.data);
      }
    };
    fetchOperadores();
  }, []);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubstituirDialog, setShowSubstituirDialog] = useState(false);
  const [showEstatisticasDialog, setShowEstatisticasDialog] = useState(false);
  const [selectedSerra, setSelectedSerra] = useState<Serra | null>(null);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    observacoes: '',
    status: 'ativa' as Serra['status']
  });

  const [substituicaoData, setSubstituicaoData] = useState({
    codigo: '',
    motivo: '',
    operadorId: '',
    observacoes: ''
  });

  const handleCreateSerra = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const novaSerra = await createSerra({
      codigo: formData.codigo,
      data_instalacao: new Date().toISOString(),
      status: formData.status,
      observacoes: formData.observacoes
    });

    if (novaSerra) {
      setShowCreateDialog(false);
      setFormData({ codigo: '', observacoes: '', status: 'ativa' });
    }
  };

  const handleSubstituir = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSerra) return;

    const resultado = await substituirSerra(
      selectedSerra.id,
      {
        codigo: substituicaoData.codigo,
        data_instalacao: new Date().toISOString(),
        status: 'ativa',
        observacoes: substituicaoData.observacoes
      },
      substituicaoData.motivo,
      substituicaoData.operadorId || undefined
    );

    if (resultado) {
      setShowSubstituirDialog(false);
      setSubstituicaoData({ codigo: '', motivo: '', operadorId: '', observacoes: '' });
      setSelectedSerra(null);
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
      ativa: 'default',
      substituida: 'secondary',
      manutencao: 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Controle de Serras</h2>
          <p className="text-muted-foreground">
            Gerencie suas serras e monitore o uso por quantidade de peças cortadas
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
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serras.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serras Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serrasAtivas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serras.filter(s => s.status === 'manutencao').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Substituídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serras.filter(s => s.status === 'substituida').length}
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEstatisticas(serra)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {serra.status === 'ativa' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSerra(serra);
                            setShowSubstituirDialog(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para Substituição */}
      <Dialog open={showSubstituirDialog} onOpenChange={setShowSubstituirDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substituir Serra {selectedSerra?.codigo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubstituir} className="space-y-4">
            <div>
              <Label htmlFor="novo-codigo">Código da Nova Serra</Label>
              <Input
                id="novo-codigo"
                value={substituicaoData.codigo}
                onChange={(e) => setSubstituicaoData({ ...substituicaoData, codigo: e.target.value })}
                placeholder="Ex: SERRA-002"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="motivo">Motivo da Substituição</Label>
              <Textarea
                id="motivo"
                value={substituicaoData.motivo}
                onChange={(e) => setSubstituicaoData({ ...substituicaoData, motivo: e.target.value })}
                placeholder="Ex: Desgaste excessivo, quebra, manutenção preventiva..."
                required
              />
            </div>

            <div>
              <Label htmlFor="operador">Operador Responsável</Label>
              <Select value={substituicaoData.operadorId} onValueChange={(value) => setSubstituicaoData({ ...substituicaoData, operadorId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o operador" />
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

            <div>
              <Label htmlFor="observacoes-subst">Observações</Label>
              <Textarea
                id="observacoes-subst"
                value={substituicaoData.observacoes}
                onChange={(e) => setSubstituicaoData({ ...substituicaoData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowSubstituirDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                Substituir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Estatísticas */}
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
                  <Label>Histórico de Substituições</Label>
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