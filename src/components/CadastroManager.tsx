import { useState } from "react";
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
  Plus,
  Building,
  Users,
  Package,
  UserCheck,
  Factory,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { obraService } from "@/services/entities/ObraService";
import { clienteService } from "@/services/entities/ClienteService";
import { materialService } from "@/services/entities/MaterialService";
import { operadorService } from "@/services/entities/OperadorService";
import { inspetorService } from "@/services/entities/InspetorService";

interface CadastroManagerProps {
  onUpdateData?: () => void;
}

export const CadastroManager = ({ onUpdateData }: CadastroManagerProps) => {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  // Estados para os formulários
  const [novaObra, setNovaObra] = useState({
    nome: "",
    endereco: "",
    responsavel: "",
  });
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    contato: "",
    email: "",
    telefone: "",
  });
  const [novoMaterial, setNovoMaterial] = useState({
    tipo: "",
    descricao: "",
    comprimento_padrao: 6000,
  });
  const [novoOperador, setNovoOperador] = useState({
    nome: "",
    turno: "1",
    especialidade: "",
  });
  const [novoInspetor, setNovoInspetor] = useState({
    nome: "",
    certificacao: "",
    area: "",
  });

  const handleSaveObra = async () => {
    try {
      await obraService.criarObra(novaObra);

      toast({
        title: "Obra criada com sucesso!",
        description: `${novaObra.nome} foi adicionada ao sistema.`,
      });

      setNovaObra({ nome: "", endereco: "", responsavel: "" });
      setOpenDialog(null);
      onUpdateData?.();
    } catch (error) {
      toast({
        title: "Erro ao criar obra",
        description: "Ocorreu um erro ao tentar salvar a obra.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const handleSaveCliente = async () => {
    try {
      await clienteService.criarCliente(novoCliente);

      toast({
        title: "Cliente criado com sucesso!",
        description: `${novoCliente.nome} foi adicionado ao sistema.`,
      });

      setNovoCliente({ nome: "", contato: "", email: "", telefone: "" });
      setOpenDialog(null);
      onUpdateData?.(); // avisa o componente pai para atualizar a lista
    } catch (error) {
      toast({
        title: "Erro ao criar cliente",
        description: "Não foi possível salvar o cliente no sistema.",
        variant: "destructive",
      });
      console.error("Erro ao criar cliente:", error);
    }
  };

  const handleSaveMaterial = async () => {
    try {
      await materialService.criarMaterial(novoMaterial);

      toast({
        title: "Material criado com sucesso!",
        description: `${novoMaterial.tipo} foi adicionado ao sistema.`,
      });

      setNovoMaterial({ tipo: "", descricao: "", comprimento_padrao: 6000 });
      setOpenDialog(null);
      onUpdateData?.();
    } catch (error) {
      toast({
        title: "Erro ao criar material",
        description: "Não foi possível salvar o material no sistema.",
        variant: "destructive",
      });
      console.error("Erro ao criar material:", error);
    }
  };

  const handleSaveOperador = async () => {
    try {
      await operadorService.criarOperador(novoOperador);

      toast({
        title: "Operador criado com sucesso!",
        description: `${novoOperador.nome} foi adicionado ao sistema.`,
      });

      setNovoOperador({ nome: "", turno: "1", especialidade: "" });
      setOpenDialog(null);
      onUpdateData?.();
    } catch (error) {
      toast({
        title: "Erro ao criar operador",
        description: "Não foi possível salvar o operador no sistema.",
        variant: "destructive",
      });
      console.error("Erro ao criar operador:", error);
    }
  };

  const handleSaveInspetor = async () => {
    try {
      await inspetorService.criarInspetor(novoInspetor);

      toast({
        title: "Inspetor QA criado com sucesso!",
        description: `${novoInspetor.nome} foi adicionado ao sistema.`,
      });

      setNovoInspetor({ nome: "", certificacao: "", area: "" });
      setOpenDialog(null);
      onUpdateData?.();
    } catch (error) {
      toast({
        title: "Erro ao criar inspetor",
        description: "Não foi possível salvar o inspetor no sistema.",
        variant: "destructive",
      });
      console.error("Erro ao criar inspetor:", error);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5" />
          Gerenciamento de Cadastros
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Criar Nova Obra */}
          <Dialog
            open={openDialog === "obra"}
            onOpenChange={(open) => setOpenDialog(open ? "obra" : null)}
          >
            <DialogTrigger asChild>
              <Button className="h-24 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Building className="w-8 h-8" />
                <span className="text-sm font-medium">+ Criar Nova Obra</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Obra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="obra-nome">Nome da Obra *</Label>
                  <Input
                    id="obra-nome"
                    value={novaObra.nome}
                    onChange={(e) =>
                      setNovaObra((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    placeholder="Ex: Complexo Industrial ABC"
                  />
                </div>
                <div>
                  <Label htmlFor="obra-endereco">Endereço</Label>
                  <Input
                    id="obra-endereco"
                    value={novaObra.endereco}
                    onChange={(e) =>
                      setNovaObra((prev) => ({
                        ...prev,
                        endereco: e.target.value,
                      }))
                    }
                    placeholder="Endereço da obra"
                  />
                </div>
                <div>
                  <Label htmlFor="obra-responsavel">Responsável</Label>
                  <Input
                    id="obra-responsavel"
                    value={novaObra.responsavel}
                    onChange={(e) =>
                      setNovaObra((prev) => ({
                        ...prev,
                        responsavel: e.target.value,
                      }))
                    }
                    placeholder="Nome do responsável"
                  />
                </div>
                <Button
                  onClick={handleSaveObra}
                  className="w-full"
                  disabled={!novaObra.nome}
                >
                  Salvar Obra
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Criar Novo Cliente */}
          <Dialog
            open={openDialog === "cliente"}
            onOpenChange={(open) => setOpenDialog(open ? "cliente" : null)}
          >
            <DialogTrigger asChild>
              <Button className="h-24 flex flex-col items-center gap-2 bg-purple-600 hover:bg-purple-700">
                <Users className="w-8 h-8" />
                <span className="text-sm font-medium">
                  + Criar Novo Cliente
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cliente-nome">Nome do Cliente *</Label>
                  <Input
                    id="cliente-nome"
                    value={novoCliente.nome}
                    onChange={(e) =>
                      setNovoCliente((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                    placeholder="Ex: Construtora Alpha Ltda"
                  />
                </div>
                <div>
                  <Label htmlFor="cliente-contato">Pessoa de Contato</Label>
                  <Input
                    id="cliente-contato"
                    value={novoCliente.contato}
                    onChange={(e) =>
                      setNovoCliente((prev) => ({
                        ...prev,
                        contato: e.target.value,
                      }))
                    }
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <Label htmlFor="cliente-email">Email</Label>
                  <Input
                    id="cliente-email"
                    type="email"
                    value={novoCliente.email}
                    onChange={(e) =>
                      setNovoCliente((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="cliente-telefone">Telefone</Label>
                  <Input
                    id="cliente-telefone"
                    value={novoCliente.telefone}
                    onChange={(e) =>
                      setNovoCliente((prev) => ({
                        ...prev,
                        telefone: e.target.value,
                      }))
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <Button
                  onClick={handleSaveCliente}
                  className="w-full"
                  disabled={!novoCliente.nome}
                >
                  Salvar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Criar Novo Material */}
          <Dialog
            open={openDialog === "material"}
            onOpenChange={(open) => setOpenDialog(open ? "material" : null)}
          >
            <DialogTrigger asChild>
              <Button className="h-24 flex flex-col items-center gap-2 bg-orange-600 hover:bg-orange-700">
                <Package className="w-8 h-8" />
                <span className="text-sm font-medium">
                  + Criar Novo Material
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="material-tipo">Tipo de Material *</Label>
                  <Input
                    id="material-tipo"
                    value={novoMaterial.tipo}
                    onChange={(e) =>
                      setNovoMaterial((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                    placeholder="Ex: Perfil W 150x13"
                  />
                </div>
                <div>
                  <Label htmlFor="material-descricao">Descrição</Label>
                  <Input
                    id="material-descricao"
                    value={novoMaterial.descricao}
                    onChange={(e) =>
                      setNovoMaterial((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder="Descrição detalhada do material"
                  />
                </div>
                <div>
                  <Label htmlFor="material-comprimento">
                    Comprimento Padrão (mm)
                  </Label>
                  <Input
                    id="material-comprimento"
                    type="number"
                    value={novoMaterial.comprimeto_padrao}
                    onChange={(e) =>
                      setNovoMaterial((prev) => ({
                        ...prev,
                        comprimeto_padrao: Number(e.target.value),
                      }))
                    }
                    placeholder="6000"
                  />
                </div>
                <Button
                  onClick={handleSaveMaterial}
                  className="w-full"
                  disabled={!novoMaterial.tipo}
                >
                  Salvar Material
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Criar Novo Operador */}
          <Dialog
            open={openDialog === "operador"}
            onOpenChange={(open) => setOpenDialog(open ? "operador" : null)}
          >
            <DialogTrigger asChild>
              <Button className="h-24 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700">
                <UserCheck className="w-8 h-8" />
                <span className="text-sm font-medium">
                  + Criar Novo Operador
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Operador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="operador-nome">Nome do Operador *</Label>
                  <Input
                    id="operador-nome"
                    value={novoOperador.nome}
                    onChange={(e) =>
                      setNovoOperador((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="operador-turno">Turno</Label>
                  <select
                    id="operador-turno"
                    value={novoOperador.turno}
                    onChange={(e) =>
                      setNovoOperador((prev) => ({
                        ...prev,
                        turno: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="1">1º Turno</option>
                    <option value="2">2º Turno</option>
                    <option value="3">3º Turno</option>
                    <option value="Central">Central</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="operador-especialidade">Especialidade</Label>
                  <Input
                    id="operador-especialidade"
                    value={novoOperador.especialidade}
                    onChange={(e) =>
                      setNovoOperador((prev) => ({
                        ...prev,
                        especialidade: e.target.value,
                      }))
                    }
                    placeholder="Ex: Corte de perfis estruturais"
                  />
                </div>
                <Button
                  onClick={handleSaveOperador}
                  className="w-full"
                  disabled={!novoOperador.nome}
                >
                  Salvar Operador
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Criar Novo Inspetor QA */}
          <Dialog
            open={openDialog === "inspetor"}
            onOpenChange={(open) => setOpenDialog(open ? "inspetor" : null)}
          >
            <DialogTrigger asChild>
              <Button className="h-24 flex flex-col items-center gap-2 bg-red-600 hover:bg-red-700">
                <UserCheck className="w-8 h-8" />
                <span className="text-sm font-medium">+ Criar Inspetor QA</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Inspetor QA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inspetor-nome">Nome do Inspetor *</Label>
                  <Input
                    id="inspetor-nome"
                    value={novoInspetor.nome}
                    onChange={(e) =>
                      setNovoInspetor((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                    placeholder="Ex: Carlos Inspetor"
                  />
                </div>
                <div>
                  <Label htmlFor="inspetor-certificacao">Certificação</Label>
                  <Input
                    id="inspetor-certificacao"
                    value={novoInspetor.certificacao}
                    onChange={(e) =>
                      setNovoInspetor((prev) => ({
                        ...prev,
                        certificacao: e.target.value,
                      }))
                    }
                    placeholder="Ex: ISO 9001, NBR 14931"
                  />
                </div>
                <div>
                  <Label htmlFor="inspetor-area">Área de Atuação</Label>
                  <Input
                    id="inspetor-area"
                    value={novoInspetor.area}
                    onChange={(e) =>
                      setNovoInspetor((prev) => ({
                        ...prev,
                        area: e.target.value,
                      }))
                    }
                    placeholder="Ex: Estruturas Metálicas"
                  />
                </div>
                <Button
                  onClick={handleSaveInspetor}
                  className="w-full"
                  disabled={!novoInspetor.nome}
                >
                  Salvar Inspetor QA
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
