import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Project } from "@/pages/Index";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProjectCreationWizardProps {
  onProjectCreated: (project: Project) => void;
}

export const ProjectCreationWizard = ({
  onProjectCreated,
}: ProjectCreationWizardProps) => {
  const { clientes, obras } = useSupabaseData();
  const [formData, setFormData] = useState({
    name: "",
    projectNumber: "",
    clienteId: "",
    obraId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.projectNumber ||
      !formData.clienteId ||
      !formData.obraId
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projetos")
        .insert([{
          nome: formData.name,
          numero_projeto: formData.projectNumber,
          cliente_id: formData.clienteId,
          obra_id: formData.obraId,
        }])
        .select(`
          *,
          clientes(nome),
          obras(nome)
        `)
        .single();

      if (error) {
        console.error("Erro ao inserir projeto:", error.message);
        toast.error("Erro ao criar projeto");
        return;
      }

      console.log("Projeto inserido com sucesso:", data);
      onProjectCreated(data);
      toast.success("Projeto criado com sucesso!");
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro ao criar projeto");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Projeto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex: Estrutura Metalica Galpão A"
          />
        </div>

        <div>
          <Label htmlFor="projectNumber">Número do Projeto *</Label>
          <Input
            id="projectNumber"
            value={formData.projectNumber}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                projectNumber: e.target.value,
              }))
            }
            placeholder="Ex: P-2024-001"
          />
        </div>

        <div>
          <Label htmlFor="client">Cliente *</Label>
          <Select
            value={formData.clienteId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, clienteId: value }))
            }
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
            value={formData.obraId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, obraId: value }))
            }
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
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        Criar Projeto
      </Button>
    </form>
  );
};
