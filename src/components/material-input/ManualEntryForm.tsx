
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface ManualEntryFormProps {
  length: string;
  quantity: string;
  setLength: (value: string) => void;
  setQuantity: (value: string) => void;
  onAddPiece: () => void;
}

export const ManualEntryForm = ({ 
  length, 
  quantity, 
  setLength, 
  setQuantity, 
  onAddPiece 
}: ManualEntryFormProps) => {
  return (
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
        
        <Button onClick={onAddPiece} className="h-12 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};
