
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLinearProjects } from '@/hooks/useLinearProjects';
import { useSheetProjects } from '@/hooks/useSheetProjects';
import { Building2, Square, Play, Eye, Copy, Trash2, Search, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProjectsListProps {
  onLoadLinearProject: (projectData: any) => void;
  onLoadSheetProject: (projectData: any) => void;
}

export const ProjectsList = ({ onLoadLinearProject, onLoadSheetProject }: ProjectsListProps) => {
  const { savedProjects: linearProjects, loading: linearLoading } = useLinearProjects();
  const { savedProjects: sheetProjects, loading: sheetLoading } = useSheetProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'linear' | 'sheet'>('all');

  // Combinar e filtrar projetos
  const allProjects = [
    ...linearProjects.map(p => ({ ...p, type: 'linear' as const })),
    ...sheetProjects.map(p => ({ ...p, type: 'sheet' as const }))
  ];

  const filteredProjects = allProjects.filter(item => {
    const matchesSearch = 
      item.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.obra.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleLoadProject = (item: any) => {
    if (item.type === 'linear') {
      onLoadLinearProject(item);
      toast.success(`Projeto linear "${item.project.name}" carregado na aba Corte Linear`);
    } else {
      onLoadSheetProject(item);
      toast.success(`Projeto de chapas "${item.project.name}" carregado na aba Corte Chapas`);
    }
  };

  const loading = linearLoading || sheetLoading;

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Projetos Salvos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, número, cliente ou obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedType('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={selectedType === 'linear' ? 'default' : 'outline'}
                onClick={() => setSelectedType('linear')}
                size="sm"
                className="flex items-center gap-1"
              >
                <Building2 className="w-4 h-4" />
                Linear
              </Button>
              <Button
                variant={selectedType === 'sheet' ? 'default' : 'outline'}
                onClick={() => setSelectedType('sheet')}
                size="sm"
                className="flex items-center gap-1"
              >
                <Square className="w-4 h-4" />
                Chapas
              </Button>
            </div>
          </div>

          {/* Lista de Projetos */}
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando projetos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((item, index) => (
                <Card key={`${item.type}-${item.project.id}-${index}`} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.type === 'linear' ? (
                            <Building2 className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-purple-600" />
                          )}
                          <h3 className="font-semibold text-lg">{item.project.name}</h3>
                          <Badge variant={item.type === 'linear' ? 'default' : 'secondary'}>
                            {item.type === 'linear' ? 'Linear' : 'Chapas'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Número:</span> {item.project.projectNumber}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Lista:</span> {item.project.lista}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Cliente:</span> {item.project.client}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Obra:</span> {item.project.obra}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium">Operador:</span> {item.project.operador}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium">Data:</span> 
                            {format(new Date(item.project.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        </div>

                        {/* Informações específicas do tipo */}
                        <div className="text-sm text-gray-600">
                          {item.type === 'linear' ? (
                            <div className="flex items-center gap-4">
                              <span><strong>Peças:</strong> {item.pieces.length}</span>
                              <span><strong>Comprimento barra:</strong> {item.barLength}mm</span>
                              <span><strong>Material:</strong> {item.project.tipoMaterial}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span><strong>Peças:</strong> {item.pieces.length}</span>
                              <span><strong>Chapa:</strong> {item.project.sheetWidth}x{item.project.sheetHeight}mm</span>
                              <span><strong>Material:</strong> {item.project.material}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleLoadProject(item)}
                          className="flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Carregar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
