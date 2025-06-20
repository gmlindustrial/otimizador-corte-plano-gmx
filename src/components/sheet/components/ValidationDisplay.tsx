
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ValidationDisplayProps {
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  showValidation: boolean;
}

export const ValidationDisplay = ({ validation, showValidation }: ValidationDisplayProps) => {
  if (!showValidation || !validation) return null;

  return (
    <div className="space-y-2">
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erros encontrados:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Avisos:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {validation.valid && validation.errors.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Todas as peças são válidas para otimização.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
