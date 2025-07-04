
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Edit, Trash2, Search } from "lucide-react";
import { useMaterialService } from "@/hooks/services/useMaterialService";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Material } from "@/services/interfaces";

export const MaterialManagement = () => {
  const { materiais, loading, fetchMateriais, createMaterial, updateMaterial, deleteMaterial } = useMaterialService();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "",
    descricao: "",
    comprimento_padrao: 6000,
    tipo_corte: "barra" as "barra" | "chapa",
  });

  useEffect(() => {
    fetchMateriais();
  }, []);

  const filteredMateriais = materiais.filter(material =>
    material.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.descricao && material.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMaterial) {
      await updateMaterial(editingMaterial.id, formData);
    } else {
      await createMaterial(formData);
    }
    
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      tipo: material.tipo,
      descricao: material.descricao || "",
      comprimento_padrao: material.comprimento_padrao,
      tipo_corte: material.tipo_corte as "barra" | "chapa",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingMaterial) {
      await deleteMaterial(deletingMaterial.id);
      setDeletingMaterial(null);
    }
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      tipo: "",
      descricao: "",
      comprimento_padrao: 6000,
      tipo_corte: "barra",
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
            Gerenciamento de Materiais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar materiais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? "Editar Material" : "Novo Material"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Material *</Label>
                    <Input
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                      placeholder="Ex: Perfil W 150x13"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição detalhada"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo_corte">Tipo de Corte</Label>
                    <Select
                      value={formData.tipo_corte}
                      onValueChange={(value: "barra" | "chapa") => 
                        setFormData(prev => ({ ...prev, tipo_corte: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="barra">Barra</SelectItem>
                        <SelectItem value="chapa">Chapa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="comprimento_padrao">
                      {formData.tipo_corte === "barra" ? "Comprimento Padrão (mm)" : "Dimensão Padrão (mm)"}
                    </Label>
                    <Input
                      id="comprimento_padrao"
                      type="number"
                      value={formData.comprimento_padrao}
                      onChange={(e) => setFormData(prev => ({ ...prev, comprimento_padrao: Number(e.target.value) }))}
                      placeholder="6000"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : (editingMaterial ? "Atualizar" : "Criar")}
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
                  <TableHead>Tipo de Corte</TableHead>
                  <TableHead>Comprimento Padrão (mm)</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando materiais...
                    </TableCell>
                  </TableRow>
                ) : filteredMateriais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm ? "Nenhum material encontrado" : "Nenhum material cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMateriais.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.tipo}</TableCell>
                      <TableCell>{material.descricao || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          material.tipo_corte === 'barra' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {material.tipo_corte.charAt(0).toUpperCase() + material.tipo_corte.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{material.comprimento_padrao}</TableCell>
                      <TableCell>
                        {new Date(material.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(material)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingMaterial(material)}
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
        open={!!deletingMaterial}
        onOpenChange={(open) => !open && setDeletingMaterial(null)}
        onConfirm={handleDelete}
        title="Excluir Material"
        description={`Tem certeza que deseja excluir o material "${deletingMaterial?.tipo}"? Esta ação não pode ser desfeita.`}
        loading={loading}
      />
    </div>
  );
};
