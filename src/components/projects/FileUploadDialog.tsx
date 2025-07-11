import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
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
        // Mostrar estatísticas detalhadas
        const conjuntos = [...new Set(pieces.map((p: any) => p.conjunto).filter(Boolean))];
        const pages = [...new Set(pieces.map((p: any) => p.page).filter(Boolean))];
        const obra = (pieces[0] as any)?.obra || 'Não identificada';
        
        console.log(`📋 Arquivo processado com sucesso:
          - Obra: ${obra}
          - Peças: ${pieces.length}
          - Conjuntos: ${conjuntos.join(', ')}
          - Páginas: ${pages.join(', ')}`);
        
        onFileProcessed(pieces);
        toast.success(`${pieces.length} peças encontradas no arquivo AutoCAD`);
        setFile(null);
      } else {
        toast.warning('Nenhuma peça foi encontrada no arquivo');
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao processar arquivo: ${errorMessage}`);
      
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