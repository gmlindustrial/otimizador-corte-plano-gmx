
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
import { Building, Plus, Edit, Trash2, Search } from "lucide-react";
import { useObraService } from "@/hooks/services/useObraService";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Obra } from "@/services/interfaces";

export const ObraManagement = () => {
  const { obras, loading, fetchObras, createObra, updateObra, deleteObra } = useObraService();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [deletingObra, setDeletingObra] = useState<Obra | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    responsavel: "",
  });

  useEffect(() => {
    fetchObras();
  }, []);

  const filteredObras = obras.filter(obra =>
    obra.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingObra) {
      await updateObra(editingObra.id, formData);
    } else {
      await createObra(formData);
    }
    
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (obra: Obra) => {
    setEditingObra(obra);
    setFormData({
      nome: obra.nome,
      endereco: obra.endereco || "",
      responsavel: obra.responsavel || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingObra) {
      await deleteObra(deletingObra.id);
      setDeletingObra(null);
    }
  };

  const resetForm = () => {
    setEditingObra(null);
    setFormData({
      nome: "",
      endereco: "",
      responsavel: "",
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Gerenciamento de Obras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Header com busca e botão adicionar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar obras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Obra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingObra ? "Editar Obra" : "Nova Obra"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome da Obra *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Complexo Industrial ABC"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Endereço da obra"
                    />
                  </div>
                  <div>
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Input
                      id="responsavel"
                      value={formData.responsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : (editingObra ? "Atualizar" : "Criar")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando obras...
                    </TableCell>
                  </TableRow>
                ) : filteredObras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm ? "Nenhuma obra encontrada" : "Nenhuma obra cadastrada"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredObras.map((obra) => (
                    <TableRow key={obra.id}>
                      <TableCell className="font-medium">{obra.nome}</TableCell>
                      <TableCell>{obra.endereco || "-"}</TableCell>
                      <TableCell>{obra.responsavel || "-"}</TableCell>
                      <TableCell>
                        {new Date(obra.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(obra)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingObra(obra)}
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

      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={!!deletingObra}
        onOpenChange={(open) => !open && setDeletingObra(null)}
        onConfirm={handleDelete}
        title="Excluir Obra"
        description={`Tem certeza que deseja excluir a obra "${deletingObra?.nome}"? Esta ação não pode ser desfeita.`}
        loading={loading}
      />
    </div>
  );
};
