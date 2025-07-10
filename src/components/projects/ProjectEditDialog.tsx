import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseData } from '@/hooks/useSupabaseData';
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

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Projeto | null;
  onProjectUpdated: (project: Projeto) => void;
}

export const ProjectEditDialog = ({ 
  open, 
  onOpenChange, 
  project,
  onProjectUpdated 
}: ProjectEditDialogProps) => {
  const { clientes, obras } = useSupabaseData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: project?.nome || '',
    numero_projeto: project?.numero_projeto || '',
    cliente_id: project?.cliente_id || '',
    obra_id: project?.obra_id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;

    if (!formData.nome || !formData.numero_projeto || !formData.cliente_id || !formData.obra_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const response = await projetoService.update(project.id, {
        nome: formData.nome,
        numero_projeto: formData.numero_projeto,
        cliente_id: formData.cliente_id,
        obra_id: formData.obra_id
      });

      if (response.success) {
        toast.success('Projeto atualizado com sucesso!');
        
        // Buscar dados atualizados com relações
        const updatedResponse = await projetoService.getWithRelations(project.id);
        if (updatedResponse.success && updatedResponse.data) {
          onProjectUpdated(updatedResponse.data);
        }
        
        onOpenChange(false);
      } else {
        toast.error('Erro ao atualizar projeto');
      }
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error('Erro ao atualizar projeto');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar form quando projeto mudar
  if (project && (
    formData.nome !== project.nome ||
    formData.numero_projeto !== project.numero_projeto ||
    formData.cliente_id !== project.cliente_id ||
    formData.obra_id !== project.obra_id
  )) {
    setFormData({
      nome: project.nome,
      numero_projeto: project.numero_projeto,
      cliente_id: project.cliente_id,
      obra_id: project.obra_id
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Projeto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Estrutura Metalica Galpão A"
            />
          </div>

          <div>
            <Label htmlFor="numero_projeto">Número do Projeto *</Label>
            <Input
              id="numero_projeto"
              value={formData.numero_projeto}
              onChange={(e) => setFormData(prev => ({ ...prev, numero_projeto: e.target.value }))}
              placeholder="Ex: P-2024-001"
            />
          </div>

          <div>
            <Label htmlFor="cliente">Cliente *</Label>
            <Select
              value={formData.cliente_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="obra">Obra *</Label>
            <Select
              value={formData.obra_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, obra_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a obra" />
              </SelectTrigger>
              <SelectContent>
                {obras.map((obra) => (
                  <SelectItem key={obra.id} value={obra.id}>
                    {obra.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};