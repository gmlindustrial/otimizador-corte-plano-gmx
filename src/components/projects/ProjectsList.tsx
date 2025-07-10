import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Building, 
  User,
  FolderOpen
} from 'lucide-react';
import { projetoService } from '@/services/entities/ProjetoService';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Projeto {
  id: string;
  nome: string;
  numero_projeto: string;
  cliente_id: string;
  obra_id: string;
  created_at: string;
  clientes?: { nome: string };
  obras?: { nome: string };
  _count?: {
    projeto_pecas: number;
    projeto_otimizacoes: number;
  };
}

interface ProjectsListProps {
  onProjectSelect: (project: Projeto) => void;
  onProjectEdit: (project: Projeto) => void;
  onProjectDelete: (project: Projeto) => void;
  onCreateNew: () => void;
}

export const ProjectsList = ({ 
  onProjectSelect, 
  onProjectEdit, 
  onProjectDelete,
  onCreateNew 
}: ProjectsListProps) => {
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projetoService.getAllWithCounts();
      if (response.success && response.data) {
        setProjects(response.data as any);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.numero_projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.obras?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="text-center">Carregando projetos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Projetos ({filteredProjects.length})
            </div>
            <Button
              onClick={onCreateNew}
              variant="outline"
              size="sm"
              className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600"
            >
              Novo Projeto
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, número, cliente ou obra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateNew} className="mt-4">
                Criar Primeiro Projeto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id}
              className="bg-white/90 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{project.nome}</h3>
                    <Badge variant="outline" className="text-xs">
                      {project.numero_projeto}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{project.clientes?.nome || 'Cliente não definido'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>{project.obras?.nome || 'Obra não definida'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(project.created_at), 'dd/MM/yyyy')}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {project._count?.projeto_pecas || 0} peças
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {project._count?.projeto_otimizacoes || 0} otimizações
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onProjectSelect(project)}
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    onClick={() => onProjectEdit(project)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onProjectDelete(project)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};