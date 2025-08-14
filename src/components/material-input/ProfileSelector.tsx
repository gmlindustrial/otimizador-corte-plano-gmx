
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePerfilService } from '@/hooks/services/usePerfilService';

interface ProfileSelectorProps {
  selectedPerfilId?: string;
  onPerfilChange?: (perfilId: string) => void;
}

export const ProfileSelector = ({ selectedPerfilId, onPerfilChange }: ProfileSelectorProps) => {
  const { perfis } = usePerfilService();

  if (!onPerfilChange) return null;

  return (
    <div className="space-y-2">
      <Label>Perfil do Material (Opcional)</Label>
      <Select value={selectedPerfilId && selectedPerfilId.trim() !== '' ? selectedPerfilId : 'all'} onValueChange={(value) => onPerfilChange(value === 'all' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o perfil para filtrar sobras" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os perfis</SelectItem>
          {perfis.filter(perfil => perfil.id && perfil.id.trim() !== '').map((perfil) => (
            <SelectItem key={perfil.id} value={perfil.id}>
              {perfil.descricao_perfil} ({perfil.tipo_perfil})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedPerfilId && (
        <p className="text-sm text-gray-600">
          Sobras disponíveis serão filtradas por este perfil
        </p>
      )}
    </div>
  );
};
