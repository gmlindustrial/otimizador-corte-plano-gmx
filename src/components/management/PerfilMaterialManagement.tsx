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
import { Package, Plus, Edit, Trash2, Search } from "lucide-react";
import { usePerfilService } from "@/hooks/services/usePerfilService";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { PerfilMaterial } from "@/types/project";

export const PerfilMaterialManagement = () => {
  const { perfis, loading, fetchPerfis, createPerfil, updatePerfil, deletePerfil } = usePerfilService();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPerfil, setEditingPerfil] = useState<PerfilMaterial | null>(null);
  const [deletingPerfil, setDeletingPerfil] = useState<PerfilMaterial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo_perfil: "",
    descricao_perfil: "",
    kg_por_metro: 0,
  });

  useEffect(() => {
    fetchPerfis();
  }, []);

  const filteredPerfis = perfis.filter(perfil =>
    perfil.tipo_perfil.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfil.descricao_perfil.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPerfil) {
      await updatePerfil(editingPerfil.id, formData);
    } else {
      await createPerfil(formData);
    }
    
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (perfil: PerfilMaterial) => {
    setEditingPerfil(perfil);
    setFormData({
      tipo_perfil: perfil.tipo_perfil,
      descricao_perfil: perfil.descricao_perfil,
      kg_por_metro: Number(perfil.kg_por_metro),
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingPerfil) {
      await deletePerfil(deletingPerfil.id);
      setDeletingPerfil(null);
    }
  };

  const resetForm = () => {
    setEditingPerfil(null);
    setFormData({
      tipo_perfil: "",
      descricao_perfil: "",
      kg_por_metro: 0,
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Gerenciamento de Perfis de Materiais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar perfis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Perfil
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPerfil ? "Editar Perfil" : "Novo Perfil"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="tipo_perfil">Tipo do Perfil *</Label>
                    <Input
                      id="tipo_perfil"
                      value={formData.tipo_perfil}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_perfil: e.target.value }))}
                      placeholder="Ex: W, L, U, I"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao_perfil">Descrição do Perfil *</Label>
                    <Input
                      id="descricao_perfil"
                      value={formData.descricao_perfil}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao_perfil: e.target.value }))}
                      placeholder="Ex: W 150x13, L 50x5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="kg_por_metro">Peso por Metro (kg/m) *</Label>
                    <Input
                      id="kg_por_metro"
                      type="number"
                      step="0.01"
                      value={formData.kg_por_metro}
                      onChange={(e) => setFormData(prev => ({ ...prev, kg_por_metro: Number(e.target.value) }))}
                      placeholder="13.0"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : (editingPerfil ? "Atualizar" : "Criar")}
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Peso por Metro (kg/m)</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando perfis...
                    </TableCell>
                  </TableRow>
                ) : filteredPerfis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm ? "Nenhum perfil encontrado" : "Nenhum perfil cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPerfis.map((perfil) => (
                    <TableRow key={perfil.id}>
                      <TableCell className="font-medium">{perfil.tipo_perfil}</TableCell>
                      <TableCell>{perfil.descricao_perfil}</TableCell>
                      <TableCell>{Number(perfil.kg_por_metro).toFixed(2)} kg/m</TableCell>
                      <TableCell>
                        {new Date(perfil.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(perfil)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingPerfil(perfil)}
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
        open={!!deletingPerfil}
        onOpenChange={(open) => !open && setDeletingPerfil(null)}
        onConfirm={handleDelete}
        title="Excluir Perfil"
        description={`Tem certeza que deseja excluir o perfil "${deletingPerfil?.descricao_perfil}"? Esta ação não pode ser desfeita.`}
        loading={loading}
      />
    </div>
  );
};