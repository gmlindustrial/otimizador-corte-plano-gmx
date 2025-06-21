
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface FileProcessingStatusProps {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export const FileProcessingStatus = ({ uploading, progress, error }: FileProcessingStatusProps) => {
  if (!uploading && !error) return null;

  return (
    <div className="space-y-4">
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Processando arquivo...</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
