
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, ArrowLeft, Package, UserCheck, Shield } from "lucide-react";
import { ObraManagement } from "./ObraManagement";
import { ClienteManagement } from "./ClienteManagement";
import { MaterialManagement } from "./MaterialManagement";
import { OperadorManagement } from "./OperadorManagement";
import { InspetorManagement } from "./InspetorManagement";

type ManagementTab = "obras" | "clientes" | "materiais" | "operadores" | "inspetores" | null;

interface ManagementTabsProps {
  onBack?: () => void;
}

export const ManagementTabs = ({ onBack }: ManagementTabsProps) => {
  const [activeTab, setActiveTab] = useState<ManagementTab>(null);

  if (activeTab === "obras") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveTab(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          )}
        </div>
        <ObraManagement />
      </div>
    );
  }

  if (activeTab === "clientes") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveTab(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          )}
        </div>
        <ClienteManagement />
      </div>
    );
  }

  if (activeTab === "materiais") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveTab(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          )}
        </div>
        <MaterialManagement />
      </div>
    );
  }

  if (activeTab === "operadores") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveTab(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          )}
        </div>
        <OperadorManagement />
      </div>
    );
  }

  if (activeTab === "inspetores") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveTab(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          )}
        </div>
        <InspetorManagement />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <div className="flex items-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às Configurações
          </Button>
        </div>
      )}
      
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Gerenciamento de Dados
            </h2>
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
    </div>
  );
};
