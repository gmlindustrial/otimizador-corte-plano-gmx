
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Package } from 'lucide-react';
import type { CutPiece } from '@/types/cutPiece';

interface PieceListProps {
  pieces: CutPiece[];
  onUpdatePiece: (id: string, field: 'length' | 'quantity', value: number) => void;
  onRemovePiece: (id: string) => void;
}

export const PieceList = ({ pieces, onUpdatePiece, onRemovePiece }: PieceListProps) => {
  if (pieces.length === 0) return null;

  const totalQuantity = pieces.reduce((sum, piece) => sum + piece.quantity, 0);

  // Agrupar peças por conjunto
  const piecesWithConjunto = pieces.filter(piece => piece.conjunto);
  const piecesWithoutConjunto = pieces.filter(piece => !piece.conjunto);
  
  const conjuntoGroups = piecesWithConjunto.reduce((groups, piece) => {
    const conjunto = piece.conjunto!;
    if (!groups[conjunto]) {
      groups[conjunto] = [];
    }
    groups[conjunto].push(piece);
    return groups;
  }, {} as Record<string, CutPiece[]>);

  const hasAutoCADData = pieces.some(piece => piece.conjunto || piece.tag || piece.perfil);

  const renderPieceRow = (piece: CutPiece, showExtraColumns = false) => (
    <div key={piece.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className={`flex-1 grid gap-4 ${showExtraColumns ? 'grid-cols-5' : 'grid-cols-2'}`}>
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
        {showExtraColumns && (
          <>
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{piece.tag || '-'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span>{piece.perfil || '-'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span>{piece.peso ? `${piece.peso}kg` : '-'}</span>
            </div>
          </>
        )}
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

  const removeConjunto = (conjunto: string) => {
    const conjuntoPieces = conjuntoGroups[conjunto];
    conjuntoPieces.forEach(piece => onRemovePiece(piece.id));
  };

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

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {/* Peças agrupadas por conjunto */}
        {Object.keys(conjuntoGroups).length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {Object.entries(conjuntoGroups)
              .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
              .map(([conjunto, conjuntoPieces]) => {
                const conjuntoQuantity = conjuntoPieces.reduce((sum, piece) => sum + piece.quantity, 0);
                const conjuntoPeso = conjuntoPieces.reduce((sum, piece) => sum + (piece.peso || 0) * piece.quantity, 0);

                return (
                  <AccordionItem key={conjunto} value={conjunto} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{conjunto}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-xs">
                            {conjuntoPieces.length} tipos
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {conjuntoQuantity} unid.
                          </Badge>
                          {conjuntoPeso > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {conjuntoPeso.toFixed(1)}kg
                            </Badge>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeConjunto(conjunto);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {hasAutoCADData && (
                        <div className="grid grid-cols-5 gap-4 mb-2 text-xs font-medium text-gray-500 px-3">
                          <span>Comprimento</span>
                          <span>Quantidade</span>
                          <span>TAG</span>
                          <span>Perfil</span>
                          <span>Peso Unit.</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {conjuntoPieces.map(piece => renderPieceRow(piece, hasAutoCADData))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        )}

        {/* Peças sem conjunto (adicionadas manualmente) */}
        {piecesWithoutConjunto.length > 0 && (
          <div className="space-y-2">
            {Object.keys(conjuntoGroups).length > 0 && (
              <h4 className="text-sm font-medium text-gray-700 border-t pt-4">
                Peças Manuais
              </h4>
            )}
            {piecesWithoutConjunto.map(piece => renderPieceRow(piece, false))}
          </div>
        )}
      </div>
    </div>
  );
};
