
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
import { Users, Plus, Edit, Trash2, Search } from "lucide-react";
import { useClienteService } from "@/hooks/services/useClienteService";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Cliente } from "@/services/interfaces";

export const ClienteManagement = () => {
  const { clientes, loading, fetchClientes, createCliente, updateCliente, deleteCliente } = useClienteService();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    contato: "",
    email: "",
    telefone: "",
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCliente) {
      await updateCliente(editingCliente.id, formData);
    } else {
      await createCliente(formData);
    }
    
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      contato: cliente.contato || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingCliente) {
      await deleteCliente(deletingCliente.id);
      setDeletingCliente(null);
    }
  };

  const resetForm = () => {
    setEditingCliente(null);
    setFormData({
      nome: "",
      contato: "",
      email: "",
      telefone: "",
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciamento de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Header com busca e botão adicionar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCliente ? "Editar Cliente" : "Novo Cliente"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Cliente *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Construtora Alpha Ltda"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contato">Pessoa de Contato</Label>
                    <Input
                      id="contato"
                      value={formData.contato}
                      onChange={(e) => setFormData(prev => ({ ...prev, contato: e.target.value }))}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : (editingCliente ? "Atualizar" : "Criar")}
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
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.contato || "-"}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell>{cliente.telefone || "-"}</TableCell>
                      <TableCell>
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCliente(cliente)}
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
        open={!!deletingCliente}
        onOpenChange={(open) => !open && setDeletingCliente(null)}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente "${deletingCliente?.nome}"? Esta ação não pode ser desfeita.`}
        loading={loading}
      />
    </div>
  );
};
