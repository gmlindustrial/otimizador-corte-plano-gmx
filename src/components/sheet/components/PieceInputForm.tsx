
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';

interface PieceInputFormProps {
  width: string;
  height: string;
  quantity: string;
  tag: string;
  allowRotation: boolean;
  setWidth: (value: string) => void;
  setHeight: (value: string) => void;
  setQuantity: (value: string) => void;
  setTag: (value: string) => void;
  setAllowRotation: (value: boolean) => void;
  onAddPiece: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const PieceInputForm = ({
  width,
  height,
  quantity,
  tag,
  allowRotation,
  setWidth,
  setHeight,
  setQuantity,
  setTag,
  setAllowRotation,
  onAddPiece,
  onKeyPress
}: PieceInputFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Entrada de Peças</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="width">Largura (mm)</Label>
          <Input
            id="width"
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Ex: 200"
            className="h-12"
            min="1"
            step="1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Altura (mm)</Label>
          <Input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Ex: 150"
            className="h-12"
            min="1"
            step="1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyPress={onKeyPress}
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
            onKeyPress={onKeyPress}
            placeholder="Ex: CH581"
            className="h-12"
            maxLength="20"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm">Rotação 90°</Label>
          <div className="flex items-center justify-center h-12">
            <Switch
              checked={allowRotation}
              onCheckedChange={setAllowRotation}
            />
          </div>
        </div>
        
        <Button 
          onClick={onAddPiece} 
          className="h-12 bg-purple-600 hover:bg-purple-700"
          disabled={!width || !height || !tag.trim() || parseFloat(width) <= 0 || parseFloat(height) <= 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Use ENTER para adicionar rapidamente</p>
        <p>• Tags numéricas são auto-incrementadas (ex: CH001 → CH002)</p>
        <p>• Rotação 90° permite maior flexibilidade no posicionamento</p>
      </div>
    </div>
  );
};
