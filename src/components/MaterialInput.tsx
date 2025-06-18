
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Trash2, Plus } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { DuplicateManager } from './DuplicateManager';
import type { CutPiece } from '@/pages/Index';

interface MaterialInputProps {
  pieces: CutPiece[];
  setPieces: (pieces: CutPiece[]) => void;
  onOptimize: () => void;
  disabled?: boolean;
}

interface DuplicateItem {
  existing: CutPiece;
  imported: CutPiece;
  conflicts: string[];
  material?: string;
  tag?: string;
  project?: string;
}

export const MaterialInput = ({ pieces, setPieces, onOptimize, disabled }: MaterialInputProps) => {
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  const [pendingDuplicates, setPendingDuplicates] = useState<DuplicateItem[]>([]);
  const [pendingImportedPieces, setPendingImportedPieces] = useState<CutPiece[]>([]);

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
        
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Entrada Manual</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="length">Comprimento (mm)</Label>
              <Input
                id="length"
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="Ex: 2500"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                className="h-12"
              />
            </div>
            
            <Button onClick={addPiece} className="h-12 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {pieces.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Peças Cadastradas ({pieces.length})
              </h3>
              <Badge variant="outline" className="text-sm">
                Total: {pieces.reduce((sum, piece) => sum + piece.quantity, 0)} unidades
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pieces.map((piece) => (
                <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      value={piece.length}
                      onChange={(e) => updatePiece(piece.id, 'length', parseFloat(e.target.value) || 0)}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      value={piece.quantity}
                      onChange={(e) => updatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="h-10"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePiece(piece.id)}
                    className="h-10 w-10 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            onClick={onOptimize}
            disabled={disabled || pieces.length === 0}
            className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            size="lg"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Otimizar Corte
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
