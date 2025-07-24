import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Calendar,
  Filter,
  Download,
  Clock,
  User,
  FileText,
  Scissors,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useProjectHistory } from '@/hooks/useProjectHistory';
import { type ProjectHistoryEntry } from '@/services/entities/ProjectHistoryService';

interface ProjectHistoryTabProps {
  projectId: string;
  projectName: string;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'PECA_CORTADA':
      return <Scissors className="w-4 h-4" />;
    case 'PECA_DELETADA':
      return <Trash2 className="w-4 h-4" />;
    case 'OTIMIZACAO_CRIADA':
      return <Plus className="w-4 h-4" />;
    case 'OTIMIZACAO_DELETADA':
      return <Trash2 className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getActionColor = (actionType: string): string => {
  switch (actionType) {
    case 'PECA_CORTADA': return 'text-blue-600 bg-blue-50';
    case 'PECA_DELETADA': return 'text-red-600 bg-red-50';
    case 'OTIMIZACAO_CRIADA': return 'text-green-600 bg-green-50';
    case 'OTIMIZACAO_DELETADA': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const formatActionType = (actionType: string): string => {
  switch (actionType) {
    case 'PECA_CORTADA': return 'Peça Cortada';
    case 'PECA_DELETADA': return 'Peça Deletada';
    case 'OTIMIZACAO_CRIADA': return 'Otimização Criada';
    case 'OTIMIZACAO_DELETADA': return 'Otimização Deletada';
    default: return actionType;
  }
};

const ProjectHistoryTab: React.FC<ProjectHistoryTabProps> = ({ projectId, projectName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const { 
    history, 
    loading, 
    filters, 
    exportHistory, 
    updateFilters 
  } = useProjectHistory(projectId);

  // Filter history based on search term
  const filteredHistory = history.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Date range helpers
  const getDateRangeStart = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default: return '';
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    
    if (key === 'dateRange') {
      if (value) {
        newFilters.start_date = getDateRangeStart(value);
        newFilters.end_date = new Date().toISOString();
      } else {
        delete newFilters.start_date;
        delete newFilters.end_date;
      }
    } else if (key === 'actionType') {
      if (value) {
        newFilters.action_type = value;
      } else {
        delete newFilters.action_type;
      }
    } else if (key === 'entityType') {
      if (value) {
        newFilters.entity_type = value;
      } else {
        delete newFilters.entity_type;
      }
    }
    
    updateFilters(newFilters);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Carregando histórico...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
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
      
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por descrição, usuário ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={filters.action_type || ''} onValueChange={(value) => handleFilterChange('actionType', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as ações</SelectItem>
                <SelectItem value="PECA_CORTADA">Peça Cortada</SelectItem>
                <SelectItem value="PECA_DELETADA">Peça Deletada</SelectItem>
                <SelectItem value="OTIMIZACAO_CRIADA">Otimização Criada</SelectItem>
                <SelectItem value="OTIMIZACAO_DELETADA">Otimização Deletada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.entity_type || ''} onValueChange={(value) => handleFilterChange('entityType', value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Todas entidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas entidades</SelectItem>
                <SelectItem value="PECA">Peças</SelectItem>
                <SelectItem value="OTIMIZACAO">Otimizações</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('dateRange', value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* History Timeline */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Nenhuma atividade encontrada</p>
                <p className="text-gray-400 text-sm">Ajuste os filtros para ver mais resultados</p>
              </div>
            ) : (
              filteredHistory.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {/* Timeline connector */}
                  {index < filteredHistory.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200"></div>
                  )}
                  
                  <div className="flex gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className={`p-2 rounded-full ${getActionColor(entry.action_type)}`}>
                      {getActionIcon(entry.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user_name}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatActionType(entry.action_type)}
                        </Badge>
                      </div>
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(entry.id)}
                        className="p-1"
                      >
                        {expandedItems.has(entry.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {expandedItems.has(entry.id) && entry.details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Detalhes:</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {Object.entries(entry.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export { ProjectHistoryTab };
export default ProjectHistoryTab;