
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Square, Trash2, Plus, Calculator } from 'lucide-react';
import type { SheetCutPiece } from '@/types/sheet';

interface SheetMaterialInputProps {
  pieces: SheetCutPiece[];
  setPieces: (pieces: SheetCutPiece[]) => void;
  onOptimize: () => void;
  disabled?: boolean;
}

export const SheetMaterialInput = ({ pieces, setPieces, onOptimize, disabled }: SheetMaterialInputProps) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [tag, setTag] = useState('');
  const [allowRotation, setAllowRotation] = useState(true);

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
        tag: tag.trim(),
        allowRotation,
      };
      setPieces([...pieces, newPiece]);
      setWidth('');
      setHeight('');
      setQuantity('1');
      setTag('');
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

  const totalArea = pieces.reduce((sum, piece) => sum + (piece.width * piece.height * piece.quantity), 0);
  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Square className="w-5 h-5" />
          Lista de Peças - Corte de Chapas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Entrada de Peças</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="width">Largura (mm)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Ex: 200"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Altura (mm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Ex: 150"
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
            
            <div className="space-y-2">
              <Label htmlFor="tag">Tag/ID</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ex: CH581"
                className="h-12"
              />
            </div>
            
            <Button 
              onClick={addPiece} 
              className="h-12 bg-purple-600 hover:bg-purple-700"
              disabled={!width || !height || !tag.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allowRotation"
              checked={allowRotation}
              onCheckedChange={setAllowRotation}
            />
            <Label htmlFor="allowRotation" className="text-sm">
              Permitir rotação 90°
            </Label>
          </div>
        </div>

        {pieces.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Peças Cadastradas ({pieces.length})
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
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pieces.map((piece) => (
                <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <Input
                      type="number"
                      value={piece.width}
                      onChange={(e) => updatePiece(piece.id, 'width', parseFloat(e.target.value) || 0)}
                      className="h-10"
                      placeholder="Largura"
                    />
                    <Input
                      type="number"
                      value={piece.height}
                      onChange={(e) => updatePiece(piece.id, 'height', parseFloat(e.target.value) || 0)}
                      className="h-10"
                      placeholder="Altura"
                    />
                    <Input
                      type="number"
                      value={piece.quantity}
                      onChange={(e) => updatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="h-10"
                      placeholder="Qtd"
                    />
                    <Input
                      value={piece.tag}
                      onChange={(e) => updatePiece(piece.id, 'tag', e.target.value)}
                      className="h-10"
                      placeholder="Tag"
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={piece.allowRotation}
                        onCheckedChange={(checked) => updatePiece(piece.id, 'allowRotation', checked)}
                      />
                      <span className="text-xs">90°</span>
                    </div>
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
            className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
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
