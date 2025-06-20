
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Square, Trash2, Plus, Calculator, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { SheetCutPiece } from '@/types/sheet';

interface SheetMaterialInputProps {
  pieces: SheetCutPiece[];
  setPieces: (pieces: SheetCutPiece[]) => void;
  onOptimize: () => void;
  disabled?: boolean;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  projectStats?: {
    totalPieces: number;
    totalArea: number;
    estimatedSheets: number;
    estimatedWeight: number;
    estimatedCost: number;
  } | null;
}

export const SheetMaterialInput = ({ 
  pieces, 
  setPieces, 
  onOptimize, 
  disabled,
  validation,
  projectStats
}: SheetMaterialInputProps) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [tag, setTag] = useState('');
  const [allowRotation, setAllowRotation] = useState(true);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    setShowValidation(validation !== null);
  }, [validation]);

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
        tag: tag.trim().toUpperCase(),
        allowRotation,
      };
      setPieces([...pieces, newPiece]);
      setWidth('');
      setHeight('');
      setQuantity('1');
      setTag('');
      
      // Auto-incrementar tag se for numérica
      const match = tag.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2]) + 1;
        setTag(`${prefix}${number.toString().padStart(match[2].length, '0')}`);
      }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && width && height && tag.trim()) {
      addPiece();
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Square className="w-5 h-5" />
          Lista de Peças - Corte de Chapas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Validação e Avisos */}
        {showValidation && validation && (
          <div className="space-y-2">
            {validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erros encontrados:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validation.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Avisos:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validation.valid && validation.errors.length === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Todas as peças são válidas para otimização.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Estatísticas do Projeto */}
        {projectStats && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Estimativas do Projeto</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{projectStats.totalPieces}</div>
                <div className="text-gray-600">Peças</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{(projectStats.totalArea / 1000000).toFixed(2)} m²</div>
                <div className="text-gray-600">Área Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{projectStats.estimatedSheets}</div>
                <div className="text-gray-600">Chapas Est.</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{projectStats.estimatedWeight.toFixed(1)} kg</div>
                <div className="text-gray-600">Peso Est.</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">R$ {projectStats.estimatedCost.toFixed(2)}</div>
                <div className="text-gray-600">Custo Est.</div>
              </div>
            </div>
          </div>
        )}

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
                onKeyPress={handleKeyPress}
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
                onKeyPress={handleKeyPress}
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
                onKeyPress={handleKeyPress}
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
                onKeyPress={handleKeyPress}
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
              onClick={addPiece} 
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

        {pieces.length > 0 && (
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
              {pieces.map((piece) => (
                <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <Input
                      type="number"
                      value={piece.width}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          updatePiece(piece.id, 'width', value);
                        }
                      }}
                      className="h-10"
                      placeholder="Largura"
                      min="1"
                    />
                    <Input
                      type="number"
                      value={piece.height}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          updatePiece(piece.id, 'height', value);
                        }
                      }}
                      className="h-10"
                      placeholder="Altura"
                      min="1"
                    />
                    <Input
                      type="number"
                      value={piece.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          updatePiece(piece.id, 'quantity', value);
                        }
                      }}
                      min="1"
                      className="h-10"
                      placeholder="Qtd"
                    />
                    <Input
                      value={piece.tag}
                      onChange={(e) => updatePiece(piece.id, 'tag', e.target.value)}
                      className="h-10"
                      placeholder="Tag"
                      maxLength="20"
                    />
                    <div className="flex items-center justify-between">
                      <Switch
                        checked={piece.allowRotation}
                        onCheckedChange={(checked) => updatePiece(piece.id, 'allowRotation', checked)}
                      />
                      <span className="text-xs text-gray-500">
                        {piece.width * piece.height * piece.quantity / 1000000 < 0.01 
                          ? `${(piece.width * piece.height * piece.quantity / 1000).toFixed(0)}cm²` 
                          : `${(piece.width * piece.height * piece.quantity / 1000000).toFixed(2)}m²`}
                      </span>
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
            disabled={disabled || pieces.length === 0 || (validation && !validation.valid)}
            className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
            size="lg"
          >
            <Calculator className="w-5 h-5 mr-2" />
            {disabled ? 'Otimizando...' : 'Otimizar Corte'}
          </Button>
        </div>

        {disabled && (
          <div className="flex items-center justify-center space-y-2">
            <Progress value={33} className="w-full h-2" />
            <p className="text-sm text-gray-600 mt-2">Executando algoritmos de otimização...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
