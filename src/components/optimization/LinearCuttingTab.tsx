
import { ProjectSelector } from '@/components/ProjectSelector';
import { MaterialInput } from '@/components/MaterialInput';
import { OptimizationResults } from '@/components/OptimizationResults';
import type { Project, CutPiece, OptimizationResult } from '@/pages/Index';

interface LinearCuttingTabProps {
  project: Project | null;
  setProject: (project: Project | null) => void;
  barLength: number;
  setBarLength: (length: number) => void;
  pieces: CutPiece[];
  setPieces: (pieces: CutPiece[]) => void;
  results: OptimizationResult | null;
  onOptimize: () => void;
}

export const LinearCuttingTab = ({
  project,
  setProject,
  barLength,
  setBarLength,
  pieces,
  setPieces,
  results,
  onOptimize
}: LinearCuttingTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProjectSelector
            project={project}
            setProject={setProject}
            barLength={barLength}
            setBarLength={setBarLength}
          />
          
          <MaterialInput
            pieces={pieces}
            setPieces={setPieces}
            onOptimize={onOptimize}
            disabled={!project}
          />
        </div>
        
        <div className="lg:col-span-1">
          {results && (
            <OptimizationResults
              results={results}
              barLength={barLength}
              project={project}
            />
          )}
        </div>
      </div>
    </div>
  );
};
