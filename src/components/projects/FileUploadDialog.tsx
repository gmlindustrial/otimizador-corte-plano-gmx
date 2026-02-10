import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileParsingService, SheetInventorPiece } from '@/components/file-upload/FileParsingService';
import { XlsxTemplateService } from '@/services/XlsxTemplateService';
import { toast } from 'sonner';

type ImportType = 'tekla' | 'excel' | 'inventor';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileProcessed: (pieces: any[]) => void;
  onSheetPiecesProcessed?: (sheetPieces: SheetInventorPiece[]) => void;
  onProcessStart: () => void;
}

export const FileUploadDialog = ({ open, onOpenChange, onFileProcessed, onSheetPiecesProcessed, onProcessStart }: FileUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [importType, setImportType] = useState<ImportType>('tekla');

  // Definir extensões aceitas por tipo
  const acceptedExtensions: Record<ImportType, string> = {
    tekla: '.txt',
    excel: '.xlsx,.xls',
    inventor: '.txt,.xlsx,.xls'
  };

  // Labels descritivos para cada tipo
  const typeLabels: Record<ImportType, { title: string; description: string }> = {
    tekla: {
      title: 'TXT Tekla',
      description: 'Formato MARCA;ITEM;QT;DESCRIÇÃO...'
    },
    excel: {
      title: 'Excel (.xlsx)',
      description: 'Use o modelo padrão para importação'
    },
    inventor: {
      title: 'Inventor (TXT ou Excel)',
      description: 'Tabela do Autodesk Inventor em TXT ou XLSX'
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const name = selectedFile.name.toLowerCase();
      const accepted = acceptedExtensions[importType].split(',');
      const isValid = accepted.some(ext => name.endsWith(ext));

      if (isValid) {
        setFile(selectedFile);
      } else {
        toast.error(`Para ${typeLabels[importType].title}, apenas arquivos ${acceptedExtensions[importType]} são suportados`);
      }
    }
  };

  const handleTypeChange = (value: ImportType) => {
    setImportType(value);
    setFile(null); // Limpa arquivo ao trocar tipo
  };

  const handleDownloadTemplate = async () => {
    try {
      await XlsxTemplateService.downloadTemplate();
      toast.success('Modelo baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar o modelo');
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    // IMPORTANTE: NÃO fechar o dialog imediatamente - isso causa race condition
    // que pode resultar em tela branca em alguns navegadores/computadores
    onProcessStart();

    try {
      let pieces: any[];
      let sheetPieces: SheetInventorPiece[] = [];

      if (importType === 'excel') {
        pieces = await FileParsingService.parseExcel(file);
      } else if (importType === 'tekla') {
        const text = await file.text();
        pieces = FileParsingService.parseAutoCADReport(text);
      } else if (importType === 'inventor') {
        const fileName = file.name.toLowerCase();
        let result;

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          // Parse Excel
          result = await FileParsingService.parseInventorExcel(file);
        } else {
          // Parse TXT
          const text = await file.text();
          result = FileParsingService.parseInventorReportFull(text);
        }

        pieces = result.linearPieces;
        sheetPieces = result.sheetPieces;

        // Log detalhado do resultado
        console.log(`📊 Resultado do parse Inventor:`);
        console.log(`   - Peças lineares: ${result.stats.linear}`);
        console.log(`   - Chapas: ${result.stats.sheet}`);
        console.log(`   - Ignorados: ${result.stats.ignored}`);
      } else {
        throw new Error('Tipo de importação não reconhecido');
      }

      const hasLinearPieces = pieces.length > 0;
      const hasSheetPieces = sheetPieces.length > 0;

      if (hasLinearPieces || hasSheetPieces) {
        // Processar peças lineares
        if (hasLinearPieces) {
          const tags = [...new Set(pieces.map((p: any) => p.tag).filter(Boolean))];
          const posicoes = [...new Set(pieces.map((p: any) => p.posicao).filter(Boolean))];
          const totalQuantidade = pieces.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0);

          console.log(`📋 Peças lineares processadas (${typeLabels[importType].title}):
            - Peças únicas: ${pieces.length}
            - Quantidade total: ${totalQuantidade}
            - Tags: ${tags.slice(0, 5).join(', ')}${tags.length > 5 ? '...' : ''}
            - Posições: ${posicoes.slice(0, 5).join(', ')}${posicoes.length > 5 ? '...' : ''}`);

          onFileProcessed(pieces);
        }

        // Processar chapas (se houver callback e chapas)
        if (hasSheetPieces && onSheetPiecesProcessed) {
          const totalSheetQtd = sheetPieces.reduce((sum, p) => sum + p.quantity, 0);
          console.log(`📋 Chapas processadas: ${sheetPieces.length} tipos, ${totalSheetQtd} total`);
          onSheetPiecesProcessed(sheetPieces);
        }

        // Mensagem de sucesso combinada
        const linearMsg = hasLinearPieces ? `${pieces.length} peças lineares` : '';
        const sheetMsg = hasSheetPieces ? `${sheetPieces.length} chapas` : '';
        const combinedMsg = [linearMsg, sheetMsg].filter(Boolean).join(' e ');
        toast.success(`${combinedMsg} encontradas no arquivo`);
        setFile(null);

        // Fechar o dialog APÓS o processamento completar (com pequeno delay para garantir
        // que os callbacks de estado tenham sido executados)
        setTimeout(() => {
          onOpenChange(false);
        }, 100);
      } else {
        toast.warning('Nenhuma peça foi encontrada no arquivo');
        // Em caso de nenhuma peça, fechar também
        setTimeout(() => {
          onOpenChange(false);
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao processar arquivo: ${errorMessage}`);
      // Em caso de erro, NÃO fechar - permite o usuário tentar novamente
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Peças</DialogTitle>
          <DialogDescription>
            Selecione o tipo de arquivo e faça upload para importar peças do projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de tipo de importação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Arquivo:</Label>
            <RadioGroup
              value={importType}
              onValueChange={(value) => handleTypeChange(value as ImportType)}
              className="space-y-2"
            >
              {(Object.keys(typeLabels) as ImportType[]).map((type) => (
                <div key={type} className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50">
                  <RadioGroupItem value={type} id={type} className="mt-0.5" />
                  <Label htmlFor={type} className="cursor-pointer flex-1">
                    <div className="font-medium text-sm">{typeLabels[type].title}</div>
                    <div className="text-xs text-gray-500">{typeLabels[type].description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Botão para baixar template Excel */}
          {importType === 'excel' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar modelo Excel
            </Button>
          )}

          {/* Área de upload */}
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
                  <p className="text-sm text-gray-600 text-center px-4">
                    Clique para selecionar arquivo {acceptedExtensions[importType]}
                  </p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept={acceptedExtensions[importType]}
                onChange={handleFileSelect}
                key={importType} // Reset input quando mudar tipo
              />
            </label>
          </div>

          {/* Botões de ação */}
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
