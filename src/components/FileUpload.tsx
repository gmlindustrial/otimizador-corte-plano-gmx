
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { CutPiece } from '@/pages/Index';

interface FileUploadProps {
  onDataImported: (pieces: CutPiece[], duplicates?: any[]) => void;
  currentPieces: CutPiece[];
}

interface DuplicateItem {
  existing: CutPiece;
  imported: CutPiece;
  conflicts: string[];
}

export const FileUpload = ({ onDataImported, currentPieces }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [importedData, setImportedData] = useState<CutPiece[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): CutPiece[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const pieces: CutPiece[] = [];
    
    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('comprimento') || lines[0].toLowerCase().includes('length') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
      if (cols.length >= 2) {
        const length = parseFloat(cols[0]);
        const quantity = parseInt(cols[1]) || 1;
        
        if (!isNaN(length) && length > 0) {
          pieces.push({
            id: `import-${Date.now()}-${i}`,
            length,
            quantity
          });
        }
      }
    }
    return pieces;
  };

  const parseExcel = async (file: File): Promise<CutPiece[]> => {
    // Simulação de parsing Excel - em produção usaria biblioteca como xlsx
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Implementação simplificada - assumindo formato CSV-like
        const content = e.target?.result as string;
        resolve(parseCSV(content));
      };
      reader.readAsText(file);
    });
  };

  const parseTXT = (content: string): CutPiece[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const pieces: CutPiece[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Formato: "comprimento quantidade" ou "comprimento,quantidade" ou "comprimento;quantidade"
      const match = line.match(/(\d+(?:\.\d+)?)[,;\s]+(\d+)/);
      if (match) {
        const length = parseFloat(match[1]);
        const quantity = parseInt(match[2]);
        
        if (!isNaN(length) && !isNaN(quantity) && length > 0 && quantity > 0) {
          pieces.push({
            id: `import-${Date.now()}-${i}`,
            length,
            quantity
          });
        }
      }
    }
    return pieces;
  };

  const parsePDF = async (file: File): Promise<CutPiece[]> => {
    // Simulação de extração de PDF - em produção usaria biblioteca como pdf-parse
    return new Promise((resolve) => {
      setTimeout(() => {
        // Dados simulados extraídos do PDF
        const mockData: CutPiece[] = [
          { id: `pdf-${Date.now()}-1`, length: 2500, quantity: 5 },
          { id: `pdf-${Date.now()}-2`, length: 1800, quantity: 3 },
          { id: `pdf-${Date.now()}-3`, length: 3200, quantity: 2 }
        ];
        resolve(mockData);
      }, 1500);
    });
  };

  const checkForDuplicates = (newPieces: CutPiece[]): DuplicateItem[] => {
    const duplicateItems: DuplicateItem[] = [];
    
    newPieces.forEach(newPiece => {
      const existing = currentPieces.find(piece => piece.length === newPiece.length);
      if (existing) {
        duplicateItems.push({
          existing,
          imported: newPiece,
          conflicts: ['Comprimento igual detectado']
        });
      }
    });
    
    return duplicateItems;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      let pieces: CutPiece[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 20, 80));
      }, 200);

      switch (fileExtension) {
        case 'csv':
          const csvContent = await file.text();
          pieces = parseCSV(csvContent);
          break;
        
        case 'xlsx':
        case 'xls':
          pieces = await parseExcel(file);
          break;
        
        case 'txt':
          const txtContent = await file.text();
          pieces = parseTXT(txtContent);
          break;
        
        case 'pdf':
          pieces = await parsePDF(file);
          break;
        
        default:
          throw new Error('Formato de arquivo não suportado');
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (pieces.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      // Verificar duplicatas
      const duplicateItems = checkForDuplicates(pieces);
      
      if (duplicateItems.length > 0) {
        setDuplicates(duplicateItems);
        setImportedData(pieces);
        setShowDuplicateDialog(true);
      } else {
        onDataImported(pieces);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDuplicateResolution = (action: 'update' | 'ignore' | 'duplicate') => {
    let finalPieces = [...importedData];
    
    switch (action) {
      case 'ignore':
        // Remove duplicatas dos dados importados
        finalPieces = importedData.filter(piece => 
          !duplicates.some(dup => dup.imported.length === piece.length)
        );
        break;
      
      case 'update':
        // Mantém os dados importados (irá sobrescrever)
        break;
      
      case 'duplicate':
        // Mantém ambos (adiciona sufixo aos IDs)
        finalPieces = importedData.map(piece => ({
          ...piece,
          id: `${piece.id}-dup`
        }));
        break;
    }

    onDataImported(finalPieces, duplicates);
    setShowDuplicateDialog(false);
    setDuplicates([]);
    setImportedData([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Lista de Peças
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-gray-100 p-3 rounded-full">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arraste arquivos ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Formatos aceitos: CSV, XLSX, TXT, PDF
                </p>
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Selecionar Arquivo
              </Button>
            </div>
          </div>

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
        </CardContent>
      </Card>

      {/* Dialog de Duplicatas */}
      {showDuplicateDialog && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Duplicatas Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-orange-700">
              Foram encontradas {duplicates.length} peça(s) com especificações similares:
            </p>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {duplicates.map((dup, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="text-sm">
                    Comprimento: {dup.imported.length}mm (Qtd: {dup.imported.quantity})
                  </span>
                  <span className="text-xs text-gray-500">
                    Existe: {dup.existing.quantity} un.
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleDuplicateResolution('ignore')}
                className="flex-1"
              >
                Ignorar Duplicatas
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDuplicateResolution('duplicate')}
                className="flex-1"
              >
                Manter Ambas
              </Button>
              <Button
                onClick={() => handleDuplicateResolution('update')}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Atualizar Existentes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
