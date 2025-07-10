import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { projetoService } from '@/services/entities/ProjetoService';
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
}

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Projeto | null;
  onProjectDeleted: () => void;
}

export const ProjectDeleteDialog = ({ 
  open, 
  onOpenChange, 
  project,
  onProjectDeleted 
}: ProjectDeleteDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const response = await projetoService.delete({ id: project.id });
      
      if (response.success) {
        toast.success('Projeto excluído com sucesso!');
        onProjectDeleted();
        onOpenChange(false);
      } else {
        toast.error('Erro ao excluir projeto');
      }
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast.error('Erro ao excluir projeto');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Excluir Projeto</DialogTitle>
              <DialogDescription className="mt-1">
                Esta ação não pode ser desfeita. Todas as peças e otimizações associadas serão removidas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Projeto a ser excluído:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Nome:</strong> {project.nome}</div>
              <div><strong>Número:</strong> {project.numero_projeto}</div>
              <div><strong>Cliente:</strong> {project.clientes?.nome || 'Não definido'}</div>
              <div><strong>Obra:</strong> {project.obras?.nome || 'Não definida'}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir Projeto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};