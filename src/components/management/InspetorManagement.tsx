
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Plus, Edit, Trash2, Search } from "lucide-react";
import { inspetorService } from "@/services";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { InspetorQA } from "@/services/interfaces";

export const InspetorManagement = () => {
  const [inspetores, setInspetores] = useState<InspetorQA[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingInspetor, setEditingInspetor] = useState<InspetorQA | null>(null);
  const [deletingInspetor, setDeletingInspetor] = useState<InspetorQA | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    certificacao: "",
    area: "",
  });

  const fetchInspetores = async () => {
    setLoading(true);
    const response = await inspetorService.getAll();
    if (response.success) {
      setInspetores(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInspetores();
  }, []);

  const filteredInspetores = inspetores.filter(inspetor =>
    inspetor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inspetor.area && inspetor.area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (editingInspetor) {
      const response = await inspetorService.update({
        id: editingInspetor.id,
        data: formData
      });
      if (response.success) {
        setInspetores(prev => prev.map(ins => ins.id === editingInspetor.id ? response.data! : ins));
      }
    } else {
      const response = await inspetorService.create({ data: formData });
      if (response.success) {
        setInspetores(prev => [response.data!, ...prev]);
      }
    }
    
    setLoading(false);
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (inspetor: InspetorQA) => {
    setEditingInspetor(inspetor);
    setFormData({
      nome: inspetor.nome,
      certificacao: inspetor.certificacao || "",
      area: inspetor.area || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingInspetor) {
      setLoading(true);
      const response = await inspetorService.delete({ id: deletingInspetor.id });
      if (response.success) {
        setInspetores(prev => prev.filter(ins => ins.id !== deletingInspetor.id));
      }
      setLoading(false);
      setDeletingInspetor(null);
    }
  };

  const resetForm = () => {
    setEditingInspetor(null);
    setFormData({
      nome: "",
      certificacao: "",
      area: "",
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gerenciamento de Inspetores QA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar inspetores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Inspetor QA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingInspetor ? "Editar Inspetor QA" : "Novo Inspetor QA"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Inspetor *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Carlos Inspetor"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="certificacao">Certificação</Label>
                    <Input
                      id="certificacao"
                      value={formData.certificacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, certificacao: e.target.value }))}
                      placeholder="Ex: ISO 9001, NBR 14931"
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">Área de Atuação</Label>
                    <Input
                      id="area"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                      placeholder="Ex: Estruturas Metálicas"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : (editingInspetor ? "Atualizar" : "Criar")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Certificação</TableHead>
                  <TableHead>Área de Atuação</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando inspetores...
                    </TableCell>
                  </TableRow>
                ) : filteredInspetores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm ? "Nenhum inspetor encontrado" : "Nenhum inspetor cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInspetores.map((inspetor) => (
                    <TableRow key={inspetor.id}>
                      <TableCell className="font-medium">{inspetor.nome}</TableCell>
                      <TableCell>{inspetor.certificacao || "-"}</TableCell>
                      <TableCell>{inspetor.area || "-"}</TableCell>
                      <TableCell>
                        {new Date(inspetor.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(inspetor)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingInspetor(inspetor)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!deletingInspetor}
        onOpenChange={(open) => !open && setDeletingInspetor(null)}
        onConfirm={handleDelete}
        title="Excluir Inspetor QA"
        description={`Tem certeza que deseja excluir o inspetor "${deletingInspetor?.nome}"? Esta ação não pode ser desfeita.`}
        loading={loading}
      />
    </div>
  );
};
