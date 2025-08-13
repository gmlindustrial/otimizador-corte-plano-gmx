import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { projetoOtimizacaoService } from '@/services/entities/ProjetoOtimizacaoService';
import { toast } from 'sonner';

interface OptimizationReverseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optimization: {
    id: string;
    nome_lista: string;
  } | null;
  onReversed: () => void;
}

export const OptimizationReverseDialog = ({
  open,
  onOpenChange,
  optimization,
  onReversed,
}: OptimizationReverseDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleReverse = async () => {
    if (!optimization) return;

    setLoading(true);
    try {
      const response = await projetoOtimizacaoService.reverseOptimization(optimization.id);
      
      if (response.success) {
        toast.success('Otimização revertida com sucesso. As peças retornaram para a lista de aguardando otimização.');
        onReversed();
        onOpenChange(false);
      } else {
        throw new Error(response.error || 'Erro ao reverter otimização');
      }
    } catch (error: any) {
      console.error('Erro ao reverter otimização:', error);
      toast.error(error.message || 'Erro ao reverter otimização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            Reverter Otimização
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Tem certeza que deseja reverter a otimização{' '}
            <span className="font-semibold">{optimization?.nome_lista}</span>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 mb-2">Esta ação irá:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Retornar todas as peças para o status "Aguardando Otimização"</li>
              <li>• Remover a otimização permanentemente</li>
              <li>• As peças ficarão disponíveis para nova otimização</li>
            </ul>
            <div className="mt-3 p-2 bg-orange-100 rounded border border-orange-300">
              <p className="text-xs text-orange-800 font-medium">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReverse}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Revertendo...
              </>
            ) : (
              'Reverter Otimização'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};