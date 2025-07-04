
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Package, Tag } from 'lucide-react';
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
    const conjunto = (piece as any).conjunto || 'Entrada Manual';
    if (!groups[conjunto]) {
      groups[conjunto] = [];
    }
    groups[conjunto].push(piece);
    return groups;
  }, {} as Record<string, CutPiece[]>);

  const conjuntos = Object.keys(groupedPieces);

  const renderPieceItem = (piece: CutPiece) => (
    <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 grid grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Comprimento (mm)</label>
          <Input
            type="number"
            value={piece.length}
            onChange={(e) => onUpdatePiece(piece.id, 'length', parseFloat(e.target.value) || 0)}
            className="h-9"
            placeholder="Comprimento"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Quantidade</label>
          <Input
            type="number"
            value={piece.quantity}
            onChange={(e) => onUpdatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)}
            min="1"
            className="h-9"
            placeholder="Quantidade"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-600">TAG</label>
          <div className="flex items-center h-9">
            {(piece as any).tag ? (
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {(piece as any).tag}
              </Badge>
            ) : (
              <span className="text-xs text-gray-400">Sem TAG</span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Perfil</label>
          <div className="flex items-center h-9">
            {(piece as any).perfil ? (
              <Badge variant="secondary" className="text-xs">
                {(piece as any).perfil}
              </Badge>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRemovePiece(piece.id)}
        className="h-9 w-9 p-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

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
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {conjuntos.length > 1 ? (
          <Accordion type="multiple" className="w-full" defaultValue={conjuntos}>
            {conjuntos.map((conjunto) => {
              const conjuntoPieces = groupedPieces[conjunto];
              const conjuntoQuantity = conjuntoPieces.reduce((sum, piece) => sum + piece.quantity, 0);
              const temTags = conjuntoPieces.some(piece => (piece as any).tag);
              
              return (
                <AccordionItem key={conjunto} value={conjunto}>
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{conjunto}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto mr-4">
                        <Badge variant="secondary" className="text-xs">
                          {conjuntoPieces.length} tipos
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {conjuntoQuantity} unidades
                        </Badge>
                        {temTags && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            <Tag className="w-3 h-3 mr-1" />
                            TAGs
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {conjuntoPieces.map(renderPieceItem)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          // Exibição simples quando há apenas um conjunto
          <div className="space-y-3">
            {pieces.map(renderPieceItem)}
          </div>
        )}
      </div>
    </div>
  );
};
