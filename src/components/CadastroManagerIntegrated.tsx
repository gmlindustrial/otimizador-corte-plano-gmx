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
  Loader2,
} from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface CadastroManagerIntegratedProps {
  onUpdateData?: () => void;
}

export const CadastroManagerIntegrated = ({
  onUpdateData,
}: CadastroManagerIntegratedProps) => {
  const {
    saveObra,
    saveCliente,
    saveMaterial,
    saveOperador,
    saveInspetor,
    refetch,
  } = useSupabaseData();

  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  const [novoMaterialBarra, setNovoMaterialBarra] = useState({
    tipo: "",
    descricao: "",
    comprimentoPadrao: 6000,
    perfil: "",
    bitola: "",
  });
  const [novoMaterialChapa, setNovoMaterialChapa] = useState({
    tipo: "",
    descricao: "",
    largura: 1000,
    altura: 2000,
    espessura: 6,
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

  const handleSaveMaterialBarra = async () => {
    if (!novoMaterialBarra.tipo) return;

    try {
      setSaving(true);
      console.log("Criando novo material barra...");
      
      const materialData = {
        tipo: `[BARRA] ${novoMaterialBarra.tipo}`,
        descricao: `${novoMaterialBarra.descricao} - Perfil: ${novoMaterialBarra.perfil} - Bitola: ${novoMaterialBarra.bitola}`,
        comprimentoPadrao: novoMaterialBarra.comprimentoPadrao,
      };
      
      await saveMaterial(materialData);
      setNovoMaterialBarra({ tipo: "", descricao: "", comprimentoPadrao: 6000, perfil: "", bitola: "" });
      setOpenDialog(null);

      // Force data refresh
      console.log("Forçando atualização dos dados...");
      setTimeout(() => {
        refetch();
        onUpdateData?.();
      }, 500);
    } catch (error) {
      console.error("Erro ao criar material barra:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMaterialChapa = async () => {
    if (!novoMaterialChapa.tipo) return;

    try {
      setSaving(true);
      console.log("Criando novo material chapa...");
      
      const materialData = {
        tipo: `[CHAPA] ${novoMaterialChapa.tipo}`,
        descricao: `${novoMaterialChapa.descricao} - Dimensões: ${novoMaterialChapa.largura}x${novoMaterialChapa.altura}mm - Espessura: ${novoMaterialChapa.espessura}mm`,
        comprimentoPadrao: Math.max(novoMaterialChapa.largura, novoMaterialChapa.altura), // Usar a maior dimensão como referência
      };
      
      await saveMaterial(materialData);
      setNovoMaterialChapa({ tipo: "", descricao: "", largura: 1000, altura: 2000, espessura: 6 });
      setOpenDialog(null);

      // Force data refresh
      console.log("Forçando atualização dos dados...");
      setTimeout(() => {
        refetch();
        onUpdateData?.();
      }, 500);
    } catch (error) {
      console.error("Erro ao criar material chapa:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveObra = async () => {
    if (!novaObra.nome || novaObra.nome.trim() === "") {
      console.log("Nome da obra está vazio");
      return;
    }

    try {
      setSaving(true);

      const result = await saveObra(novaObra);

      // Limpar formulário e fechar dialog
      setNovaObra({ nome: "", endereco: "", responsavel: "" });
      setOpenDialog(null);

      console.log("Formulário limpo e dialog fechado");

      // Force data refresh
      console.log("Forçando atualização dos dados...");
      setTimeout(() => {
        refetch();
        onUpdateData?.();
      }, 500);
    } catch (error) {
      console.error("Erro capturado no handleSaveObra:", error);
    } finally {
      setSaving(false);
      console.log("Estado saving definido como false");
    }
  };

  const handleSaveCliente = async () => {
    if (!novoCliente.nome) return;

    try {
      setSaving(true);
      console.log("Criando novo cliente...");
      await saveCliente(novoCliente);
      setNovoCliente({ nome: "", contato: "", email: "", telefone: "" });
      setOpenDialog(null);

      // Force data refresh
      console.log("Forçando atualização dos dados...");
      setTimeout(() => {
        refetch();
        onUpdateData?.();
      }, 500);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOperador = async () => {
    if (!novoOperador.nome) return;

    try {
      setSaving(true);
      console.log("Criando novo operador...");
      await saveOperador(novoOperador);
      setNovoOperador({ nome: "", turno: "1", especialidade: "" });
      setOpenDialog(null);

      // Force data refresh
      console.log("Forçando atualização dos dados...");
      setTimeout(() => {
        refetch();
        onUpdateData?.();
      }, 500);
    } catch (error) {
      console.error("Erro ao criar operador:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInspetor = async () => {
    if (!novoInspetor.nome) return;

    try {
      setSaving(true);
      console.log("Criando novo inspetor...");
      await saveInspetor(novoInspetor);
      setNovoInspetor({ nome: "", certificacao: "", area: "" });
      setOpenDialog(null);

      // Force data refresh
      console.log("Forçando atualização dos dados...");
      setTimeout(() => {
        refetch();
        onUpdateData?.();
      }, 500);
    } catch (error) {
      console.error("Erro ao criar inspetor:", error);
    } finally {
      setSaving(false);
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
              <Button
                className="h-24 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => console.log("Botão Criar Nova Obra clicado")}
              >
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
                    onChange={(e) => {
                      console.log("Nome da obra alterado:", e.target.value);
                      setNovaObra((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }));
                    }}
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
                  onClick={() => {
                    handleSaveObra();
                  }}
                  className="w-full"
                  disabled={!novaObra.nome || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                  disabled={!novoCliente.nome || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Criar Material para Barras */}
          <Dialog
            open={openDialog === "material-barra"}
            onOpenChange={(open) => setOpenDialog(open ? "material-barra" : null)}
          >
            <DialogTrigger asChild>
              <Button className="h-24 flex flex-col items-center gap-2 bg-orange-600 hover:bg-orange-700">
                <div className="w-8 h-8 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-6 h-1 bg-white rounded"></div>
                </div>
                <span className="text-sm font-medium">
                  + Material Barras
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Material para Barras</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="material-barra-tipo">Tipo de Material *</Label>
                  <Input
                    id="material-barra-tipo"
                    value={novoMaterialBarra.tipo}
                    onChange={(e) =>
                      setNovoMaterialBarra((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                    placeholder="Ex: Perfil W 150x13, Vergalhão CA-50"
                  />
                </div>
                <div>
                  <Label htmlFor="material-barra-perfil">Perfil/Formato</Label>
                  <Input
                    id="material-barra-perfil"
                    value={novoMaterialBarra.perfil}
                    onChange={(e) =>
                      setNovoMaterialBarra((prev) => ({
                        ...prev,
                        perfil: e.target.value,
                      }))
                    }
                    placeholder="Ex: W, I, U, L, Redondo, Quadrado"
                  />
                </div>
                <div>
                  <Label htmlFor="material-barra-bitola">Bitola/Dimensão</Label>
                  <Input
                    id="material-barra-bitola"
                    value={novoMaterialBarra.bitola}
                    onChange={(e) =>
                      setNovoMaterialBarra((prev) => ({
                        ...prev,
                        bitola: e.target.value,
                      }))
                    }
                    placeholder="Ex: 150x13, Ø12mm, 50x50x6"
                  />
                </div>
                <div>
                  <Label htmlFor="material-barra-descricao">Descrição</Label>
                  <Input
                    id="material-barra-descricao"
                    value={novoMaterialBarra.descricao}
                    onChange={(e) =>
                      setNovoMaterialBarra((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder="Descrição detalhada do material"
                  />
                </div>
                <div>
                  <Label htmlFor="material-barra-comprimento">
                    Comprimento Padrão (mm)
                  </Label>
                  <Input
                    id="material-barra-comprimento"
                    type="number"
                    value={novoMaterialBarra.comprimentoPadrao}
                    onChange={(e) =>
                      setNovoMaterialBarra((prev) => ({
                        ...prev,
                        comprimentoPadrao: Number(e.target.value),
                      }))
                    }
                    placeholder="6000"
                  />
                </div>
                <Button
                  onClick={handleSaveMaterialBarra}
                  className="w-full"
                  disabled={!novoMaterialBarra.tipo || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Material Barra
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Criar Material para Chapas */}
          <Dialog
            open={openDialog === "material-chapa"}
            onOpenChange={(open) => setOpenDialog(open ? "material-chapa" : null)}
          >
            <DialogTrigger asChild>
              <Button className="h-24 flex flex-col items-center gap-2 bg-teal-600 hover:bg-teal-700">
                <div className="w-8 h-8 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded-sm"></div>
                </div>
                <span className="text-sm font-medium">
                  + Material Chapas
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Material para Chapas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="material-chapa-tipo">Tipo de Material *</Label>
                  <Input
                    id="material-chapa-tipo"
                    value={novoMaterialChapa.tipo}
                    onChange={(e) =>
                      setNovoMaterialChapa((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                    placeholder="Ex: Chapa Aço A36, Chapa Inox 304"
                  />
                </div>
                <div>
                  <Label htmlFor="material-chapa-descricao">Descrição</Label>
                  <Input
                    id="material-chapa-descricao"
                    value={novoMaterialChapa.descricao}
                    onChange={(e) =>
                      setNovoMaterialChapa((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder="Descrição detalhada do material"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="material-chapa-largura">Largura (mm)</Label>
                    <Input
                      id="material-chapa-largura"
                      type="number"
                      value={novoMaterialChapa.largura}
                      onChange={(e) =>
                        setNovoMaterialChapa((prev) => ({
                          ...prev,
                          largura: Number(e.target.value),
                        }))
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="material-chapa-altura">Altura (mm)</Label>
                    <Input
                      id="material-chapa-altura"
                      type="number"
                      value={novoMaterialChapa.altura}
                      onChange={(e) =>
                        setNovoMaterialChapa((prev) => ({
                          ...prev,
                          altura: Number(e.target.value),
                        }))
                      }
                      placeholder="2000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="material-chapa-espessura">Espessura (mm)</Label>
                  <Input
                    id="material-chapa-espessura"
                    type="number"
                    value={novoMaterialChapa.espessura}
                    onChange={(e) =>
                      setNovoMaterialChapa((prev) => ({
                        ...prev,
                        espessura: Number(e.target.value),
                      }))
                    }
                    placeholder="6"
                  />
                </div>
                <Button
                  onClick={handleSaveMaterialChapa}
                  className="w-full"
                  disabled={!novoMaterialChapa.tipo || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Material Chapa
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
                  disabled={!novoOperador.nome || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                  disabled={!novoInspetor.nome || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
