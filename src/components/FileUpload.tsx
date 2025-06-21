
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { CutPiece } from '@/pages/Index';
import { FileUploadArea } from './file-upload/FileUploadArea';
import { FileProcessingStatus } from './file-upload/FileProcessingStatus';
import { FileParsingService } from './file-upload/FileParsingService';

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

  const checkForDuplicates = (newPieces: CutPiece[]): DuplicateItem[] => {
    const duplicateItems: DuplicateItem[] = [];
    
    newPieces.forEach(newPiece => {
      const existing = currentPieces.find(piece => piece.length === newPiece.length);
      if (existing) {
        duplicateItems.push({
          existing,
          imported: newPiece,
          conflicts: ['Comprimento + Material + TAG + Projeto']
        });
      }
    });
    
    return duplicateItems;
  };

  const handleFileSelect = async (file: File) => {
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
          pieces = FileParsingService.parseCSV(csvContent);
          break;
        
        case 'xlsx':
        case 'xls':
          pieces = await FileParsingService.parseExcel(file);
          break;
        
        case 'txt':
          const txtContent = await file.text();
          pieces = FileParsingService.parseTXT(txtContent);
          break;
        
        case 'pdf':
          pieces = await FileParsingService.parsePDF(file);
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
        onDataImported(pieces, duplicateItems);
      } else {
        onDataImported(pieces);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importar Lista de Peças
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUploadArea onFileSelect={handleFileSelect} uploading={uploading} />
        <FileProcessingStatus uploading={uploading} progress={progress} error={error} />
      </CardContent>
    </Card>
  );
};
