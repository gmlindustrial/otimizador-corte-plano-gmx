import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, Info } from 'lucide-react';
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
  const [parseFormat, setParseFormat] = useState<'auto' | 'tabular' | 'dotted'>('auto');

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
      const forceFormat = parseFormat === 'auto' ? undefined : parseFormat as 'tabular' | 'dotted';
      const pieces = FileParsingService.parseAutoCADReport(text, forceFormat);
      
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
      
      // Sugerir tentar outro formato se foi automático
      if (parseFormat === 'auto') {
        toast.info('Tente selecionar manualmente o formato do arquivo (Tabular ou Pontilhado)');
      }
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

          {file && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-medium">Formato do Arquivo:</Label>
                <RadioGroup 
                  value={parseFormat} 
                  onValueChange={(value) => setParseFormat(value as 'auto' | 'tabular' | 'dotted')}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto">Detecção Automática (Recomendado)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tabular" id="tabular" />
                    <Label htmlFor="tabular">Formato Tabular (Colunas organizadas)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dotted" id="dotted" />
                    <Label htmlFor="dotted">Formato Pontilhado (Separado por linhas)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Formatos Suportados:</p>
                <p><strong>Tabular:</strong> C34 COLUNA, linhas como "106 1 W150X13 A572-50 419 x 100 5.4"</p>
                <p><strong>Pontilhado:</strong> V.172, V.173 com separadores "-------"</p>
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