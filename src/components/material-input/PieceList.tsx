
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import type { CutPiece } from '@/pages/Index';

interface PieceListProps {
  pieces: CutPiece[];
  onUpdatePiece: (id: string, field: 'length' | 'quantity', value: number) => void;
  onRemovePiece: (id: string) => void;
}

export const PieceList = ({ pieces, onUpdatePiece, onRemovePiece }: PieceListProps) => {
  if (pieces.length === 0) return null;

  const totalQuantity = pieces.reduce((sum, piece) => sum + piece.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Peças Cadastradas ({pieces.length})
        </h3>
        <Badge variant="outline" className="text-sm">
          Total: {totalQuantity} unidades
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {pieces.map((piece) => (
          <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Input
                type="number"
                value={piece.length}
                onChange={(e) => onUpdatePiece(piece.id, 'length', parseFloat(e.target.value) || 0)}
                className="h-10"
              />
              <Input
                type="number"
                value={piece.quantity}
                onChange={(e) => onUpdatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)}
                min="1"
                className="h-10"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemovePiece(piece.id)}
              className="h-10 w-10 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
