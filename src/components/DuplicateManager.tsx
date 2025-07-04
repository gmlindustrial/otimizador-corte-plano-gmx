
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from 'sonner';
import type { CutPiece } from '@/types/cutPiece';

interface DuplicateItem {
  existing: CutPiece;
  imported: CutPiece;
  conflicts: string[];
  material?: string;
  tag?: string;
  project?: string;
}

interface DuplicateManagerProps {
  duplicates: DuplicateItem[];
  onResolved: (action: 'update' | 'ignore' | 'duplicate', resolvedPieces: CutPiece[]) => void;
  onCancel: () => void;
}

export const DuplicateManager = ({ duplicates, onResolved, onCancel }: DuplicateManagerProps) => {
  const [resolutions, setResolutions] = useState<{ [id: string]: 'update' | 'ignore' | 'duplicate' }>({});
  const [customQuantities, setCustomQuantities] = useState<{ [id: string]: number }>({});

  const handleResolutionChange = (id: string, action: 'update' | 'ignore' | 'duplicate') => {
    setResolutions(prev => ({ ...prev, [id]: action }));
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setCustomQuantities(prev => ({ ...prev, [id]: quantity }));
  };

  const resolveDuplicates = () => {
    const resolvedPieces: CutPiece[] = [];

    duplicates.forEach(item => {
      const resolution = resolutions[item.existing.id];
      const imported = item.imported;

      switch (resolution) {
        case 'update':
          // Update existing piece with imported data
          resolvedPieces.push({ ...item.existing, ...imported });
          break;
        case 'duplicate':
          // Add imported piece as a new entry, using custom quantity if provided
          const quantity = customQuantities[item.existing.id] || imported.quantity;
          resolvedPieces.push({ ...imported, quantity, id: Date.now().toString() });
          break;
        case 'ignore':
        default:
          // Ignore the imported piece
          break;
      }
    });

    onResolved('duplicate', resolvedPieces);
    toast.success(`${resolvedPieces.length} Peças processadas!`);
  };

  const allResolved = Object.keys(resolutions).length === duplicates.length;
  const canResolve = allResolved;

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader>
        <CardTitle>Gerenciar Duplicatas</CardTitle>
        <CardDescription>
          Detectamos peças duplicadas. Escolha como deseja proceder com cada uma.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <div className="divide-y divide-gray-200">
            {duplicates.map((item) => (
              <div key={item.existing.id} className="py-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <h4 className="text-sm font-semibold">Peça Existente</h4>
                    <p className="text-xs text-gray-500">Comprimento: {item.existing.length}mm</p>
                    {item.existing.tag && (
                      <p className="text-xs text-gray-500">TAG: {item.existing.tag}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Peça Importada</h4>
                    <p className="text-xs text-gray-500">Comprimento: {item.imported.length}mm</p>
                    {item.imported.tag && (
                      <p className="text-xs text-gray-500">TAG: {item.imported.tag}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Ação</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={resolutions[item.existing.id] === 'update' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleResolutionChange(item.existing.id, 'update')}
                      >
                        Atualizar
                      </Button>
                      <Button
                        variant={resolutions[item.existing.id] === 'duplicate' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleResolutionChange(item.existing.id, 'duplicate')}
                      >
                        Duplicar
                      </Button>
                      <Button
                        variant={resolutions[item.existing.id] === 'ignore' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleResolutionChange(item.existing.id, 'ignore')}
                      >
                        Ignorar
                      </Button>
                    </div>
                  </div>
                </div>
                {resolutions[item.existing.id] === 'duplicate' && (
                  <div className="mt-2 flex items-center gap-2">
                    <Label htmlFor={`quantity-${item.existing.id}`} className="text-sm">
                      Quantidade:
                    </Label>
                    <Input
                      type="number"
                      id={`quantity-${item.existing.id}`}
                      defaultValue={item.imported.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.existing.id, parseInt(e.target.value))
                      }
                      className="w-20 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={resolveDuplicates} disabled={!canResolve}>
          Confirmar
        </Button>
      </CardFooter>
    </Card>
  );
};
