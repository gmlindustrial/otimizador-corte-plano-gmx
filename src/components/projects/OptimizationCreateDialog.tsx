import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { usePerfilService } from '@/hooks/services/usePerfilService';

interface OptimizationCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, barLength: number, perfilId?: string) => void;
}

export const OptimizationCreateDialog = ({ open, onOpenChange, onCreate }: OptimizationCreateDialogProps) => {
  const [name, setName] = useState('');
  const [barLength, setBarLength] = useState('6000');
  const [perfilId, setPerfilId] = useState('');
  const [loading, setLoading] = useState(false);
  const { perfis } = usePerfilService();

  const handleSubmit = () => {
    if (!name) return;
    setLoading(true);
    try {
      onCreate(name, parseInt(barLength, 10), perfilId || undefined);
      onOpenChange(false);
      setName('');
      setPerfilId('');
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
            <Label htmlFor="perfil">Perfil do Material (Opcional)</Label>
            <Select value={perfilId} onValueChange={setPerfilId}>
              <SelectTrigger id="perfil">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum perfil específico</SelectItem>
                {perfis.map((perfil) => (
                  <SelectItem key={perfil.id} value={perfil.id}>
                    {perfil.descricao_perfil} ({perfil.tipo_perfil})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
