import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  User, 
  Activity, 
  Search, 
  Filter,
  FileText,
  Package,
  Settings,
  Calculator,
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auditService, type AuditFilters, type SystemActivityLog } from '@/services/AuditService';
import { toast } from 'sonner';

interface ProjectHistoryEntry {
  id: string;
  timestamp: Date;
  user: { id?: string; name: string };
  action: string;
  entity: 'PROJETO' | 'PECA' | 'OTIMIZACAO' | 'SISTEMA';
  description: string;
  details?: any;
  icon: any;
  color: string;
}

interface ProjectHistoryTabProps {
  projectId: string;
  projectName: string;
}

const getActionIcon = (entityType: string, actionType: string) => {
  switch (entityType) {
    case 'PROJETO':
      return FileText;
    case 'PECA':
      return Package;
    case 'OTIMIZACAO':
      return Calculator;
    default:
      return Activity;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType.toLowerCase()) {
    case 'criar':
    case 'adicionar':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'editar':
    case 'atualizar':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'excluir':
    case 'deletar':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'visualizar':
    case 'acessar':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const ProjectHistoryTab = ({ projectId, projectName }: ProjectHistoryTabProps) => {
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<string>('7');

  useEffect(() => {
    loadProjectHistory();
  }, [projectId, selectedActionType, selectedEntityType, dateRange]);

  const loadProjectHistory = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const filters: AuditFilters = {
        startDate,
        endDate,
        actionType: selectedActionType === 'all' ? undefined : selectedActionType,
        entityType: selectedEntityType === 'all' ? undefined : selectedEntityType,
        limit: 100
      };

      // Carregar logs de atividade do sistema
      const systemLogsResponse = await auditService.getSystemActivityLogs(filters);
      
      if (systemLogsResponse.success && systemLogsResponse.data) {
        // Filtrar logs relacionados ao projeto
        const projectRelatedLogs = systemLogsResponse.data.filter(log => 
          log.entity_id === projectId || 
          log.description.toLowerCase().includes(projectName.toLowerCase())
        );

        const mappedHistory: ProjectHistoryEntry[] = projectRelatedLogs.map(log => ({
          id: log.id,
          timestamp: new Date(log.timestamp),
          user: {
            id: log.user_id,
            name: log.user_name || 'Sistema'
          },
          action: log.action_type,
          entity: log.entity_type as any,
          description: log.description,
          details: log.details,
          icon: getActionIcon(log.entity_type, log.action_type),
          color: getActionColor(log.action_type)
        }));

        // Ordenar por timestamp (mais recente primeiro)
        mappedHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setHistory(mappedHistory);
      } else {
        setHistory([]);
      }
      
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico do projeto');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const exportHistory = async () => {
    try {
      const filters: AuditFilters = {
        startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        actionType: selectedActionType === 'all' ? undefined : selectedActionType,
        entityType: selectedEntityType === 'all' ? undefined : selectedEntityType
      };

      const response = await auditService.exportAuditLogs(filters);
      
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico-projeto-${projectName}-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Histórico exportado com sucesso');
      } else {
        toast.error('Erro ao exportar histórico');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar histórico');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 font-medium">Carregando histórico...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-0 rounded-2xl">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Histórico do Projeto
          </CardTitle>
          <Button
            onClick={exportHistory}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por descrição ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedActionType} onValueChange={setSelectedActionType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ações</SelectItem>
              <SelectItem value="CRIAR">Criar</SelectItem>
              <SelectItem value="EDITAR">Editar</SelectItem>
              <SelectItem value="EXCLUIR">Excluir</SelectItem>
              <SelectItem value="VISUALIZAR">Visualizar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Entidades</SelectItem>
              <SelectItem value="PROJETO">Projeto</SelectItem>
              <SelectItem value="PECA">Peça</SelectItem>
              <SelectItem value="OTIMIZACAO">Otimização</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último dia</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Timeline do Histórico */}
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhuma atividade encontrada</p>
              <p className="text-gray-400 text-sm">Ajuste os filtros para ver mais resultados</p>
            </div>
          ) : (
            filteredHistory.map((entry, index) => {
              const Icon = entry.icon;
              const isExpanded = expandedItems.has(entry.id);
              const hasDetails = entry.details && Object.keys(entry.details).length > 0;

              return (
                <div key={entry.id} className="relative">
                  {/* Linha conectora */}
                  {index < filteredHistory.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200" />
                  )}
                  
                  <div className="flex gap-4 p-4 rounded-lg border border-gray-100 bg-white hover:shadow-md transition-all duration-200">
                    {/* Ícone */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${entry.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 leading-tight">
                            {entry.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{entry.user.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(entry.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {entry.entity}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Botão de expansão */}
                        {hasDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(entry.id)}
                            className="flex-shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {/* Detalhes expandidos */}
                      {hasDetails && isExpanded && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Detalhes:</p>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};