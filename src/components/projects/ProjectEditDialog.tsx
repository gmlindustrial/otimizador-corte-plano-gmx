import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { linearProjectService } from '@/services/entities/LinearProjectService';
import type { Project } from '@/pages/Index';
import { toast } from 'sonner';

interface ProjectEditDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export const ProjectEditDialog = ({ project, open, onOpenChange, onUpdated }: ProjectEditDialogProps) => {
  const { clientes, obras } = useSupabaseData();

  const findClienteId = (name: string) => clientes.find(c => c.nome === name)?.id || '';
  const findObraId = (name: string) => obras.find(o => o.nome === name)?.id || '';

  const [formData, setFormData] = useState({
    name: project.name,
    projectNumber: project.projectNumber,
    clienteId: findClienteId(project.client),
    obraId: findObraId(project.obra)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await linearProjectService.updateLinearProject(project.id, {
        nome: formData.name,
        numero_projeto: formData.projectNumber,
        cliente_id: formData.clienteId || null,
        obra_id: formData.obraId || null
      });
      toast.success('Projeto atualizado');
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error('Erro ao atualizar projeto');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="number">Número do Projeto</Label>
            <Input
              id="number"
              value={formData.projectNumber}
              onChange={e => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="client">Cliente</Label>
            <select
              id="client"
              value={formData.clienteId}
              onChange={e => setFormData(prev => ({ ...prev, clienteId: e.target.value }))}
              className="w-full border rounded p-2"
            >
              <option value="">Selecione...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="obra">Obra</Label>
            <select
              id="obra"
              value={formData.obraId}
              onChange={e => setFormData(prev => ({ ...prev, obraId: e.target.value }))}
              className="w-full border rounded p-2"
            >
              <option value="">Selecione...</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

