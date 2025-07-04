
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, Package, UserCheck, Shield, Factory, ArrowLeft } from "lucide-react";
import { ObraManagement } from "./management/ObraManagement";
import { ClienteManagement } from "./management/ClienteManagement";
import { MaterialManagement } from "./management/MaterialManagement";
import { OperadorManagement } from "./management/OperadorManagement";
import { InspetorManagement } from "./management/InspetorManagement";

type ManagementTab = "obras" | "clientes" | "materiais" | "operadores" | "inspetores" | null;

interface CadastroManagerIntegratedProps {
  onUpdateData?: () => void;
}

export const CadastroManagerIntegrated = ({
  onUpdateData,
}: CadastroManagerIntegratedProps) => {
  const [activeTab, setActiveTab] = useState<ManagementTab>(null);

  if (activeTab === "obras") {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setActiveTab(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <ObraManagement />
      </div>
    );
  }

  if (activeTab === "clientes") {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setActiveTab(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <ClienteManagement />
      </div>
    );
  }

  if (activeTab === "materiais") {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setActiveTab(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <MaterialManagement />
      </div>
    );
  }

  if (activeTab === "operadores") {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setActiveTab(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <OperadorManagement />
      </div>
    );
  }

  if (activeTab === "inspetores") {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setActiveTab(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <InspetorManagement />
      </div>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5" />
          Gerenciamento de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Selecione o tipo de dados que deseja gerenciar
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Button
            onClick={() => setActiveTab("obras")}
            className="h-32 flex flex-col items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Building className="w-12 h-12" />
            <div className="text-center">
              <div className="text-lg font-semibold">Gerenciar Obras</div>
              <div className="text-sm opacity-90">Visualizar, criar, editar e excluir obras</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setActiveTab("clientes")}
            className="h-32 flex flex-col items-center gap-4 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Users className="w-12 h-12" />
            <div className="text-center">
              <div className="text-lg font-semibold">Gerenciar Clientes</div>
              <div className="text-sm opacity-90">Visualizar, criar, editar e excluir clientes</div>
            </div>
          </Button>

          <Button
            onClick={() => setActiveTab("materiais")}
            className="h-32 flex flex-col items-center gap-4 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Package className="w-12 h-12" />
            <div className="text-center">
              <div className="text-lg font-semibold">Gerenciar Materiais</div>
              <div className="text-sm opacity-90">Visualizar, criar, editar e excluir materiais</div>
            </div>
          </Button>

          <Button
            onClick={() => setActiveTab("operadores")}
            className="h-32 flex flex-col items-center gap-4 bg-green-600 hover:bg-green-700 text-white"
          >
            <UserCheck className="w-12 h-12" />
            <div className="text-center">
              <div className="text-lg font-semibold">Gerenciar Operadores</div>
              <div className="text-sm opacity-90">Visualizar, criar, editar e excluir operadores</div>
            </div>
          </Button>

          <Button
            onClick={() => setActiveTab("inspetores")}
            className="h-32 flex flex-col items-center gap-4 bg-red-600 hover:bg-red-700 text-white"
          >
            <Shield className="w-12 h-12" />
            <div className="text-center">
              <div className="text-lg font-semibold">Gerenciar Inspetores QA</div>
              <div className="text-sm opacity-90">Visualizar, criar, editar e excluir inspetores</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
