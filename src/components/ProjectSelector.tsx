
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/pages/Index';
import { ProjectWizard } from './ProjectWizard';
import { Building2, Settings } from 'lucide-react';

interface ProjectSelectorProps {
  project: Project | null;
  setProject: (project: Project | null) => void;
  barLength: number;
  setBarLength: (length: number) => void;
}

export const ProjectSelector = ({ project, setProject, barLength, setBarLength }: ProjectSelectorProps) => {
  if (project) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Projeto Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600">{project.projectNumber} | {project.lista} | {project.revisao}</p>
                <p className="text-sm text-gray-600">{project.client} - {project.obra}</p>
                <p className="text-sm text-gray-600">{project.tipoMaterial}</p>
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
    <ProjectWizard
      project={project}
      setProject={setProject}
      barLength={barLength}
      setBarLength={setBarLength}
    />
  );
};
