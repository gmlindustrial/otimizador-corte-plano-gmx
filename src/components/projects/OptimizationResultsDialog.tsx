import { Dialog, DialogContent } from '@/components/ui/dialog';
import { OptimizationResults } from '@/components/OptimizationResults';
import type { OptimizationResult, Project } from '@/pages/Index';

interface OptimizationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: OptimizationResult | null;
  barLength: number;
  project: Project | null;
}

export const OptimizationResultsDialog = ({ open, onOpenChange, results, barLength, project }: OptimizationResultsDialogProps) => {
  if (!results) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-screen">
        <OptimizationResults results={results} barLength={barLength} project={project} pieces={[]} />
      </DialogContent>
    </Dialog>
  );
};
