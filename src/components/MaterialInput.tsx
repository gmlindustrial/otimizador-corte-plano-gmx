
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { DuplicateManager } from './DuplicateManager';
import { ManualEntryForm } from './material-input/ManualEntryForm';
import { PieceList } from './material-input/PieceList';
import { OptimizeSection } from './material-input/OptimizeSection';
import { BarSizeSelector } from './material-input/BarSizeSelector';
import type { CutPiece, Project } from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';

interface MaterialInputProps {
  pieces: CutPiece[];
  setPieces: (pieces: CutPiece[]) => void;
  onOptimize: (barSize?: number) => void;
  disabled?: boolean;
  project?: Project | null;
}

interface DuplicateItem {
  existing: CutPiece;
  imported: CutPiece;
  conflicts: string[];
  material?: string;
  tag?: string;
  project?: string;
}

export const MaterialInput = ({ pieces, setPieces, onOptimize, disabled, project }: MaterialInputProps) => {
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  const [pendingDuplicates, setPendingDuplicates] = useState<DuplicateItem[]>([]);
  const [pendingImportedPieces, setPendingImportedPieces] = useState<CutPiece[]>([]);
  const [availableBarSizes, setAvailableBarSizes] = useState<{id: string, comprimento: number, descricao?: string}[]>([]);
  const [selectedBarSize, setSelectedBarSize] = useState<number>(6000);

  useEffect(() => {
    fetchBarSizes();
  }, []);

  const fetchBarSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('tamanhos_barras')
        .select('id, comprimento, descricao')
        .order('comprimento', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tamanhos de barras:', error);
      } else {
        setAvailableBarSizes(data || []);
        // Definir o tamanho padrão se houver
        const defaultSize = data?.find(size => size.comprimento === 6000);
        if (defaultSize) {
          setSelectedBarSize(defaultSize.comprimento);
        }
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  // Se não há projeto carregado, não mostra o componente
  if (!project) {
    return null;
  }

  const addPiece = () => {
    const pieceLength = parseFloat(length);
    const pieceQuantity = parseInt(quantity);

    if (pieceLength > 0 && pieceQuantity > 0) {
      const newPiece: CutPiece = {
        id: Date.now().toString(),
        length: pieceLength,
        quantity: pieceQuantity,
      };
      setPieces([...pieces, newPiece]);
      setLength('');
      setQuantity('1');
    }
  };

  const removePiece = (id: string) => {
    setPieces(pieces.filter(piece => piece.id !== id));
  };

  const updatePiece = (id: string, field: 'length' | 'quantity', value: number) => {
    setPieces(pieces.map(piece => 
      piece.id === id ? { ...piece, [field]: value } : piece
    ));
  };

  const handleImportedData = (importedPieces: CutPiece[], duplicates?: DuplicateItem[]) => {
    if (duplicates && duplicates.length > 0) {
      setPendingDuplicates(duplicates);
      setPendingImportedPieces(importedPieces);
      setShowDuplicateManager(true);
      return;
    }
    
    setPieces([...pieces, ...importedPieces]);
    console.log(`${importedPieces.length} peças importadas com sucesso!`);
  };

  const handleDuplicateResolution = (action: 'update' | 'ignore' | 'duplicate', resolvedPieces: CutPiece[]) => {
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
      <DuplicateManager
        duplicates={pendingDuplicates}
        onResolved={handleDuplicateResolution}
        onCancel={handleCancelDuplicateManager}
      />
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Lista de Peças - Optimizador Corte Plano GMX
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <FileUpload 
          onDataImported={handleImportedData}
          currentPieces={pieces}
        />
        
        <BarSizeSelector
          availableSizes={availableBarSizes}
          selectedSize={selectedBarSize}
          onSizeChange={setSelectedBarSize}
        />

        <ManualEntryForm
          length={length}
          quantity={quantity}
          setLength={setLength}
          setQuantity={setQuantity}
          onAddPiece={addPiece}
        />

        <PieceList
          pieces={pieces}
          onUpdatePiece={updatePiece}
          onRemovePiece={removePiece}
        />

        <OptimizeSection
          onOptimize={() => onOptimize(selectedBarSize)}
          disabled={disabled || false}
          hasNoPieces={pieces.length === 0}
        />
      </CardContent>
    </Card>
  );
};
