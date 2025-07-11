import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { OptimizationResults } from '@/components/OptimizationResults';
import type { OptimizationResult, Project } from '@/pages/Index';

interface OptimizationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: OptimizationResult | null;
  barLength: number;
  project: Project | null;
  optimizationId: string | null;
}

import { projetoOtimizacaoService } from '@/services/entities/ProjetoOtimizacaoService';

export const OptimizationResultsDialog = ({ open, onOpenChange, results, barLength, project, optimizationId }: OptimizationResultsDialogProps) => {
  if (!results) return null;
  const handleResultsChange = async (r: OptimizationResult) => {
    if (!optimizationId) return;
    await projetoOtimizacaoService.update({ id: optimizationId, data: { resultados: r } });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resultados da Otimização</DialogTitle>
          <DialogDescription>
            Visualize o plano de corte otimizado e as estatísticas detalhadas do projeto.
          </DialogDescription>
        </DialogHeader>
        <OptimizationResults results={results} barLength={barLength} project={project} pieces={[]} onResultsChange={handleResultsChange} />
      </DialogContent>
    </Dialog>
  );
};
