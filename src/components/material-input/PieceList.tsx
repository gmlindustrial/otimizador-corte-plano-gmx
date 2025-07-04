
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Package } from 'lucide-react';
import type { CutPiece } from '@/pages/Index';

interface PieceListProps {
  pieces: CutPiece[];
  onUpdatePiece: (id: string, field: 'length' | 'quantity', value: number) => void;
  onRemovePiece: (id: string) => void;
}

export const PieceList = ({ pieces, onUpdatePiece, onRemovePiece }: PieceListProps) => {
  if (pieces.length === 0) return null;

  const totalQuantity = pieces.reduce((sum, piece) => sum + piece.quantity, 0);

  // Agrupar peças por conjunto
  const groupedPieces = pieces.reduce((groups, piece) => {
    const conjunto = (piece as any).conjunto || 'Sem Conjunto';
    if (!groups[conjunto]) {
      groups[conjunto] = [];
    }
    groups[conjunto].push(piece);
    return groups;
  }, {} as Record<string, CutPiece[]>);

  const conjuntos = Object.keys(groupedPieces);

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
        {conjuntos.length > 1 ? (
          <Accordion type="multiple" className="w-full">
            {conjuntos.map((conjunto) => {
              const conjuntoPieces = groupedPieces[conjunto];
              const conjuntoQuantity = conjuntoPieces.reduce((sum, piece) => sum + piece.quantity, 0);
              
              return (
                <AccordionItem key={conjunto} value={conjunto}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>{conjunto}</span>
                      <Badge variant="secondary" className="text-xs">
                        {conjuntoPieces.length} tipos • {conjuntoQuantity} unidades
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {conjuntoPieces.map((piece) => (
                        <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <Input
                              type="number"
                              value={piece.length}
                              onChange={(e) => onUpdatePiece(piece.id, 'length', parseFloat(e.target.value) || 0)}
                              className="h-10"
                              placeholder="Comprimento"
                            />
                            <Input
                              type="number"
                              value={piece.quantity}
                              onChange={(e) => onUpdatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)}
                              min="1"
                              className="h-10"
                              placeholder="Quantidade"
                            />
                            <div className="flex items-center">
                              {(piece as any).tag && (
                                <Badge variant="outline" className="text-xs">
                                  {(piece as any).tag}
                                </Badge>
                              )}
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
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          // Exibição simples quando há apenas um conjunto ou nenhum
          <div className="space-y-2">
            {pieces.map((piece) => (
              <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <Input
                    type="number"
                    value={piece.length}
                    onChange={(e) => onUpdatePiece(piece.id, 'length', parseFloat(e.target.value) || 0)}
                    className="h-10"
                    placeholder="Comprimento"
                  />
                  <Input
                    type="number"
                    value={piece.quantity}
                    onChange={(e) => onUpdatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-10"
                    placeholder="Quantidade"
                  />
                  <div className="flex items-center">
                    {(piece as any).tag && (
                      <Badge variant="outline" className="text-xs">
                        {(piece as any).tag}
                      </Badge>
                    )}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
