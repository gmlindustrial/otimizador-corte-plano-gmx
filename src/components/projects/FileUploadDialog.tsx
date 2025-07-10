import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { FileParsingService } from '@/components/file-upload/FileParsingService';
import { toast } from 'sonner';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileProcessed: (pieces: any[]) => void;
  onProcessStart: () => void;
}

export const FileUploadDialog = ({ open, onOpenChange, onFileProcessed, onProcessStart }: FileUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.toLowerCase().endsWith('.txt')) {
        setFile(selectedFile);
      } else {
        toast.error('Apenas arquivos .txt são suportados');
      }
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    onOpenChange(false);
    onProcessStart();
    try {
      const text = await file.text();
      const pieces = FileParsingService.parseAutoCADReport(text);
      
      if (pieces.length > 0) {
        onFileProcessed(pieces);
        toast.success(`${pieces.length} peças encontradas no arquivo`);
        setFile(null);
      } else {
        toast.warning('Nenhuma peça foi encontrada no arquivo');
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Arquivo AutoCAD</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              {file ? (
                <div className="flex flex-col items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-sm text-gray-600">{file.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Clique para selecionar arquivo .txt</p>
                </div>
              )}
              <input type="file" className="hidden" accept=".txt" onChange={handleFileSelect} />
            </label>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Formato esperado:</p>
                <p>Arquivo de texto exportado do AutoCAD com lista de peças</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleProcess}
              disabled={!file || processing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                'Processar Arquivo'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};