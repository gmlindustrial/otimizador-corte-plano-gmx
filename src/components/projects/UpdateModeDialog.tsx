import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, FileCheck, AlertTriangle } from 'lucide-react';

interface UpdateModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeSelect: (mode: 'update' | 'new') => void;
  stats: {
    existing: number;
    inOptimizations: number;
    new: number;
    total: number;
  };
}

export const UpdateModeDialog = ({ open, onOpenChange, onModeSelect, stats }: UpdateModeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Peças Detectadas no Arquivo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total de Peças</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Novas Peças</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.new}</div>
              </CardContent>
            </Card>
          </div>

          {(stats.existing > 0 || stats.inOptimizations > 0) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Peças Existentes Detectadas:</h4>
              
              {stats.existing > 0 && (
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    {stats.existing} peça{stats.existing > 1 ? 's' : ''} já existe{stats.existing > 1 ? 'm' : ''} no projeto
                  </span>
                  <Badge variant="secondary">{stats.existing}</Badge>
                </div>
              )}
              
              {stats.inOptimizations > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    {stats.inOptimizations} peça{stats.inOptimizations > 1 ? 's' : ''} em otimizaç{stats.inOptimizations > 1 ? 'ões' : 'ão'} ativa{stats.inOptimizations > 1 ? 's' : ''}
                  </span>
                  <Badge variant="outline">{stats.inOptimizations}</Badge>
                </div>
              )}
            </div>
          )}

          {/* Opções */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Como deseja proceder?</h4>
            
            <div className="grid gap-3">
              {(stats.existing > 0 || stats.inOptimizations > 0) && (
                <Button
                  variant="default"
                  className="h-auto p-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => onModeSelect('update')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <RefreshCw className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Atualizar Existentes</div>
                      <div className="text-sm opacity-90">
                        Atualizar apenas a fase das peças existentes + adicionar novas
                      </div>
                    </div>
                  </div>
                </Button>
              )}
              
              <Button
                variant="outline"
                className="h-auto p-4"
                onClick={() => onModeSelect('new')}
              >
                <div className="flex items-center gap-3 w-full">
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Cadastro Novo</div>
                    <div className="text-sm text-muted-foreground">
                      Ignorar peças existentes e criar todas como novas
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};