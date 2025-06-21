
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

interface OptimizeSectionProps {
  onOptimize: () => void;
  disabled: boolean;
  hasNoPieces: boolean;
}

export const OptimizeSection = ({ onOptimize, disabled, hasNoPieces }: OptimizeSectionProps) => {
  return (
    <div className="flex justify-center pt-4">
      <Button
        onClick={onOptimize}
        disabled={disabled || hasNoPieces}
        className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
        size="lg"
      >
        <Calculator className="w-5 h-5 mr-2" />
        Otimizar Corte
      </Button>
    </div>
  );
};
