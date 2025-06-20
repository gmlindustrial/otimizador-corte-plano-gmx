
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetProject } from '@/types/sheet';
import { SheetProjectWizard } from './SheetProjectWizard';
import { Square, Settings } from 'lucide-react';

interface SheetProjectSelectorProps {
  project: SheetProject | null;
  setProject: (project: SheetProject | null) => void;
}

export const SheetProjectSelector = ({ project, setProject }: SheetProjectSelectorProps) => {
  if (project) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Square className="w-5 h-5" />
            Projeto Chapa Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600">{project.projectNumber} | {project.lista} | {project.revisao}</p>
                <p className="text-sm text-gray-600">{project.client} - {project.obra}</p>
                <p className="text-sm text-gray-600">
                  Chapa: {project.sheetWidth}x{project.sheetHeight}mm | 
                  Espessura: {project.thickness}mm | 
                  {project.material}
                </p>
                <p className="text-sm text-gray-600">
                  Processo: {project.process.toUpperCase()} | 
                  Kerf: {project.kerf}mm
                </p>
                <p className="text-sm text-gray-600">
                  Operador: {project.operador} | {project.turno === 'Central' ? 'Turno Central' : `${project.turno}º Turno`}
                </p>
              </div>
              <button
                onClick={() => setProject(null)}
                className="text-gray-500 hover:text-red-600 transition-colors"
                title="Alterar projeto"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <SheetProjectWizard
      project={project}
      setProject={setProject}
    />
  );
};
