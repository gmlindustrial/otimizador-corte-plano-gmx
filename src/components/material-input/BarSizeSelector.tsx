import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Ruler } from 'lucide-react';

interface BarSize {
  id: string;
  comprimento: number;
  descricao?: string;
}

interface BarSizeSelectorProps {
  availableSizes: BarSize[];
  selectedSize: number;
  onSizeChange: (size: number) => void;
}

export const BarSizeSelector = ({ availableSizes, selectedSize, onSizeChange }: BarSizeSelectorProps) => {
  if (availableSizes.length === 0) {
    return null;
  }

  return (
    <Card className="bg-blue-50/50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Ruler className="w-4 h-4" />
          Tamanho da Barra
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="barSize">Selecione o tamanho da barra para otimização:</Label>
          <Select
            value={selectedSize.toString()}
            onValueChange={(value) => onSizeChange(Number(value))}
          >
            <SelectTrigger id="barSize">
              <SelectValue placeholder="Selecione o tamanho da barra" />
            </SelectTrigger>
            <SelectContent>
              {availableSizes.map((size) => (
                <SelectItem key={size.id} value={size.comprimento.toString()}>
                  {size.comprimento}mm {size.descricao && `- ${size.descricao}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
          <strong>Tamanho selecionado:</strong> {selectedSize}mm
          {availableSizes.find(s => s.comprimento === selectedSize)?.descricao && 
            ` - ${availableSizes.find(s => s.comprimento === selectedSize)?.descricao}`
          }
        </div>
      </CardContent>
    </Card>
  );
};