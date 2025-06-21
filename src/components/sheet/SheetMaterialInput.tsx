
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Square } from 'lucide-react';
import type { SheetCutPiece } from '@/types/sheet';
import { ValidationDisplay } from './components/ValidationDisplay';
import { ProjectStats } from './components/ProjectStats';
import { PieceInputForm } from './components/PieceInputForm';
import { PiecesList } from './components/PiecesList';
import { OptimizeButton } from './components/OptimizeButton';
import { SheetFileUpload } from './components/SheetFileUpload';
import { SheetDuplicateManager } from './components/SheetDuplicateManager';

interface SheetMaterialInputProps {
  pieces: SheetCutPiece[];
  setPieces: (pieces: SheetCutPiece[]) => void;
  onOptimize: () => void;
  disabled?: boolean;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  projectStats?: {
    totalPieces: number;
    totalArea: number;
    estimatedSheets: number;
    estimatedWeight: number;
    estimatedCost: number;
  } | null;
}

interface DuplicateItem {
  existing: SheetCutPiece;
  imported: SheetCutPiece;
  conflicts: string[];
}

export const SheetMaterialInput = ({ 
  pieces, 
  setPieces, 
  onOptimize, 
  disabled,
  validation,
  projectStats
}: SheetMaterialInputProps) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [tag, setTag] = useState('');
  const [allowRotation, setAllowRotation] = useState(true);
  const [showValidation, setShowValidation] = useState(false);
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  const [pendingDuplicates, setPendingDuplicates] = useState<DuplicateItem[]>([]);
  const [pendingImportedPieces, setPendingImportedPieces] = useState<SheetCutPiece[]>([]);

  useEffect(() => {
    setShowValidation(validation !== null);
  }, [validation]);

  const addPiece = () => {
    const pieceWidth = parseFloat(width);
    const pieceHeight = parseFloat(height);
    const pieceQuantity = parseInt(quantity);

    if (pieceWidth > 0 && pieceHeight > 0 && pieceQuantity > 0 && tag.trim()) {
      const newPiece: SheetCutPiece = {
        id: Date.now().toString(),
        width: pieceWidth,
        height: pieceHeight,
        quantity: pieceQuantity,
        tag: tag.trim().toUpperCase(),
        allowRotation,
        geometry: {
          type: 'rectangle',
          boundingBox: { width: pieceWidth, height: pieceHeight },
          area: pieceWidth * pieceHeight,
          perimeter: 2 * (pieceWidth + pieceHeight)
        }
      };
      setPieces([...pieces, newPiece]);
      setWidth('');
      setHeight('');
      setQuantity('1');
      setTag('');
      
      // Auto-incrementar tag se for numérica
      const match = tag.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2]) + 1;
        setTag(`${prefix}${number.toString().padStart(match[2].length, '0')}`);
      }
    }
  };

  const removePiece = (id: string) => {
    setPieces(pieces.filter(piece => piece.id !== id));
  };

  const updatePiece = (id: string, field: keyof SheetCutPiece, value: any) => {
    setPieces(pieces.map(piece => 
      piece.id === id ? { ...piece, [field]: value } : piece
    ));
  };

  const handleImportedData = (importedPieces: SheetCutPiece[], duplicates?: DuplicateItem[]) => {
    if (duplicates && duplicates.length > 0) {
      setPendingDuplicates(duplicates);
      setPendingImportedPieces(importedPieces);
      setShowDuplicateManager(true);
      return;
    }
    
    setPieces([...pieces, ...importedPieces]);
    console.log(`${importedPieces.length} peças importadas com sucesso!`);
  };

  const handleDuplicateResolution = (action: 'update' | 'ignore' | 'duplicate', resolvedPieces: SheetCutPiece[]) => {
    setPieces([...pieces, ...resolvedPieces]);
    setShowDuplicateManager(false);
    setPendingDuplicates([]);
    setPendingImportedPieces([]);
    console.log(`${resolvedPieces.length} peças processadas após resolução de duplicidade!`);
  };

  const handleCancelDuplicateManager = () => {
    setShowDuplicateManager(false);
    setPendingDuplicates([]);
    setPendingImportedPieces([]);
    console.log('Importação cancelada pelo usuário.');
  };

  if (showDuplicateManager) {
    return (
      <SheetDuplicateManager
        duplicates={pendingDuplicates}
        onResolved={handleDuplicateResolution}
        onCancel={handleCancelDuplicateManager}
      />
    );
  }

  const totalArea = pieces.reduce((sum, piece) => sum + (piece.width * piece.height * piece.quantity), 0);
  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && width && height && tag.trim()) {
      addPiece();
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Square className="w-5 h-5" />
          Lista de Peças - Corte de Chapas 2D
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <ValidationDisplay validation={validation} showValidation={showValidation} />
        
        <ProjectStats projectStats={projectStats} />

        <SheetFileUpload 
          onDataImported={handleImportedData}
          currentPieces={pieces}
        />

        <div className="border-t pt-6">
          <PieceInputForm
            width={width}
            height={height}
            quantity={quantity}
            tag={tag}
            allowRotation={allowRotation}
            setWidth={setWidth}
            setHeight={setHeight}
            setQuantity={setQuantity}
            setTag={setTag}
            setAllowRotation={setAllowRotation}
            onAddPiece={addPiece}
            onKeyPress={handleKeyPress}
          />
        </div>

        <PiecesList
          pieces={pieces}
          onUpdatePiece={updatePiece}
          onRemovePiece={removePiece}
          totalPieces={totalPieces}
          totalArea={totalArea}
        />

        <OptimizeButton
          onOptimize={onOptimize}
          disabled={disabled}
          piecesLength={pieces.length}
          validation={validation}
        />
      </CardContent>
    </Card>
  );
};
