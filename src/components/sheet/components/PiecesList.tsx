
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import type { SheetCutPiece } from '@/types/sheet';

interface PiecesListProps {
  pieces: SheetCutPiece[];
  onUpdatePiece: (id: string, field: keyof SheetCutPiece, value: any) => void;
  onRemovePiece: (id: string) => void;
  totalPieces: number;
  totalArea: number;
}

export const PiecesList = ({ 
  pieces, 
  onUpdatePiece, 
  onRemovePiece, 
  totalPieces, 
  totalArea 
}: PiecesListProps) => {
  if (pieces.length === 0) return null;

  const handleWidthChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onUpdatePiece(id, 'width', numValue);
    }
  };

  const handleHeightChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onUpdatePiece(id, 'height', numValue);
    }
  };

  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      onUpdatePiece(id, 'quantity', numValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Peças Cadastradas ({pieces.length} tipos)
        </h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {totalPieces} unidades
          </Badge>
          <Badge variant="outline" className="text-sm">
            Área: {(totalArea / 1000000).toFixed(2)} m²
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
        {pieces.map((piece) => {
          const pieceArea = piece.width * piece.height * piece.quantity;
          
          return (
            <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1 grid grid-cols-5 gap-4">
                <Input
                  type="number"
                  value={piece.width.toString()}
                  onChange={(e) => handleWidthChange(piece.id, e.target.value)}
                  className="h-10"
                  placeholder="Largura"
                  min="1"
                />
                <Input
                  type="number"
                  value={piece.height.toString()}
                  onChange={(e) => handleHeightChange(piece.id, e.target.value)}
                  className="h-10"
                  placeholder="Altura"
                  min="1"
                />
                <Input
                  type="number"
                  value={piece.quantity.toString()}
                  onChange={(e) => handleQuantityChange(piece.id, e.target.value)}
                  min="1"
                  className="h-10"
                  placeholder="Qtd"
                />
                <Input
                  value={piece.tag}
                  onChange={(e) => onUpdatePiece(piece.id, 'tag', e.target.value)}
                  className="h-10"
                  placeholder="Tag"
                  maxLength="20"
                />
                <div className="flex items-center justify-between">
                  <Switch
                    checked={piece.allowRotation}
                    onCheckedChange={(checked) => onUpdatePiece(piece.id, 'allowRotation', checked)}
                  />
                  <span className="text-xs text-gray-500">
                    {pieceArea / 1000000 < 0.01 
                      ? `${(pieceArea / 1000).toFixed(0)}cm²` 
                      : `${(pieceArea / 1000000).toFixed(2)}m²`}
                  </span>
                </div>
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
          );
        })}
      </div>
    </div>
  );
};
