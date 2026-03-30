import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

interface ProjectHeaderProps {
  projectName: string;
  projectNumber: string;
  clientName?: string;
  obraName?: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectHeader = ({
  projectName,
  projectNumber,
  clientName,
  obraName,
  onBack,
  onEdit,
  onDelete,
}: ProjectHeaderProps) => {
  return (
    <Card className="bg-card backdrop-blur-lg shadow-xl border rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-indigo-600 transition-all duration-300 w-fit backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {projectName}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  {projectNumber}
                </span>
                <span>•</span>
                <span>{clientName}</span>
                <span>•</span>
                <span>{obraName}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-indigo-600 transition-all duration-300 backdrop-blur-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-red-600 transition-all duration-300 backdrop-blur-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
