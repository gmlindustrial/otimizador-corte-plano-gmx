import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Download, Clock, User, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auditService, type AuditLog, type SystemActivityLog, type AuditFilters } from '@/services/AuditService';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface AuditLogViewerProps {
  onClose?: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ onClose }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<SystemActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [filters, setFilters] = useState<AuditFilters>({
    limit: 50,
    offset: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [auditResult, activityResult] = await Promise.all([
        auditService.getAuditLogs(filters),
        auditService.getSystemActivityLogs(filters)
      ]);

      if (auditResult.success) {
        setAuditLogs(auditResult.data);
      } else {
        toast.error(`Erro ao carregar logs de auditoria: ${auditResult.error}`);
      }

      if (activityResult.success) {
        setActivityLogs(activityResult.data);
      } else {
        toast.error(`Erro ao carregar logs de atividade: ${activityResult.error}`);
      }
    } catch (error) {
      toast.error('Erro ao carregar logs');
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await auditService.getAuditStats(filters);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'all') => {
    setDateRange(range);
    
    const now = new Date();
    let startDate: Date | undefined;
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = undefined;
        break;
    }
    
    setFilters(prev => ({ ...prev, startDate, offset: 0 }));
  };

  const handleFilterChange = () => {
    const newFilters: AuditFilters = {
      ...filters,
      actionType: selectedActionType || undefined,
      entityType: selectedEntityType || undefined,
      offset: 0
    };
    
    setFilters(newFilters);
  };

  const handleExport = async () => {
    try {
      const result = await auditService.exportAuditLogs(filters);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Logs exportados com sucesso!');
      } else {
        toast.error(`Erro ao exportar logs: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao exportar logs');
      console.error('Erro ao exportar:', error);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'CRIAR':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
      case 'EDITAR':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
      case 'EXCLUIR':
        return 'bg-red-100 text-red-800';
      case 'OTIMIZAR':
        return 'bg-purple-100 text-purple-800';
      case 'VISUALIZAR':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredActivityLogs = activityLogs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.description.toLowerCase().includes(searchLower) ||
        log.user_name?.toLowerCase().includes(searchLower) ||
        log.entity_type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Logs de Auditoria</h2>
          <p className="text-muted-foreground">
            Visualize todas as ações realizadas no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Ações</p>
                  <p className="text-2xl font-bold">{stats.totalActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Últimas 24h</p>
                  <p className="text-2xl font-bold">{stats.recentActivity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.actionsByUser).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipos de Entidade</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.actionsByEntity).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo de Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as Ações</SelectItem>
                  <SelectItem value="CRIAR">Criar</SelectItem>
                  <SelectItem value="EDITAR">Editar</SelectItem>
                  <SelectItem value="EXCLUIR">Excluir</SelectItem>
                  <SelectItem value="OTIMIZAR">Otimizar</SelectItem>
                  <SelectItem value="VISUALIZAR">Visualizar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo de Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as Entidades</SelectItem>
                  <SelectItem value="PROJETO">Projeto</SelectItem>
                  <SelectItem value="PECA">Peça</SelectItem>
                  <SelectItem value="OTIMIZACAO">Otimização</SelectItem>
                  <SelectItem value="USUARIO">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleFilterChange} variant="outline">
              Aplicar Filtros
            </Button>
          </div>
          
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, usuário ou entidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Tables */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Logs de Atividade ({activityLogs.length})</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria ({auditLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Atividade do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Carregando logs...
                        </TableCell>
                      </TableRow>
                    ) : filteredActivityLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActivityLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {log.user_name || 'Sistema'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeColor(log.action_type)}>
                              {log.action_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.entity_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={log.description}>
                              {log.description}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria (Triggers Automáticos)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Registro ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Carregando logs...
                        </TableCell>
                      </TableRow>
                    ) : auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {log.user_name || 'Sistema'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.table_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeColor(log.action_type)}>
                              {log.action_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.record_id.substring(0, 8)}...
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};