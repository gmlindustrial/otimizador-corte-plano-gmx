
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, FileText, Square, Circle } from 'lucide-react';
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

  const getGeometryIcon = (piece: SheetCutPiece) => {
    if (!piece.geometry) return <Square className="w-4 h-4 text-gray-500" />;
    
    switch (piece.geometry.type) {
      case 'rectangle':
        return <Square className="w-4 h-4 text-blue-500" />;
      case 'circle':
        return <Circle className="w-4 h-4 text-green-500" />;
      case 'polygon':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'complex':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <Square className="w-4 h-4 text-gray-500" />;
    }
  };

  const getGeometryDescription = (piece: SheetCutPiece) => {
    if (!piece.geometry) return 'Retângulo padrão';
    
    switch (piece.geometry.type) {
      case 'rectangle':
        return 'Retângulo';
      case 'circle':
        return `Círculo Ø${piece.geometry.radius}`;
      case 'polygon':
        return `Polígono (${piece.geometry.points?.length || 0} pontos)`;
      case 'complex':
        return `Complexa${piece.cadFile ? ` (${piece.cadFile})` : ''}`;
      default:
        return 'Geometria desconhecida';
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
          const realArea = piece.geometry?.area ? piece.geometry.area * piece.quantity : pieceArea;
          
          return (
            <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1 grid grid-cols-6 gap-4">
                <Input
                  type="number"
                  value={piece.width.toString()}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      onUpdatePiece(piece.id, 'width', value);
                    }
                  }}
                  className="h-10"
                  placeholder="Largura"
                  min="1"
                />
                <Input
                  type="number"
                  value={piece.height.toString()}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      onUpdatePiece(piece.id, 'height', value);
                    }
                  }}
                  className="h-10"
                  placeholder="Altura"
                  min="1"
                />
                <Input
                  type="number"
                  value={piece.quantity.toString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      onUpdatePiece(piece.id, 'quantity', value);
                    }
                  }}
                  min="1"
                  className="h-10"
                  placeholder="Qtd"
                />
                <Input
                  value={piece.tag}
                  onChange={(e) => onUpdatePiece(piece.id, 'tag', e.target.value)}
                  className="h-10"
                  placeholder="Tag"
                  maxLength={20}
                />
                <div className="flex items-center justify-between">
                  <Switch
                    checked={piece.allowRotation}
                    onCheckedChange={(checked) => onUpdatePiece(piece.id, 'allowRotation', checked)}
                  />
                  <div className="text-center">
                    <div className="text-xs text-gray-500">
                      {realArea / 1000000 < 0.01 
                        ? `${(realArea / 1000).toFixed(0)}cm²` 
                        : `${(realArea / 1000000).toFixed(2)}m²`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {getGeometryIcon(piece)}
                  <div className="text-xs text-gray-500 text-right">
                    {getGeometryDescription(piece)}
                  </div>
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
      
      {/* Legenda de geometrias */}
      <div className="flex gap-4 text-xs text-gray-600 border-t pt-2">
        <div className="flex items-center gap-1">
          <Square className="w-3 h-3 text-blue-500" />
          <span>Retângulo</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="w-3 h-3 text-green-500" />
          <span>Círculo</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-orange-500" />
          <span>Polígono</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-purple-500" />
          <span>CAD Complexo</span>
        </div>
      </div>
    </div>
  );
};
