
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calculator } from 'lucide-react';

interface OptimizeButtonProps {
  onOptimize: () => void;
  disabled?: boolean;
  piecesLength: number;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
}

export const OptimizeButton = ({ onOptimize, disabled, piecesLength, validation }: OptimizeButtonProps) => {
  const isDisabled = disabled || piecesLength === 0 || (validation && !validation.valid);

  return (
    <div className="space-y-4">
      <div className="flex justify-center pt-4">
        <Button
          onClick={onOptimize}
          disabled={isDisabled}
          className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
          size="lg"
        >
          <Calculator className="w-5 h-5 mr-2" />
          {disabled ? 'Otimizando...' : 'Otimizar Corte'}
        </Button>
      </div>

      {disabled && (
        <div className="space-y-2">
          <Progress value={33} className="w-full h-2" />
          <p className="text-sm text-gray-600 text-center">Executando algoritmos de otimização...</p>
        </div>
      )}
    </div>
  );
};
