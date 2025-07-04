
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Factory } from "lucide-react";
import { ManagementTabs } from "./management/ManagementTabs";

interface CadastroManagerIntegratedProps {
  onUpdateData?: () => void;
}

export const CadastroManagerIntegrated = ({
  onUpdateData,
}: CadastroManagerIntegratedProps) => {
  const [showManagement, setShowManagement] = useState(false);

  if (showManagement) {
    return <ManagementTabs onBack={() => setShowManagement(false)} />;
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5" />
          Gerenciamento de Cadastros
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-center">
          <Button
            className="h-32 w-64 flex flex-col items-center gap-4 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setShowManagement(true)}
          >
            <Settings className="w-16 h-16" />
            <div className="text-center">
              <div className="text-xl font-semibold">Gerenciar Dados</div>
              <div className="text-sm opacity-90">
                Obras, Clientes, Materiais, Operadores e Inspetores QA
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
