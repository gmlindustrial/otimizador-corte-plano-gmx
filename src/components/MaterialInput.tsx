
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CutPiece } from '@/pages/Index';
import { Plus, Upload, Calculator, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface MaterialInputProps {
  pieces: CutPiece[];
  setPieces: (pieces: CutPiece[]) => void;
  onOptimize: () => void;
  disabled: boolean;
}

export const MaterialInput = ({ pieces, setPieces, onOptimize, disabled }: MaterialInputProps) => {
  const [newPiece, setNewPiece] = useState({ length: '', quantity: '' });

  const addPiece = () => {
    const length = parseInt(newPiece.length);
    const quantity = parseInt(newPiece.quantity);

    if (length > 0 && quantity > 0) {
      const piece: CutPiece = {
        id: Date.now().toString(),
        length,
        quantity
      };
      setPieces([...pieces, piece]);
      setNewPiece({ length: '', quantity: '' });
      toast.success(`Adicionado: ${quantity}x ${length}mm`);
    }
  };

  const removePiece = (id: string) => {
    setPieces(pieces.filter(p => p.id !== id));
    toast.info('Peça removida da lista');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());
      
      const newPieces: CutPiece[] = [];
      
      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('comprimento') || line.toLowerCase().includes('length'))) {
          return; // Skip header
        }
        
        const parts = line.split(/[,;\t]/).map(p => p.trim());
        if (parts.length >= 2) {
          const length = parseInt(parts[0]);
          const quantity = parseInt(parts[1]);
          
          if (length > 0 && quantity > 0) {
            newPieces.push({
              id: `${Date.now()}-${index}`,
              length,
              quantity
            });
          }
        }
      });

      if (newPieces.length > 0) {
        setPieces([...pieces, ...newPieces]);
        toast.success(`${newPieces.length} peças importadas com sucesso!`);
      } else {
        toast.error('Nenhuma peça válida encontrada no arquivo');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const totalLength = pieces.reduce((sum, piece) => sum + (piece.length * piece.quantity), 0);

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Lista de Peças para Corte
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Input Manual */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Comprimento (mm)</Label>
            <Input
              type="number"
              placeholder="Ex: 1500"
              value={newPiece.length}
              onChange={(e) => setNewPiece(prev => ({ ...prev, length: e.target.value }))}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              placeholder="Ex: 5"
              value={newPiece.quantity}
              onChange={(e) => setNewPiece(prev => ({ ...prev, quantity: e.target.value }))}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="invisible">Ação</Label>
            <Button 
              onClick={addPiece}
              className="w-full"
              disabled={!newPiece.length || !newPiece.quantity || disabled}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Upload de Arquivo */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Ou faça upload de um arquivo CSV/TXT
            </p>
            <input
              type="file"
              accept=".csv,.txt,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={disabled}
            />
            <Label 
              htmlFor="file-upload" 
              className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg transition-colors"
            >
              Selecionar Arquivo
            </Label>
          </div>
        </div>

        {/* Lista de Peças */}
        {pieces.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Peças Adicionadas:</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {pieces.map((piece) => (
                <div key={piece.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm">
                    <strong>{piece.quantity}x</strong> peças de <strong>{piece.length}mm</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePiece(piece.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Resumo */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total de peças:</span>
                  <span className="font-semibold ml-2">{totalPieces}</span>
                </div>
                <div>
                  <span className="text-gray-600">Comprimento total:</span>
                  <span className="font-semibold ml-2">{(totalLength / 1000).toFixed(2)}m</span>
                </div>
              </div>
            </div>

            {/* Botão de Otimização */}
            <Button 
              onClick={onOptimize}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3"
              disabled={disabled || pieces.length === 0}
            >
              <Calculator className="w-5 h-5 mr-2" />
              Iniciar Otimização
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
