
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
import { UserCheck, Plus, Edit, Trash2, Search } from "lucide-react";
import { operadorService } from "@/services";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Operador } from "@/services/interfaces";

export const OperadorManagement = () => {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOperador, setEditingOperador] = useState<Operador | null>(null);
  const [deletingOperador, setDeletingOperador] = useState<Operador | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    turno: "",
    especialidade: "",
  });

  const fetchOperadores = async () => {
    setLoading(true);
    const response = await operadorService.getAll();
    if (response.success) {
      setOperadores(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOperadores();
  }, []);

  const filteredOperadores = operadores.filter(operador =>
    operador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operador.turno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (editingOperador) {
      const response = await operadorService.update({
        id: editingOperador.id,
        data: formData
      });
      if (response.success) {
        setOperadores(prev => prev.map(op => op.id === editingOperador.id ? response.data! : op));
      }
    } else {
      const response = await operadorService.create({ data: formData });
      if (response.success) {
        setOperadores(prev => [response.data!, ...prev]);
      }
    }
    
    setLoading(false);
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (operador: Operador) => {
    setEditingOperador(operador);
    setFormData({
      nome: operador.nome,
      turno: operador.turno,
      especialidade: operador.especialidade || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingOperador) {
      setLoading(true);
      const response = await operadorService.delete({ id: deletingOperador.id });
      if (response.success) {
        setOperadores(prev => prev.filter(op => op.id !== deletingOperador.id));
      }
      setLoading(false);
      setDeletingOperador(null);
    }
  };

  const resetForm = () => {
    setEditingOperador(null);
    setFormData({
      nome: "",
      turno: "",
      especialidade: "",
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Gerenciamento de Operadores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar operadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Operador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingOperador ? "Editar Operador" : "Novo Operador"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Operador *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="turno">Turno *</Label>
                    <Select
                      value={formData.turno}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, turno: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Turno</SelectItem>
                        <SelectItem value="2">2º Turno</SelectItem>
                        <SelectItem value="3">3º Turno</SelectItem>
                        <SelectItem value="Central">Central</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input
                      id="especialidade"
                      value={formData.especialidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, especialidade: e.target.value }))}
                      placeholder="Ex: Corte de perfis estruturais"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : (editingOperador ? "Atualizar" : "Criar")}
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
                  <TableHead>Turno</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando operadores...
                    </TableCell>
                  </TableRow>
                ) : filteredOperadores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm ? "Nenhum operador encontrado" : "Nenhum operador cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperadores.map((operador) => (
                    <TableRow key={operador.id}>
                      <TableCell className="font-medium">{operador.nome}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {operador.turno === "Central" ? "Central" : `${operador.turno}º Turno`}
                        </span>
                      </TableCell>
                      <TableCell>{operador.especialidade || "-"}</TableCell>
                      <TableCell>
                        {new Date(operador.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(operador)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingOperador(operador)}
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
        open={!!deletingOperador}
        onOpenChange={(open) => !open && setDeletingOperador(null)}
        onConfirm={handleDelete}
        title="Excluir Operador"
        description={`Tem certeza que deseja excluir o operador "${deletingOperador?.nome}"? Esta ação não pode ser desfeita.`}
        loading={loading}
      />
    </div>
  );
};
