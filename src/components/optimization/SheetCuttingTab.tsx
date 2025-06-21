
import { SheetProjectSelector } from '@/components/sheet/SheetProjectSelector';
import { SheetMaterialInput } from '@/components/sheet/SheetMaterialInput';
import { SheetOptimizationResults } from '@/components/sheet/SheetOptimizationResults';
import { SheetVisualization } from '@/components/sheet/SheetVisualization';
import type { SheetCutPiece, SheetProject, SheetOptimizationResult } from '@/types/sheet';

interface SheetCuttingTabProps {
  sheetProject: SheetProject | null;
  setSheetProject: (project: SheetProject | null) => void;
  sheetPieces: SheetCutPiece[];
  setSheetPieces: (pieces: SheetCutPiece[]) => void;
  sheetResults: SheetOptimizationResult | null;
  onOptimize: () => void;
}

export const SheetCuttingTab = ({
  sheetProject,
  setSheetProject,
  sheetPieces,
  setSheetPieces,
  sheetResults,
  onOptimize
}: SheetCuttingTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SheetProjectSelector
            project={sheetProject}
            setProject={setSheetProject}
          />
          
          <SheetMaterialInput
            pieces={sheetPieces}
            setPieces={setSheetPieces}
            onOptimize={onOptimize}
            disabled={!sheetProject}
          />
        </div>
        
        <div className="lg:col-span-1">
          {sheetResults && (
            <SheetOptimizationResults
              results={sheetResults}
              project={sheetProject}
            />
          )}
        </div>
      </div>

      {sheetResults && (
        <SheetVisualization
          results={sheetResults}
          project={sheetProject}
        />
      )}
    </div>
  );
};
