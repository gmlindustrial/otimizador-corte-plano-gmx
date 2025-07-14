import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface OptimizationCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, barLength: number) => void;
}

export const OptimizationCreateDialog = ({ open, onOpenChange, onCreate }: OptimizationCreateDialogProps) => {
  const [name, setName] = useState('');
  const [barLength, setBarLength] = useState('6000');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!name) return;
    setLoading(true);
    try {
      onCreate(name, parseInt(barLength, 10));
      onOpenChange(false);
      setName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Otimização</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Lista</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bar">Tamanho da Barra</Label>
            <Select value={barLength} onValueChange={(v) => setBarLength(v)}>
              <SelectTrigger id="bar">
                <SelectValue placeholder="Tamanho da barra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6000">6000mm</SelectItem>
                <SelectItem value="12000">12000mm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={loading || !name}>
            {loading ? 'Criando...' : 'Criar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
