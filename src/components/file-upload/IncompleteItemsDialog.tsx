import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check, X } from 'lucide-react';
import { IncompletePiece } from './FileParsingService';
import { CutPiece } from '@/pages/Index';

interface IncompleteItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incompletePieces: IncompletePiece[];
  onConfirm: (completedPieces: CutPiece[]) => void;
  onSkip: () => void;
}

export const IncompleteItemsDialog = ({
  open,
  onOpenChange,
  incompletePieces,
  onConfirm,
  onSkip
}: IncompleteItemsDialogProps) => {
  // Estado para armazenar as quantidades editadas
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Atualizar quantidades quando as peças incompletas mudam
  useEffect(() => {
    if (incompletePieces.length > 0) {
      const initial: Record<string, number> = {};
      incompletePieces.forEach(piece => {
        initial[piece.id] = piece.quantity ?? 1;
      });
      setQuantities(initial);
    }
  }, [incompletePieces]);

  const handleQuantityChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [id]: num }));
  };

  const handleConfirm = () => {
    // Converter peças incompletas em peças completas com as quantidades editadas
    const completedPieces: CutPiece[] = incompletePieces
      .filter(piece => quantities[piece.id] > 0)
      .map(piece => ({
        id: `completed-${piece.id}`,
        length: piece.dimensao,
        quantity: quantities[piece.id],
        posicao: piece.projetoNum,
        tag: piece.item,
        perfil: piece.descricao,
        material: piece.material,
      }));

    onConfirm(completedPieces);
  };

  const allValid = Object.values(quantities).every(q => q > 0);
  const validCount = Object.values(quantities).filter(q => q > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Peças com Dados Incompletos
          </DialogTitle>
          <DialogDescription>
            {incompletePieces.length} peça(s) foram encontradas com quantidade faltando.
            Preencha as quantidades para incluí-las na importação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {incompletePieces.map((piece) => (
            <div
              key={piece.id}
              className="border rounded-lg p-3 bg-amber-50 border-amber-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                      Linha {piece.rowNumber}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      Item {piece.item}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate" title={piece.descricao}>
                    {piece.descricao}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {piece.dimensao}mm | {piece.material || 'Material não informado'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${piece.id}`} className="text-sm whitespace-nowrap">
                    Qtde:
                  </Label>
                  <Input
                    id={`qty-${piece.id}`}
                    type="number"
                    min="0"
                    value={quantities[piece.id] || ''}
                    onChange={(e) => handleQuantityChange(piece.id, e.target.value)}
                    className={`w-20 text-center ${
                      quantities[piece.id] > 0
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          <Button variant="outline" onClick={onSkip} className="gap-1">
            <X className="w-4 h-4" />
            Ignorar Todas
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={validCount === 0}
            className="gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Check className="w-4 h-4" />
            Incluir {validCount} Peça{validCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
